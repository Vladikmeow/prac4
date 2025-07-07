<?php
// простой лог в файл + ответ браузеру
$name   = htmlspecialchars($_POST['name']   ?? '');
$phone  = htmlspecialchars($_POST['phone']  ?? '');
$source = htmlspecialchars($_POST['source'] ?? '');

$line = date('Y-m-d H:i:s')." | $source | $name | $phone\n";
file_put_contents(__DIR__.'/leads.log', $line, FILE_APPEND);

header('Content-Type: application/json; charset=utf-8');
echo json_encode(['success' => true]);
