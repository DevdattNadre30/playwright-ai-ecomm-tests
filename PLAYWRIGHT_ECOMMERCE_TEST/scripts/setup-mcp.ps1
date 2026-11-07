$ErrorActionPreference = "Stop"

if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    throw "Node.js and npm are required to start the Playwright MCP server."
}

$configPath = Join-Path (Get-Location) ".vscode\mcp.json"
if (-not (Test-Path $configPath)) {
    throw "MCP configuration was not found at $configPath."
}

Write-Host "Starting the Playwright MCP server. VS Code can also launch it from .vscode/mcp.json."
npm run mcp:start
if ($LASTEXITCODE -ne 0) {
    throw "The Playwright MCP server exited with code $LASTEXITCODE."
}
