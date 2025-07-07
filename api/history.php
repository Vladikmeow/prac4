<?php
$lifetime = 60 * 60 * 24 * 365 * 10; // 10 лет в секундах!!!
session_set_cookie_params($lifetime);
session_start();
header('Content-Type: application/json');
include 'functions.php';
/*$data = [
    'phone' => '+7 900 357 48 98' //Телефон для теста.
];*/
$token = getToken();
$user_phone = null;
if (isset($_SESSION['authenticated_phone']) && !empty($_SESSION['authenticated_phone'])) {
    $user_phone = $_SESSION['authenticated_phone'];
}
if (empty($user_phone)) {
    echo json_encode(['error' => 'Пользователь не авторизован или номер телефона не подтверждён.', 'data' => []]);
    exit();
}

$result = findClientByPhone($user_phone, $token);
$clientData = $result['data'];
$clientId = $clientData[0]['human']['id'];
$_SESSION['id'] = $clientId;
$responseRentItems = getRentItems($token, $clientId);
$rentItems = $responseRentItems['data'];
$financialSummary = getClientFinancialSummary($rentItems);
$groups = [];
$allClientPayments = $financialSummary['allClientPayments'];

if (!empty($allClientPayments)):
    foreach ($allClientPayments as $payment):
        $amount = $payment['value'];
        if ($amount > 0):
            $amount = '+' . $amount;
        endif;
        $date = $payment['date'];
        $key = $amount . '|' . $date;
        if (!isset($groups[$key])) {
            $groups[$key] = [
                'amount' => $amount . '₽',
                'date' => $date,
            ];
        }
    endforeach;
else:
    $amount = 'Истории не найдено';
    $date = date('Y-m-d');
endif;
$result = array_values($groups);

echo json_encode($result);