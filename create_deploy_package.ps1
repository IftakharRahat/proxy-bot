$exclude = @(
    "node_modules",
    ".git",
    ".github",
    "dist",
    ".env", 
    "deploy.tar.gz",
    "*.log"
)

$source = "C:\Users\Rahat\OneDrive\Documents\Session\proxy-bot\*"
$destination = "C:\Users\Rahat\OneDrive\Documents\Session\proxy-bot\deploy.tar.gz"

Write-Host "Creating deployment package..."
tar --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='.env' -czf deploy.tar.gz *

Write-Host "Package created at: $destination"
Write-Host "Ready to upload!"
