<#
fix-git-path.ps1

This script checks whether "git" is available in PowerShell and attempts to find installed git executables.
If a valid git folder is found it can optionally add the folder to the current user's PATH and verify the change.

USAGE:
Run in PowerShell (non-admin is fine for user PATH changes):

   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; .\fix-git-path.ps1

#>

# Helper functions
function Find-GitLocations {
    [CmdletBinding()]
    param()

    $paths = @()

    # check common Program Files groups
    $candidates = @(
        "C:\Program Files\Git\cmd",
        "C:\Program Files\Git\bin",
        "C:\Program Files (x86)\Git\cmd",
        "C:\Program Files (x86)\Git\bin",
        "$env:LOCALAPPDATA\Programs\Git\cmd",
        "$env:LOCALAPPDATA\Programs\Git\bin",
        "$env:ProgramFiles\Git\cmd",
        "$env:ProgramFiles\Git\bin",
        "$env:USERPROFILE\AppData\Local\Programs\Git\cmd",
        "$env:USERPROFILE\AppData\Local\Programs\Git\bin"
    )

    foreach ($c in $candidates) {
        if (Test-Path $c) {
            $paths += $c
        }
    }

    # Quick search for git.exe in the user's profile and Program Files - may take a little time
    $extraPaths = @("$env:ProgramFiles","$env:ProgramFiles(x86)","$env:USERPROFILE\AppData\Local")
    foreach ($p in $extraPaths) {
        try {
            Get-ChildItem -Path $p -Filter git.exe -Recurse -ErrorAction SilentlyContinue -Force | ForEach-Object {
                $folder = Split-Path $_.FullName -Parent
                if ($paths -notcontains $folder) { $paths += $folder }
            }
        } catch { }
    }

    return $paths | Sort-Object -Unique
}

function Add-ToUserPath {
    param(
        [Parameter(Mandatory=$true)][string]$Folder
    )

    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    if ([String]::IsNullOrEmpty($userPath)) { $userPath = '' }

    if ($userPath -split ';' -contains $Folder) {
        Write-Host "Folder already present in User PATH: $Folder"
        return $true
    }

    $newValue = ($userPath.TrimEnd(';') + ';' + $Folder).Trim(';')
    try {
        [Environment]::SetEnvironmentVariable('Path', $newValue, 'User')
        Write-Host "Added to user PATH: $Folder"
        return $true
    } catch {
        Write-Warning "Failed to modify user PATH: $_"
        return $false
    }
}

function Print-PathEntriesContainingGit {
    $env:Path -split ';' | Where-Object { $_ -match 'Git' } | ForEach-Object { $_ }
}

# Main
Write-Host "-- Git PATH Fix Helper --" -ForegroundColor Cyan

# Quick check
$cmd = Get-Command git -ErrorAction SilentlyContinue
if ($cmd) {
    Write-Host "Git is already available: $($cmd.Source)" -ForegroundColor Green
    git --version
    exit 0
}

Write-Host "Git command not found in this Powershell session." -ForegroundColor Yellow
Write-Host "Searching common locations for git.exe..."

$found = Find-GitLocations

if (-not $found) {
    Write-Warning "No git installation was found in common locations."
    Write-Host "If you installed Git from Microsoft Store or other packages, try reinstalling from https://git-scm.com/download/win and select 'Use Git from the command line...' during install."
    exit 1
}

Write-Host "Found the following folder(s) that contain git.exe:" -ForegroundColor Green
$index = 0
foreach ($f in $found) { $index++; Write-Host "[$index] $f" }

# If multiple found, ask what to add to PATH
$choice = Read-Host "Choose the number of folder to add to User PATH (or press Enter to cancel)"
if ([String]::IsNullOrEmpty($choice)) {
    Write-Host "Cancelled by user. Nothing added." -ForegroundColor Yellow
    Write-Host "You can manually add one of the above to your User PATH manually or re-run the script."
    exit 0
}

if ($choice -notmatch '^[0-9]+$' -or [int]$choice -lt 1 -or [int]$choice -gt $found.Count) {
    Write-Warning "Invalid selection: $choice"; exit 2
}

$selectedFolder = $found[[int]$choice - 1]
Write-Host "Selected: $selectedFolder" -ForegroundColor Cyan

# Add to user PATH
$ok = Add-ToUserPath -Folder $selectedFolder
if (-not $ok) { Write-Warning "Failed to add $selectedFolder to PATH"; exit 3 }

# Also put into current session so we can test immediately
$env:Path += ";$selectedFolder"

Write-Host "Current PATH entries that mention Git:" -ForegroundColor Cyan
Print-PathEntriesContainingGit

Write-Host "Trying git --version..." -ForegroundColor Cyan
try {
    git --version
    Write-Host "Success: git detected in this session. Please close and re-open PowerShell to ensure the new PATH is used everywhere." -ForegroundColor Green
    exit 0
} catch {
    Write-Warning "git still not detected in the current session; try opening a new PowerShell window."
    exit 4
}
