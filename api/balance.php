<?php
$lifetime = 60 * 60 * 24 * 365 * 10; // 10 лет в секундах!!!
session_set_cookie_params($lifetime);
session_start();
header('Content-Type: application/json');
include 'functions.php';
header('Content-Type: application/json');
/*$data = [
    'phone' => '+7 900 357 48 98' //Телефон для теста.
];*/
$token = getToken();
$user_phone = null;

if (isset($_SESSION['authenticated_phone']) && !empty($_SESSION['authenticated_phone'])) {
    $user_phone = $_SESSION['authenticated_phone'];
}// Если номера телефона нет в сессии, пользователь не авторизован!
if (empty($user_phone)) {
    echo json_encode(['error' => 'Пользователь не авторизован или номер телефона не подтверждён.', 'amount' => 0]);
    exit();
}

$result = findClientByPhone($user_phone, $token);
$clientData = $result['data'];
$clientId = $clientData[0]['human']['id'];
$_SESSION['id'] = $clientId;
$responseRentItems = getRentItems($token, $clientId);
$rentItems = $responseRentItems['data'];
$financialSummary = getClientFinancialSummary($rentItems);
echo json_encode(['amount' => $financialSummary['balance']]);