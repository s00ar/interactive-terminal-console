<?php
declare(strict_types=1);

header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Expires: 0");
header("X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex");
header("Referrer-Policy: no-referrer");

require_once __DIR__ . "/db_config.php";

try {
    $pdo = db_connect();
    ensure_schema($pdo);
    ensure_seed_data($pdo);

    $method = $_SERVER["REQUEST_METHOD"] ?? "GET";
    $action = $_GET["action"] ?? "bootstrap";

    if ($method === "GET" && $action === "bootstrap") {
        respond_json([
            "ok" => true,
            "users" => load_users($pdo),
            "evidence" => load_evidence($pdo)
        ]);
    }

    if ($method === "POST" && $action === "save-evidence") {
        $body = read_json_body();
        $evidence = $body["evidence"] ?? null;
        if (!is_array($evidence)) {
            respond_json(["ok" => false, "error" => "Invalid evidence payload"], 400);
        }
        save_evidence($pdo, $evidence);
        respond_json(["ok" => true]);
    }

    if ($method === "POST" && $action === "save-users") {
        $body = read_json_body();
        $users = $body["users"] ?? null;
        if (!is_array($users)) {
            respond_json(["ok" => false, "error" => "Invalid users payload"], 400);
        }
        save_users($pdo, $users);
        respond_json(["ok" => true]);
    }

    respond_json(["ok" => false, "error" => "Unknown route"], 404);
} catch (Throwable $error) {
    respond_json(["ok" => false, "error" => $error->getMessage()], 500);
}

function ensure_schema(PDO $pdo): void
{
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            username VARCHAR(120) PRIMARY KEY,
            display_name VARCHAR(120) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role_name VARCHAR(20) NOT NULL DEFAULT 'user',
            access_label VARCHAR(120) NOT NULL DEFAULT 'INVESTIGADOR',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS evidence (
            id VARCHAR(120) PRIMARY KEY,
            command_code VARCHAR(120) NOT NULL,
            payload_json LONGTEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_command_code (command_code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
}

function ensure_seed_data(PDO $pdo): void
{
    $usersCount = (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    if ($usersCount === 0) {
        $users = read_users_file();
        save_users($pdo, $users);
    }

    $evidenceCount = (int)$pdo->query("SELECT COUNT(*) FROM evidence")->fetchColumn();
    if ($evidenceCount === 0) {
        $evidence = read_evidence_file();
        save_evidence($pdo, $evidence);
    }
}

function load_users(PDO $pdo): array
{
    $stmt = $pdo->query("SELECT username, display_name, password_hash, role_name, access_label FROM users ORDER BY username ASC");
    $out = [];
    foreach ($stmt as $row) {
        $out[$row["username"]] = [
            "displayName" => $row["display_name"],
            "password" => $row["password_hash"],
            "role" => $row["role_name"],
            "accessLabel" => $row["access_label"]
        ];
    }
    return $out;
}

function load_evidence(PDO $pdo): array
{
    $stmt = $pdo->query("SELECT payload_json FROM evidence ORDER BY command_code ASC");
    $rows = [];
    foreach ($stmt as $row) {
        $decoded = json_decode((string)$row["payload_json"], true);
        if (is_array($decoded)) {
            $rows[] = $decoded;
        }
    }
    return $rows;
}

function save_users(PDO $pdo, array $users): void
{
    $pdo->beginTransaction();
    try {
        $pdo->exec("DELETE FROM users");
        $stmt = $pdo->prepare("
            INSERT INTO users (username, display_name, password_hash, role_name, access_label)
            VALUES (:username, :display_name, :password_hash, :role_name, :access_label)
        ");

        foreach ($users as $username => $user) {
            if (!is_array($user)) {
                continue;
            }
            $cleanUsername = normalize_username((string)$username);
            if ($cleanUsername === "") {
                continue;
            }
            $stmt->execute([
                ":username" => $cleanUsername,
                ":display_name" => (string)($user["displayName"] ?? $cleanUsername),
                ":password_hash" => (string)($user["password"] ?? ""),
                ":role_name" => (string)($user["role"] ?? "user"),
                ":access_label" => (string)($user["accessLabel"] ?? "INVESTIGADOR")
            ]);
        }
        $pdo->commit();
    } catch (Throwable $error) {
        $pdo->rollBack();
        throw $error;
    }
}

function save_evidence(PDO $pdo, array $evidence): void
{
    $pdo->beginTransaction();
    try {
        $pdo->exec("DELETE FROM evidence");
        $stmt = $pdo->prepare("
            INSERT INTO evidence (id, command_code, payload_json)
            VALUES (:id, :command_code, :payload_json)
        ");

        foreach ($evidence as $entry) {
            if (!is_array($entry)) {
                continue;
            }
            $id = trim((string)($entry["id"] ?? ""));
            $command = trim((string)($entry["command"] ?? ""));
            if ($id === "" || $command === "") {
                continue;
            }

            $stmt->execute([
                ":id" => $id,
                ":command_code" => strtolower($command),
                ":payload_json" => json_encode($entry, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            ]);
        }
        $pdo->commit();
    } catch (Throwable $error) {
        $pdo->rollBack();
        throw $error;
    }
}

function read_users_file(): array
{
    $path = __DIR__ . "/data/users.json";
    if (!is_file($path)) {
        return [];
    }
    $decoded = json_decode((string)file_get_contents($path), true);
    return is_array($decoded) ? $decoded : [];
}

function read_evidence_file(): array
{
    $path = __DIR__ . "/data/evidence.json";
    if (!is_file($path)) {
        return [];
    }
    $decoded = json_decode((string)file_get_contents($path), true);
    return is_array($decoded) ? $decoded : [];
}

function read_json_body(): array
{
    $raw = (string)file_get_contents("php://input");
    if ($raw === "") {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function normalize_username(string $value): string
{
    $value = trim(strtolower($value));
    $value = preg_replace('/\s+/', ' ', $value) ?? "";
    return $value;
}

function respond_json(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
