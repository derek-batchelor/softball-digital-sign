#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Run the Softball Digital Sign application using GHCR images
.DESCRIPTION
    This script pulls and runs the frontend and backend containers from GitHub Container Registry
.PARAMETER Owner
    GitHub repository owner username (defaults to current git remote)
.PARAMETER PAT
    GitHub Personal Access Token for GHCR authentication (with read:packages permission)
.PARAMETER Pull
    Pull latest images before starting
.PARAMETER Down
    Stop and remove containers
.EXAMPLE
    .\docker-compose-ghcr.ps1
.EXAMPLE
    .\docker-compose-ghcr.ps1 -Owner "yourusername" -PAT "ghp_yourtoken"
.EXAMPLE
    .\docker-compose-ghcr.ps1 -Owner "yourusername" -Pull
.EXAMPLE
    .\docker-compose-ghcr.ps1 -Down
#>

param(
    [string]$Owner,
    [string]$PAT,
    [switch]$Pull,
    [switch]$Down
)

# Get repository owner from git remote if not provided
if (-not $Owner) {
    try {
        $gitRemote = git remote get-url origin 2>$null
        if ($gitRemote -match 'github\.com[:/]([^/]+)/') {
            $Owner = $Matches[1]
            Write-Host "Detected GitHub owner: $Owner" -ForegroundColor Cyan
        }
    }
    catch {
        Write-Host "Could not detect GitHub owner from git remote" -ForegroundColor Yellow
    }
}

# Prompt for owner if still not set
if (-not $Owner) {
    $Owner = Read-Host "Enter GitHub repository owner username"
}

# Set environment variable
$env:GITHUB_REPOSITORY_OWNER = $Owner

Write-Host "`nUsing GitHub Container Registry owner: $Owner" -ForegroundColor Green

if ($Down) {
    Write-Host "`nStopping and removing containers..." -ForegroundColor Yellow
    docker-compose -f docker-compose.ghcr.yml down
    exit $LASTEXITCODE
}

# Check if images exist locally
Write-Host "`nChecking for local images..." -ForegroundColor Cyan
$serverImageExists = docker images -q ghcr.io/$Owner/softball-digital-sign-server:latest
$clientImageExists = docker images -q ghcr.io/$Owner/softball-digital-sign-client:latest

if (-not $serverImageExists -or -not $clientImageExists -or $Pull) {
    Write-Host "Need to pull images from GHCR" -ForegroundColor Yellow
    
    # Login to GHCR
    if (-not $PAT) {
        Write-Host "`nGitHub Personal Access Token required for GHCR access" -ForegroundColor Yellow
        Write-Host "Enter your GitHub PAT (with read:packages permission):" -ForegroundColor Cyan
        $securePAT = Read-Host -AsSecureString
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePAT)
        $PAT = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
    }
    
    Write-Host "`nLogging in to GHCR..." -ForegroundColor Cyan
    $PAT | docker login ghcr.io -u $Owner --password-stdin 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to login to GHCR" -ForegroundColor Red
        Write-Host "Make sure your PAT has 'read:packages' permission" -ForegroundColor Yellow
        exit $LASTEXITCODE
    }
    Write-Host "✓ Successfully logged in to GHCR" -ForegroundColor Green
    
    Write-Host "`nPulling images from GHCR..." -ForegroundColor Cyan
    docker-compose -f docker-compose.ghcr.yml pull
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to pull images" -ForegroundColor Red
        Write-Host "`nMake sure the images exist at:" -ForegroundColor Yellow
        Write-Host "  ghcr.io/$Owner/softball-digital-sign-server:latest" -ForegroundColor White
        Write-Host "  ghcr.io/$Owner/softball-digital-sign-client:latest" -ForegroundColor White
        exit $LASTEXITCODE
    }
    Write-Host "✓ Images pulled successfully" -ForegroundColor Green
} else {
    Write-Host "✓ Images found locally" -ForegroundColor Green
}

Write-Host "`nStarting containers..." -ForegroundColor Cyan
docker-compose -f docker-compose.ghcr.yml up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Containers started successfully!" -ForegroundColor Green
    Write-Host "`nServices:" -ForegroundColor Cyan
    Write-Host "  Frontend: http://localhost" -ForegroundColor White
    Write-Host "  Backend:  http://localhost:3000" -ForegroundColor White
    Write-Host "  SQL:      localhost:1433" -ForegroundColor White
    Write-Host "`nTo view logs:" -ForegroundColor Cyan
    Write-Host "  docker-compose -f docker-compose.ghcr.yml logs -f" -ForegroundColor White
    Write-Host "`nTo stop:" -ForegroundColor Cyan
    Write-Host "  .\docker-compose-ghcr.ps1 -Down" -ForegroundColor White
} else {
    Write-Host "`n✗ Failed to start containers" -ForegroundColor Red
    exit $LASTEXITCODE
}
