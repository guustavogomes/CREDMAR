@echo off
REM 🚀 Script de Atualização do TaPago na VPS (Windows)
REM Este script automatiza o processo de atualização da aplicação

echo 🚀 Iniciando atualizacao do TaPago na VPS...

REM Verificar se estamos no diretório correto
if not exist "docker-compose.yml" (
    echo ❌ docker-compose.yml nao encontrado. Execute este script no diretorio raiz do projeto.
    pause
    exit /b 1
)

echo ℹ️  Parando containers...
docker-compose down

echo ℹ️  Fazendo backup das configuracoes...
if exist ".env" (
    copy ".env" ".env.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%" >nul 2>&1
)

echo ℹ️  Atualizando codigo do repositorio...
git stash push -m "Auto-stash before update %date% %time%"
git pull origin main

echo ℹ️  Reconstruindo e iniciando containers...
docker-compose up --build -d

echo ℹ️  Aguardando containers ficarem prontos...
timeout /t 10 /nobreak >nul

echo ℹ️  Verificando status dos containers...
docker-compose ps

echo ℹ️  Logs recentes da aplicacao:
docker-compose logs app --tail=10

echo.
echo ✅ Atualizacao concluida!
echo ℹ️  Para monitorar logs em tempo real: docker-compose logs -f app
echo ℹ️  Para verificar status: docker-compose ps

pause