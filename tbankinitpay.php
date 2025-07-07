<?php
// Если интегрировать это в компонент Битрикса, структура кода может немного отличаться.
header('Content-Type: application/json; charset=utf-8');
// Вкл отображение ошибок для отладки (ОБЯЗАТЕЛЬНО УДАЛИТЬ на продакшене!)
ini_set('display_errors', 1);
error_reporting(E_ALL);
// --- Данные тестового терминала Т-Банка ---
$terminalKey = '1748429891053DEMO'; // TerminalKey
$secretKey = 'Hm54k%X8zvoHvezo';   // SecretKey
// --- Параметры хуеплатежа (пример, их нужно будет брать из данных заказа/формы, но сумма уже динамична) ---
// В реальной системе эти данные будут динамическими, например, из корзины Битрикса или формы.
$orderId = uniqid('order_'); // Уникальный ID вашего заказа. В реальной системе - ID заказа из Битрикса.
$amount = isset($_POST['amount']) ? (int)$_POST['amount'] : 10000; // Сумма в копейках. 10000 - заглушка по умолчанию.
$description = 'Оплата за товары/услуги по заказу ' . $orderId; // Описание платежа
$email = 'client@example.com'; // E-mail клиента (опционально)
$phone = '+79001234567';     // Телефон клиента (опционально, но вообще надо-бы)
// URL для API Т-Банка
$tinkoffApiUrl = 'https://securepay.tinkoff.ru/v2/Init'; // URL метода Init
// URL, куда Т-Банк перенаправит пользователя после оплаты
// В реальной системе это будут страницы успеха/неудачи на сайте Битрикс.
$successUrl = 'http://ваша_страница_успеха.ru/success.php'; // Замените на реальный URL
$failUrl = 'http://ваша_страница_неудачи.ru/fail.php';     // Замените на реальный URL
// URL, куда Т-Банк будет отправлять серверные уведомления о статусе платежа (Notification). Это очень важный URL!
// (успех, отмена, возврат и т.д.). Этот скрипт будет фиксировать оплаты в CRM, к примеру RiH.
$notificationUrl = 'http://ваша_страница_уведомлений.ru/tinkoff_notification.php'; // Замените на реальный URL
// Форм параметры для запроса
$params = [
    'TerminalKey' => $terminalKey,
    'Amount' => $amount,
    'OrderId' => $orderId,
    'Description' => $description,
    'NotificationURL' => $notificationUrl,
    'SuccessURL' => $successUrl,
    'FailURL' => $failUrl,
    'DATA' => [ // Дополнительные данные, которые вернутся в Notification и Callback!
        'Email' => $email,
        'Phone' => $phone,
        // Сюда можно добавить любые другие нужные параметры, например ID клиента из CRM!
        // 'CRM_CLIENT_ID' => 'ID_клиента_из__CRM'!
    ],
    'Receipt' => [ // Данные для фискализации (онлайн-касса). Очень важно для соответствия ФЗ-54!
                   // Требуется заполнение, если вы работа идёт с онлайн-кассой через Т-Банк!
                   // Это сильно зависит от бизнес-модели и настроек кассы!
                   // Пока можно оставить пустым, если касса не настроена или не нужна для тестового платежа!
        'Email' => $email,
        'Phone' => $phone,
        'Taxation' => 'osn', // Система налогообложения: osn, usn_income, usn_income_outcome, patent, envd, esn!
        'Items' => [
            [
                'Name' => 'Название товара/услуги',
                'Price' => $amount,
                'Quantity' => 1.00,
                'Amount' => $amount,
                'Tax' => 'none', // Ставка НДС: none, vat0, vat10, vat20, vat110, vat120!
                // 'Ean' => '1234567890123' // Код товара (опционально)!
            ]
        ]
    ]
];// Убир пустые поля, чтобы не отправлять в запрос (опционально, но полезно)!
$params = array_filter($params, function($value) {
    return $value !== null && $value !== '';
});
// Для некоторых вложенных массивов также может потребоваться фильтрация!
// Для генерации Token используется хеш всех параметров + SecretKey!
// Важно: порядок полей в массиве для хэширования должен быть отсортирован по ключам (алфавитный порядок)!
// и SecretKey добавляется последним!
function generateTinkoffToken($params, $secretKey) {
    $tempParams = $params;
    $tempParams['Password'] = $secretKey; // SecretKey для хеширования!
    ksort($tempParams); // Сорт по ключам!

    $stringToHash = '';
    foreach ($tempParams as $key => $value) {
        // Пропуск 'Receipt' и 'DATA' при хешировании для метода Init, если они являются массивами/объектами!
        // Смотрите документацию самого Т-Банка для точного списка полей, которые НЕ участвуют в хешировании!
        // Для Init это обычно 'Receipt', 'DATA', 'Payments'!
        if (is_array($value) || is_object($value)) {
            continue;
        }
        $stringToHash .= $value;
    }

    return hash('sha256', $stringToHash);
}
// Токен!
$params['Token'] = generateTinkoffToken($params, $secretKey);
// SecretKey НЕ ДОЛЖЕН отправляться в Т-Банк! Удаление его из параметров должно происходить перед отправкой!
unset($params['Password']);
// Отправка запроса API Т-Банка!
$ch = curl_init($tinkoffApiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($params));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);

if (curl_errno($ch)) {
    $error_msg = curl_error($ch);
    error_log("Tinkoff API error: " . $error_msg); // Запись ошибки в логи!
    echo json_encode(['status' => 'error', 'message' => 'Ошибка cURL: ' . $error_msg]);
} else {
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $responseData = json_decode($response, true);
    if ($http_code == 200 && isset($responseData['Success']) && $responseData['Success'] === true) {// Платеж успешно зарегистрирован!
        echo json_encode([
            'status' => 'success',
            'paymentId' => $responseData['PaymentId'],
            'paymentUrl' => $responseData['PaymentURL'],
            'orderId' => $orderId // ID заказа для использования на фронтенде!
        ]);
    } else {// Ошибка от API Т-Банка!
        $error_message = $responseData['Details'] ?? ($responseData['Message'] ?? 'Неизвестная ошибка');
        error_log("Tinkoff API response error: " . $error_message . " Response: " . $response); // Запись ошибки в логи!
        echo json_encode([
            'status' => 'error',
            'message' => 'Ошибка Т-Банка: ' . $error_message,
            'response' => $responseData
        ]);
    }
}
curl_close($ch);
?>