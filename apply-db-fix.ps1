# Script para aplicar correção da constraint do CPF
$VPS_IP = "159.65.225.133"
$VPS_USER = "root"
$PROJECT_DIR = "/opt/tapago"

Write-Host "Aplicando correção da constraint do CPF..." -ForegroundColor Green

# Executar comando SQL diretamente
Write-Host "1. Adicionando constraint composta..." -ForegroundColor Yellow
ssh "${VPS_USER}@${VPS_IP}" "cd $PROJECT_DIR && echo 'ALTER TABLE customers ADD CONSTRAINT unique_cpf_per_user UNIQUE (cpf, \"userId\");' | docker-compose exec -T postgres psql -U postgres -d tapago"

# Verificar se foi aplicada
Write-Host "2. Verificando constraints..." -ForegroundColor Yellow
ssh "${VPS_USER}@${VPS_IP}" "cd $PROJECT_DIR && echo 'SELECT conname, contype FROM pg_constraint WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = '\''customers'\'');' | docker-compose exec -T postgres psql -U postgres -d tapago"

# Aplicar migrações pendentes usando baseline
Write-Host "3. Aplicando baseline das migrações..." -ForegroundColor Yellow
ssh "${VPS_USER}@${VPS_IP}" "cd $PROJECT_DIR && docker-compose exec app npx prisma migrate resolve --applied 20231201000000_add_periodicity_config"
ssh "${VPS_USER}@${VPS_IP}" "cd $PROJECT_DIR && docker-compose exec app npx prisma migrate resolve --applied 20250722234722_add_payment_fields"

# Verificar status final
Write-Host "4. Verificando status das migrações..." -ForegroundColor Yellow
ssh "${VPS_USER}@${VPS_IP}" "cd $PROJECT_DIR && docker-compose exec app npx prisma migrate status"

Write-Host "Correção aplicada!" -ForegroundColor Green