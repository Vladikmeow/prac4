<?php
/**
 * Приём заявок с сайта → инфоблок ID=4
 * Ожидает POST‑поля:  name, phone, source
 * Возвращает JSON:   { success:true } или { success:false, error:"…" }
 */

/* ── системные константы, чтобы не плодить статистику ───────────── */
define('NO_KEEP_STATISTIC', 'Y');
define('NO_AGENT_STATISTIC','Y');
define('DisableEventsCheck', true);

require($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/include/prolog_before.php');
header('Content-Type: application/json; charset=utf-8');

use Bitrix\Main\Loader;
use CIBlockElement;

/* ── базовая валидация входящих данных ──────────────────────────── */
$name   = isset($_POST['name'])   ? trim(strip_tags($_POST['name']))   : '';
$phone  = isset($_POST['phone'])  ? preg_replace('/[^\d\+]/', '', $_POST['phone']) : '';
$source = isset($_POST['source']) ? trim(strip_tags($_POST['source'])) : '';

if ($name === '' || $phone === '' || $source === '') {
    echo json_encode(['success' => false, 'error' => 'Пустые поля']);
    die;
}

/* ── подключаем модуль инфоблоков ───────────────────────────────── */
if (!Loader::includeModule('iblock')) {
    echo json_encode(['success' => false, 'error' => 'Модуль iblock не подключен']);
    die;
}

/* ── добавляем элемент ─────────────────────────────────────────── */
$IBLOCK_ID = 4;                       // ← твой инфоблок
$dateNow   = date('Y-m-d H:i:s');

$el = new CIBlockElement;

$arFields = [
    'IBLOCK_ID' => $IBLOCK_ID,
    'NAME'      => 'Заявка: '.$source.' ('.$name.')',
    'ACTIVE'    => 'Y',
    'PROPERTY_VALUES' => [
        'NAME_F' => $name,
        'PHONE'  => $phone,
        'SOURCE' => $source,
        'DATE'   => $dateNow,
    ],
];

$ID = $el->Add($arFields);

if ($ID) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => $el->LAST_ERROR]);
}
?>
