<?php
$lifetime = 60 * 60 * 24 * 365 * 10; // 10 лет в секундах!!!
session_set_cookie_params($lifetime);
session_start();
header('Content-Type: application/json');
// обработка
$phone = $_POST['phone'] ?? '';
$method = $_POST['method'] ?? 'sms'; // 'sms' или 'call'
$phone = preg_replace('/[^0-9+]/', '', $phone);

if (empty($phone)) {
    echo json_encode(['success' => false, 'error' => 'Введите номер телефона']);
    exit;
}
// генерация
$code = str_pad(mt_rand(0, 9999), 4, '0', STR_PAD_LEFT);
// тип отправки
$route = ($method === 'call') ? 'fcall' : 'sms'; 
$message = ($method === 'call') ? $code : "Ваш код подтверждения: $code";
// api ключи и все такое
$login = 'Colizeum.br';
$api_key = 'JvnLpCssdwRQFGAnPjKEpBxV';
$ts = time();
$secret = md5($ts . $api_key);

$headers = [
    'login: ' . $login,
    'ts: ' . $ts,
    'secret: ' . $secret,
    'Content-type: application/json'
];

$data = [
    'route' => $route,
    'to' => $phone,
    'text' => $message
];
// добавляем отправителя только для SMS
if ($route !== 'fcall') {
    $data['from'] = 'NickyBike';
}
// Отправка cURL
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => 'https://cp.redsms.ru/api/message',
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_POSTFIELDS => json_encode($data),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_TIMEOUT => 10
]);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
// обработк ответа
if ($http_code == 200) {
    $result = json_decode($response, true);
    if ($result['success'] ?? false) {
        // Сохраняем код в файл
        $logEntry = [
            'phone' => $phone,
            'code' => $code,
            'method' => $method,
            'created_at' => time()
        ];
        file_put_contents('codes.log', json_encode($logEntry) . PHP_EOL, FILE_APPEND);
        echo json_encode(['success' => true]);
        exit;
    }
}
// ошибки
$error = 'Неизвестная ошибка';
if ($response) {
    $result = json_decode($response, true);
    $error = $result['error_message'] ?? $error;
    if (isset($result['ips'])) {
        $error .= " IP: " . implode(', ', $result['ips']);
    }
}

echo json_encode(['success' => false, 'error' => $error]);
?>