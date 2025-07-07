<?php
session_start();
header('Content-Type: application/json');
if (isset($_SESSION['authenticated_phone']) && !empty($_SESSION['authenticated_phone'])) {
    echo json_encode(['authenticated' => true]);
} else {
    echo json_encode(['authenticated' => false]);
}
?>