param(
    [string]$OutputRoot = (Join-Path $PSScriptRoot "build"),
    [switch]$SkipSecretsFile
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$siteRoot = Join-Path $OutputRoot "site"
$sqlPath = Join-Path $OutputRoot "database.sql"
$zipPath = Join-Path $OutputRoot "site.zip"

$deployPaths = @(
    ".htaccess",
    "api.php",
    "app.js",
    "assets",
    "data",
    "db_config.php",
    "deploy_sync.php",
    "index.html",
    "robots.txt",
    "styles.css"
)

function Write-Info([string]$Message) {
    Write-Host "[build-release] $Message"
}

function Assert-RequiredPath([string]$RelativePath) {
    $fullPath = Join-Path $repoRoot $RelativePath
    if (-not (Test-Path -LiteralPath $fullPath)) {
        throw "Required path is missing: $RelativePath"
    }
}

function ConvertTo-PhpSingleQuotedString([AllowEmptyString()][string]$Value) {
    return "'" + ($Value -replace "'", "''") + "'"
}

function ConvertTo-SqlLiteral($Value) {
    if ($null -eq $Value) {
        return "NULL"
    }

    $text = [string]$Value
    $text = $text -replace "'", "''"
    return "'" + $text + "'"
}

function New-Directory([string]$Path) {
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
}

function Copy-DeployPath([string]$RelativePath) {
    $source = Join-Path $repoRoot $RelativePath
    $destination = Join-Path $siteRoot $RelativePath
    $destinationParent = Split-Path -Parent $destination
    if ($destinationParent) {
        New-Directory $destinationParent
    }

    if ((Get-Item -LiteralPath $source) -is [System.IO.DirectoryInfo]) {
        Copy-Item -LiteralPath $source -Destination $destination -Recurse -Force
        return
    }

    Copy-Item -LiteralPath $source -Destination $destination -Force
}

function Get-UserEntries() {
    $usersPath = Join-Path $repoRoot "data\users.json"
    $decoded = Get-Content -LiteralPath $usersPath -Raw | ConvertFrom-Json
    $entries = @()

    foreach ($property in $decoded.PSObject.Properties) {
        $entries += [pscustomobject]@{
            Username = [string]$property.Name
            User = $property.Value
        }
    }

    return $entries | Sort-Object Username
}

function Get-EvidenceEntries() {
    $evidencePath = Join-Path $repoRoot "data\evidence.json"
    $decoded = Get-Content -LiteralPath $evidencePath -Raw | ConvertFrom-Json
    return @($decoded) | Sort-Object { [string]$_.command }, { [string]$_.id }
}

function Write-SecretsFile() {
    $dbHost = [string]$env:APP_DB_HOST
    $dbPort = [string]$env:APP_DB_PORT
    $dbName = [string]$env:APP_DB_NAME
    $dbUser = [string]$env:APP_DB_USER
    $dbPassword = [string]$env:APP_DB_PASSWORD
    $deployHookToken = [string]$env:DEPLOY_HOOK_TOKEN

    if ([string]::IsNullOrWhiteSpace($dbHost) -or
        [string]::IsNullOrWhiteSpace($dbPort) -or
        [string]::IsNullOrWhiteSpace($dbName) -or
        [string]::IsNullOrWhiteSpace($dbUser)) {
        throw "APP_DB_HOST, APP_DB_PORT, APP_DB_NAME, and APP_DB_USER must be set to build a deployable package."
    }

    $content = @(
        "<?php",
        "declare(strict_types=1);",
        "",
        "return [",
        "    'db' => [",
        "        'host' => $(ConvertTo-PhpSingleQuotedString $dbHost),",
        "        'port' => $([int]$dbPort),",
        "        'name' => $(ConvertTo-PhpSingleQuotedString $dbName),",
        "        'user' => $(ConvertTo-PhpSingleQuotedString $dbUser),",
        "        'pass' => $(ConvertTo-PhpSingleQuotedString $dbPassword),",
        "    ],",
        "    'deploy_hook_token' => $(ConvertTo-PhpSingleQuotedString $deployHookToken)",
        "];",
        ""
    ) -join [Environment]::NewLine

    Set-Content -LiteralPath (Join-Path $siteRoot "app_secrets.php") -Value $content -Encoding UTF8
}

function Write-DatabaseDump() {
    $userRows = @()
    foreach ($entry in Get-UserEntries) {
        $user = $entry.User
        $normalizedUsername = ([string]$entry.Username).ToLowerInvariant().Trim()
        $values = @(
            (ConvertTo-SqlLiteral $normalizedUsername)
            (ConvertTo-SqlLiteral ([string]$user.displayName))
            (ConvertTo-SqlLiteral ([string]$user.password))
            (ConvertTo-SqlLiteral ([string]$user.role))
            (ConvertTo-SqlLiteral ([string]$user.accessLabel))
        )
        $userRows += "(" + ($values -join ", ") + ")"
    }

    $evidenceRows = @()
    foreach ($entry in Get-EvidenceEntries) {
        $payloadJson = $entry | ConvertTo-Json -Depth 100 -Compress
        $normalizedCommand = ([string]$entry.command).ToLowerInvariant().Trim()
        $values = @(
            (ConvertTo-SqlLiteral ([string]$entry.id))
            (ConvertTo-SqlLiteral $normalizedCommand)
            (ConvertTo-SqlLiteral $payloadJson)
        )
        $evidenceRows += "(" + ($values -join ", ") + ")"
    }

    $lines = @(
        "SET NAMES utf8mb4;",
        "SET FOREIGN_KEY_CHECKS = 0;",
        "",
        "CREATE TABLE IF NOT EXISTS users (",
        "    username VARCHAR(120) PRIMARY KEY,",
        "    display_name VARCHAR(120) NOT NULL,",
        "    password_hash VARCHAR(255) NOT NULL,",
        "    role_name VARCHAR(20) NOT NULL DEFAULT 'user',",
        "    access_label VARCHAR(120) NOT NULL DEFAULT 'INVESTIGADOR',",
        "    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",
        "",
        "CREATE TABLE IF NOT EXISTS evidence (",
        "    id VARCHAR(120) PRIMARY KEY,",
        "    command_code VARCHAR(120) NOT NULL,",
        "    payload_json LONGTEXT NOT NULL,",
        "    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,",
        "    KEY idx_command_code (command_code)",
        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",
        "",
        "DELETE FROM evidence;",
        "DELETE FROM users;",
        ""
    )

    if ($userRows.Count -gt 0) {
        $lines += "INSERT INTO users (username, display_name, password_hash, role_name, access_label) VALUES"
        $lines += ($userRows -join "," + [Environment]::NewLine) + ";"
        $lines += ""
    }

    if ($evidenceRows.Count -gt 0) {
        $lines += "INSERT INTO evidence (id, command_code, payload_json) VALUES"
        $lines += ($evidenceRows -join "," + [Environment]::NewLine) + ";"
        $lines += ""
    }

    $lines += "SET FOREIGN_KEY_CHECKS = 1;"

    Set-Content -LiteralPath $sqlPath -Value ($lines -join [Environment]::NewLine) -Encoding UTF8
}

foreach ($path in $deployPaths) {
    Assert-RequiredPath $path
}

if (Test-Path -LiteralPath $OutputRoot) {
    Remove-Item -LiteralPath $OutputRoot -Recurse -Force
}

New-Directory $siteRoot

foreach ($path in $deployPaths) {
    Copy-DeployPath $path
}

if (-not $SkipSecretsFile) {
    Write-SecretsFile
}

Write-DatabaseDump

$itemsToZip = Get-ChildItem -LiteralPath $siteRoot -Force
if ($itemsToZip.Count -gt 0) {
    Compress-Archive -Path $itemsToZip.FullName -DestinationPath $zipPath -Force
}

Write-Info "Release package created at $OutputRoot"
