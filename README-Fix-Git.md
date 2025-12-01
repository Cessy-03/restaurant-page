Fix Git PATH (Windows) - Quick guide

This workspace helper contains a simple script `fix-git-path.ps1` that finds a local Git installation and optionally adds it to your User PATH.

How to run the script

1) Open PowerShell (regular user is fine).
2) From the folder containing the script, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; .\fix-git-path.ps1
```

3) Follow on-screen prompts. If git is found the script helps add the right folder to the User PATH permanently, updates the current session, and verifies git availability.

Manual steps if you prefer to do things by hand

1) Run the diagnostics lines in PowerShell:

```powershell
Get-Command git -ErrorAction SilentlyContinue | Format-List *
where.exe git
$env:Path -split ';' | Select-String -Pattern 'Git'
Test-Path 'C:\Program Files\Git\cmd\git.exe'
Test-Path 'C:\Program Files (x86)\Git\cmd\git.exe'
```

2) If Git is installed but not in PATH, add it with PowerShell (replace the folder path if yours is different):

```powershell
$gitFolder = 'C:\Program Files\Git\cmd'
[Environment]::SetEnvironmentVariable('Path', ([Environment]::GetEnvironmentVariable('Path','User').TrimEnd(';') + ';' + $gitFolder).Trim(';'), 'User')

# for the current session (temporary)
$env:Path += ";$gitFolder"

# Now verify
git --version
where.exe git
```

3) If Git cannot be found at all, reinstall from https://git-scm.com/download/win and during install select "Use Git from the command line and also from 3rd-party software" and enable path additions. Then restart PowerShell.

Notes
- Close and re-open PowerShell to reflect new PATH entries in new shells.
- Admin-level changes are not necessary if you only want the current user to use Git.
- If your organization controls installations or uses special installers, consult your system admin.

If the script cannot find Git, share the output from running the diagnostic commands above and I'll help further.
