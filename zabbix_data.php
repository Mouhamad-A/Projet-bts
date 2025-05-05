<?php
// Configuration Zabbix
$zabbixUrl = 'http://192.168.1.170/zabbix/api_jsonrpc.php';
$token = 'b75d1d8772186943fd7008155b7602509a7445d82c21e1ad0a30de35967d9fac';

// Headers communs pour toutes les requêtes
$headers = [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $token
];

// Préparation de la requête pour obtenir les hôtes
$request = [
    'jsonrpc' => '2.0',
    'method' => 'host.get',
    'params' => [
        'output' => ['hostid', 'host', 'name', 'status'],
        'selectInterfaces' => ['ip'],
        'selectInventory' => ['location'] // Pour avoir l'adresse depuis l'inventaire comme fallback
    ],
    'id' => 1
];

// Initialisation de cURL
$ch = curl_init($zabbixUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($request));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

$response = curl_exec($ch);

if (curl_errno($ch)) {
    echo json_encode(['error' => curl_error($ch)]);
    exit;
}

curl_close($ch);

// Traitement de la réponse
$result = json_decode($response, true);
$data = [];

if (!empty($result['result'])) {
    // Récupérer d'abord les macros globales
    $globalMacroRequest = [
        'jsonrpc' => '2.0',
        'method' => 'usermacro.get',
        'params' => [
            'globalmacro' => true
        ],
        'id' => 2
    ];

    $ch2 = curl_init($zabbixUrl);
    curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch2, CURLOPT_POSTFIELDS, json_encode($globalMacroRequest));
    curl_setopt($ch2, CURLOPT_HTTPHEADER, $headers);

    $globalMacroResponse = curl_exec($ch2);
curl_close($ch2);

    $globalMacros = [];
    $globalMacroResult = json_decode($globalMacroResponse, true);

    if (!empty($globalMacroResult['result'])) {
        foreach ($globalMacroResult['result'] as $macro) {
            $globalMacros[$macro['macro']] = $macro['value'];
        }
    }

    // Traiter chaque hôte
    foreach ($result['result'] as $host) {
        // Traduction du statut Zabbix (0 = enabled, 1 = disabled)
        switch ($host['status']) {
            case '0':
            case 0:
                $statusText = 'connected';
                break;
            case '1':
            case 1:
                $statusText = 'disconnected';
                break;
            default:
                $statusText = 'unknown';
        }

        $ip = $host['interfaces'][0]['ip'] ?? 'N/A';

        // Récupération des macros spécifiques à l'hôte
        $hostMacroRequest = [
            'jsonrpc' => '2.0',
            'method' => 'usermacro.get',
            'params' => [
                'hostids' => [$host['hostid']]
            ],
            'id' => 3
        ];

        $ch3 = curl_init($zabbixUrl);
        curl_setopt($ch3, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch3, CURLOPT_POSTFIELDS, json_encode($hostMacroRequest));
        curl_setopt($ch3, CURLOPT_HTTPHEADER, $headers);

        $hostMacroResponse = curl_exec($ch3);
        curl_close($ch3);

        $hostMacroResult = json_decode($hostMacroResponse, true);

        // Valeurs par défaut
        $lat = 48.8566;
        $lon = 2.3522;
        $address = !empty($host['inventory']['location']) ? $host['inventory']['location'] : 'Adresse non spécifiée';

        // Chercher dans les macros de l'hôte
        if (!empty($hostMacroResult['result'])) {
            foreach ($hostMacroResult['result'] as $macro) {
                // Vérifier plusieurs formats possibles de macros
				 if (in_array($macro['macro'], ['{$LAT}', '{$LATITUDE}'])) {
                    $lat = floatval($macro['value']);
                } elseif (in_array($macro['macro'], ['{$LON}', '{$LONGITUDE}'])) {
                    $lon = floatval($macro['value']);
                } elseif (in_array($macro['macro'], ['{$ADDRESS}', '{$ADRESSE}', '{$LOCATION}'])) {
                    $address = $macro['value'];
                }
            }
        }

        // Utiliser les macros globales si les macros spécifiques ne sont pas définies
        if ($address === 'Adresse non spécifiée') {
            foreach (['{$ADDRESS}', '{$ADRESSE}', '{$LOCATION}'] as $macroName) {
                if (isset($globalMacros[$macroName])) {
                    $address = $globalMacros[$macroName];
                    break;
                }
            }
        }

        // Ajouter des informations de débogage temporaire
        $debug = [
            'hostMacros' => $hostMacroResult['result'] ?? [],
            'globalMacros' => $globalMacros
        ];

        $data[] = [
            'name' => $host['name'],
            'ip' => $ip,
            'lat' => $lat,
            'lon' => $lon,
            'status' => $statusText,
            'address' => $address,
            'debug' => $debug // Temporaire pour diagnostiquer le problème
        ];
    }
}

// Envoi du résultat en JSON
header('Content-Type: application/json');
echo json_encode($data);
