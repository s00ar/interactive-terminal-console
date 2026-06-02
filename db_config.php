<?php
declare(strict_types=1);

function get_app_config(): array
{
    $config = [];
    $configPath = __DIR__ . "/app_secrets.php";

    if (is_file($configPath)) {
        $loaded = require $configPath;
        if (is_array($loaded)) {
            $config = $loaded;
        }
    }

    $envDb = normalize_db_config([
        "host" => env_value("APP_DB_HOST"),
        "port" => env_value("APP_DB_PORT"),
        "name" => env_value("APP_DB_NAME"),
        "user" => env_value("APP_DB_USER"),
        "pass" => env_value("APP_DB_PASSWORD")
    ]);

    if (is_complete_db_config($envDb)) {
        $config["db"] = $envDb;
    } elseif (isset($config["db"]) && is_array($config["db"])) {
        $config["db"] = normalize_db_config($config["db"]);
    }

    $deployHookToken = env_value("DEPLOY_HOOK_TOKEN");
    if ($deployHookToken !== null) {
        $config["deploy_hook_token"] = $deployHookToken;
    }

    return $config;
}

function get_db_config(): array
{
    $hostName = strtolower((string)($_SERVER["HTTP_HOST"] ?? ""));
    $isLocal = $hostName === "" || str_contains($hostName, "localhost") || str_contains($hostName, "127.0.0.1");

    $localConfig = [
        "host" => "127.0.0.1",
        "port" => 3306,
        "name" => "u969616855_rpginterface",
        "user" => "root",
        "pass" => ""
    ];

    $appConfig = get_app_config();
    $configuredDb = is_array($appConfig["db"] ?? null)
        ? normalize_db_config($appConfig["db"])
        : [];

    if (is_complete_db_config($configuredDb)) {
        return $configuredDb;
    }

    if ($isLocal) {
        return $localConfig;
    }

    throw new RuntimeException(
        "Database configuration is missing. Provide app_secrets.php or APP_DB_* environment variables."
    );
}

function get_deploy_hook_token(): string
{
    $appConfig = get_app_config();
    return trim((string)($appConfig["deploy_hook_token"] ?? ""));
}

function env_value(string $name): ?string
{
    $value = getenv($name);
    if ($value === false) {
        return null;
    }

    return (string)$value;
}

function normalize_db_config(array $config): array
{
    $normalized = [];

    if (array_key_exists("host", $config)) {
        $normalized["host"] = trim((string)$config["host"]);
    }
    if (array_key_exists("port", $config)) {
        $normalized["port"] = (int)$config["port"];
    }
    if (array_key_exists("name", $config)) {
        $normalized["name"] = trim((string)$config["name"]);
    }
    if (array_key_exists("user", $config)) {
        $normalized["user"] = trim((string)$config["user"]);
    }
    if (array_key_exists("pass", $config)) {
        $normalized["pass"] = (string)$config["pass"];
    }

    return $normalized;
}

function is_complete_db_config(array $config): bool
{
    return ($config["host"] ?? "") !== ""
        && ($config["port"] ?? 0) > 0
        && ($config["name"] ?? "") !== ""
        && ($config["user"] ?? "") !== ""
        && array_key_exists("pass", $config);
}

function db_connect(): PDO
{
    $cfg = get_db_config();
    $dsn = sprintf(
        "mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4",
        $cfg["host"],
        $cfg["port"],
        $cfg["name"]
    );

    return new PDO(
        $dsn,
        $cfg["user"],
        $cfg["pass"],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
}
