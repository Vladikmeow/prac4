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
$groups = [];
foreach ($rentItems as $item) {
    $time_start = $item['time_start'];
    $time_end = $item['time_end'];
    $duration = round((strtotime($time_end) - strtotime($time_start)) / 3600);
    if ($duration > 35):
        $duration = $duration / 24 . 'д';
    else:
        $duration = $duration . 'ч';
    endif;
    $tariff = $item['sum'];
    $key = $duration . '|' . $tariff;

    if (!isset($groups[$key])) {
        $groups[$key] = [
            'duration' => $duration,
            'tariff' => $tariff,
            'items' => []
        ];
    }

    $groups[$key]['items'][] = [
        $item['inventories'][0]['inventory']['title'],
    ];
}
$result = array_values($groups);
echo json_encode($result);
?>