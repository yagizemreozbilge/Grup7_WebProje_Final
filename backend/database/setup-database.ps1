# ============================================
# Campus Management System - Database Setup Script
# PowerShell script for Windows
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Campus Management System - Database Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "[OK] Docker is running" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Navigate to project root (assuming script is in backend/database)
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = (Get-Item $scriptPath).Parent.Parent.FullName
Set-Location $projectRoot

Write-Host ""
Write-Host "[1/5] Starting PostgreSQL container..." -ForegroundColor Yellow

# Start only postgres service
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
Write-Host "[2/5] Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
$maxRetries = 30
$retryCount = 0
$isReady = $false

while (-not $isReady -and $retryCount -lt $maxRetries) {
    Start-Sleep -Seconds 2
    $retryCount++
    try {
        $result = docker exec campus_postgres pg_isready -U admin 2>&1
        if ($LASTEXITCODE -eq 0) {
            $isReady = $true
            Write-Host "[OK] PostgreSQL is ready!" -ForegroundColor Green
        }
    } catch {
        Write-Host "   Waiting... ($retryCount/$maxRetries)" -ForegroundColor Gray
    }
}

if (-not $isReady) {
    Write-Host "[ERROR] PostgreSQL failed to start within timeout." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[3/5] Creating database schema..." -ForegroundColor Yellow

# Run schema.sql
$schemaPath = "backend/database/schema.sql"
if (Test-Path $schemaPath) {
    Get-Content $schemaPath -Raw | docker exec -i campus_postgres psql -U admin -d campus_db
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Schema created successfully!" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Schema creation had some issues. Check the output above." -ForegroundColor Yellow
    }
} else {
    Write-Host "[ERROR] Schema file not found: $schemaPath" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[4/5] Loading seed data..." -ForegroundColor Yellow

# Run seed.sql
$seedPath = "backend/database/seed.sql"
if (Test-Path $seedPath) {
    Get-Content $seedPath -Raw | docker exec -i campus_postgres psql -U admin -d campus_db
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Seed data loaded successfully!" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Seed data loading had some issues. Check the output above." -ForegroundColor Yellow
    }
} else {
    Write-Host "[ERROR] Seed file not found: $seedPath" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[5/5] Verifying installation..." -ForegroundColor Yellow

# Verify tables
$tableCount = docker exec campus_postgres psql -U admin -d campus_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
Write-Host "[OK] Created $($tableCount.Trim()) tables" -ForegroundColor Green

# Verify users
$userCount = docker exec campus_postgres psql -U admin -d campus_db -t -c "SELECT COUNT(*) FROM users;"
Write-Host "[OK] Loaded $($userCount.Trim()) users" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Database Setup Complete!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Connection Details:" -ForegroundColor White
Write-Host "  Host: localhost" -ForegroundColor Gray
Write-Host "  Port: 5432" -ForegroundColor Gray
Write-Host "  Database: campus_db" -ForegroundColor Gray
Write-Host "  Username: admin" -ForegroundColor Gray
Write-Host "  Password: password" -ForegroundColor Gray
Write-Host ""
Write-Host "Test Users (password: Password123):" -ForegroundColor White
Write-Host "  Admin: admin@campus.edu" -ForegroundColor Gray
Write-Host "  Faculty: prof.smith@campus.edu" -ForegroundColor Gray
Write-Host "  Student: student1@campus.edu" -ForegroundColor Gray
Write-Host ""
Write-Host "To connect via psql:" -ForegroundColor White
Write-Host "  docker exec -it campus_postgres psql -U admin -d campus_db" -ForegroundColor Gray
Write-Host ""

