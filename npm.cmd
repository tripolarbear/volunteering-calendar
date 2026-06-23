@echo off
set "CODEX_NODE_BIN=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
set "CODEX_PNPM=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\pnpm.cmd"

if not exist "%CODEX_NODE_BIN%\node.exe" (
  echo Bundled Node.js was not found at "%CODEX_NODE_BIN%\node.exe".
  exit /b 1
)

if not exist "%CODEX_PNPM%" (
  echo Bundled pnpm was not found at "%CODEX_PNPM%".
  exit /b 1
)

set "PATH=%CODEX_NODE_BIN%;%PATH%"
call "%CODEX_PNPM%" dlx npm@latest %*
