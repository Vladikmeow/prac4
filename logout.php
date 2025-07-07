<?php
session_start();
session_unset();
session_destroy();
setcookie(session_name(), '', time() - 3600, '/');
header('Content-Type: application/json');
echo json_encode(['success' => true, 'message' => 'Выход выполнен успешно.']);
exit();
?>