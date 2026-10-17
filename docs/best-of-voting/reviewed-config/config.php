<?php
/**
 * Local LimeSurvey trial runtime configuration.
 * Based on the upstream config-sample-mysql.php format.
 * Requires a separately provisioned, database-scoped account.
 * This file does not install the database or create an administrator.
 */
if (!defined('BASEPATH')) {
    http_response_code(403);
    exit;
}

$databasePassword = getenv('BESTOF_DB_PASSWORD');
if (!is_string($databasePassword) || $databasePassword === '') {
    throw new RuntimeException('Required database credential is not configured.');
}

return [
    'components' => [
        'db' => [
            'connectionString' => 'mysql:host=127.0.0.1;port=3309;dbname=bestof_trial;',
            'emulatePrepare' => true,
            'username' => 'bestof_app',
            'password' => $databasePassword,
            'charset' => 'utf8mb4',
            'tablePrefix' => 'lime_',
        ],
        'urlManager' => [
            'urlFormat' => 'path',
            'rules' => [],
            'showScriptName' => true,
        ],
    ],
    'config' => [
        'debug' => 0,
        'debugsql' => 0,
        'sitename' => 'Best Of Okoboji — Private Voting Trial',
        'RPCInterface' => 'off',
        'updatecheckperiod' => 7,
    ],
];
