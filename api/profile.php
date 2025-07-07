<?php
$lifetime = 60 * 60 * 24 * 365 * 10; // 10 лет в секундах!!!
session_set_cookie_params($lifetime);
session_start();
header('Content-Type: application/json');
include 'functions.php';
$data = [
    'login' => 'u7a31_n.maslennikov',
    'password' => '12345678',
    //'phone' => '+7 900 357 48 98' //Телефон для теста.
];
$token = getToken();
$user_phone = null;

if (isset($_SESSION['authenticated_phone']) && !empty($_SESSION['authenticated_phone'])) {
    $user_phone = $_SESSION['authenticated_phone'];
}// Если номера телефона нет в сессии, пользователь не авторизован!
if (empty($user_phone)) {
    echo json_encode(['error' => 'Пользователь не авторизован или номер телефона не подтверждён.']);
    exit();
}

$result = findClientByPhone($user_phone, $token);
$clientData = $result['data'];
$clientId = $clientData[0]['human']['id'];
$_SESSION['id'] = $clientId;

if (!empty($clientData)) {
    $client = $clientData[0];
    $email = $client['contacts'][1]['EMAIL'] ?? 'Нет почты';
    $profile = [
        'account_id' => $client['id'],
        'full_name' => $client['human']['fio'],
        'address' => $client['address'],
        'phone' => $user_phone, // Используется подтверждённый номер из сессии!
        'email' => $email
    ];
    echo json_encode($profile);
}