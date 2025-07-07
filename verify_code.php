<?php
$lifetime = 60 * 60 * 24 * 365 * 10; // 10 лет в секундах!!!
session_set_cookie_params($lifetime);
session_start();
header('Content-Type: application/json');

$phone = $_POST['phone'] ?? '';
$code = $_POST['code'] ?? '';
$phone = preg_replace('/[^0-9+]/', '', $phone);

if (empty($phone) || empty($code)) {
    echo json_encode(['success' => false, 'error' => 'Не указан телефон или код']);
    exit;
}
// поиск кода в логе
$found = false;
$codes = file('codes.log', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

foreach ($codes as $entry) {
    $data = json_decode($entry, true);
    if ($data && 
        $data['phone'] === $phone && 
        $data['code'] === $code &&
        (time() - $data['created_at'] <= 300) // Код действителен 5 минут
    ) {
        $found = true;
        break;
    }
}

if ($found) {
    // Сохранение подтверждённого номера телефона в сессию!
    $_SESSION['authenticated_phone'] = $phone;
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Неверный код или время истекло']);
}
?>