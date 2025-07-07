<?php
function login($login, $password) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.rentinhand.ru/v2/login');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
    $data = [
        'login' => $login,
        'password' => $password
    ];
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    //ssl
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    $response = curl_exec($ch);
    curl_close($ch);
    return (json_decode($response, true))['data']['access_token'];
}


function findClientByPhone($phone, $token) {
    $phone = preg_replace('/[^0-9]/', '', $phone);

    if (strlen($phone) == 11 && ($phone[0] == '8' || $phone[0] == '7')) {
        $phone = '+7' . substr($phone, 1);
    } elseif (strlen($phone) == 10) {
        $phone = '+7' . $phone;
    } else {
        return ['error' => 'Неверный формат номера телефона. Используйте 10 или 11 цифр.'];
    }

    $phone = substr($phone, 0, 2) . ' ' . substr($phone, 2, 3) . ' ' . substr($phone, 5, 3) . ' ' . substr($phone, 8, 2) . ' ' . substr($phone, 10, 2);
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.rentinhand.ru/v2/human/client?search=' . urlencode($phone));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $token, 'Accept: application/json']);
    //ssl

    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    $response = curl_exec($ch);


    if (empty(json_decode($response, true)['data'])): //Если по какой-либо причине телефоны не +* *** *** ** **, а +***********
        $phone = '+' . preg_replace('/[^0-9]/', '', $phone);
        curl_setopt($ch, CURLOPT_URL, 'https://api.rentinhand.ru/v2/human/client?search=' . urlencode($phone));
        $response = curl_exec($ch);
    endif;

    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return json_decode($response, true);
}

function getRentItems($token, $clientId = null) {
    $url = 'https://api.rentinhand.ru/v2/rent';

    if ($clientId !== null) {
        $url .= '?client_human_id=' . $clientId;
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $token, 'Accept: application/json']);
    //ssl
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
}

function getClientFinancialSummary(array $rentItems): array
{
    $totalPaid = 0;
    $totalOwed = 0;
    $allClientPayments = [];
    foreach ($rentItems as $item) {
        $totalPaid += ($item['payed'] ?? 0);// Оплачено по конретному договору!
        $totalOwed += ($item['sum'] ?? 0);// Общая его сумма!
        // История зачислений
        if (!empty($item['payments'])) {
            foreach ($item['payments'] as $payment) {
                $allClientPayments[] = [
                    'date' => $payment['date'] ?? 'Неизвестно',
                    'value' => $payment['value'] ?? 0
                ];
            }
        }
    }

    return [
        'balance' => $totalPaid - $totalOwed,
        'allClientPayments' => $allClientPayments
    ];
}

function getToken()
{
    $tokenFile = 'token.json';
    $config = [
        'admin_login' => 'u7a31_n.maslennikov',
        'admin_password' => '12345678'
    ];
    if (file_exists($tokenFile)) {
        $tokenData = json_decode(file_get_contents($tokenFile), true);
        if ($tokenData['expires_at'] > time()) {
            $token = $tokenData['token'];
        } else {
            $token = login($config['admin_login'], $config['admin_password']);
            $expires_in = 3600;
            file_put_contents($tokenFile, json_encode([
                'token' => $token,
                'expires_at' => time() + $expires_in
            ]));
        }
    } else {
        $token = login($config['admin_login'], $config['admin_password']);
        $expires_in = 3600;
        file_put_contents($tokenFile, json_encode([
            'token' => $token,
            'expires_at' => time() + $expires_in
        ]));
    }
    return $token;
}