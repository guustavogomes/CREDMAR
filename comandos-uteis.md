# 🛠️ Comandos Úteis para Gerenciar o TaPago na VPS

## 🚀 Atualização Rápida

```bash
# Atualização completa automatizada
./update-vps.sh

# Atualização manual rápida
docker-compose down && git pull && docker-compose up -d

# Atualização com rebuild forçado
docker-compose down && git pull && docker-compose up --build -d
```

## 📊 Monitoramento

```bash
# Status dos containers
docker-compose ps

# Logs em tempo real
docker-compose logs -f app

# Logs do banco
docker-compose logs -f postgres

# Últimas 50 linhas de log
docker-compose logs app --tail=50

# Uso de recursos
docker stats

# Verificação de saúde
./health-check.sh
```

## 🔧 Manutenção

```bash
# Reiniciar apenas a aplicação
docker-compose restart app

# Reiniciar tudo
docker-compose restart

# Parar tudo
docker-compose down

# Iniciar tudo
docker-compose up -d

# Reconstruir e iniciar
docker-compose up --build -d
```

## 🗄️ Banco de Dados

```bash
# Backup do banco
docker-compose exec postgres pg_dump -U postgres tapago > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker-compose exec -T postgres psql -U postgres -d tapago < backup_YYYYMMDD.sql

# Conectar ao banco
docker-compose exec postgres psql -U postgres -d tapago

# Ver tabelas
docker-compose exec postgres psql -U postgres -d tapago -c "\dt"

# Executar migrações
docker-compose exec app npx prisma db push

# Gerar cliente Prisma
docker-compose exec app npx prisma generate

# Executar seed
docker-compose exec app npm run db:seed
```

## 🧹 Limpeza

```bash
# Limpar imagens não utilizadas
docker image prune -f

# Limpar volumes órfãos
docker volume prune -f

# Limpar containers parados
docker container prune -f

# Limpeza completa (CUIDADO!)
docker system prune -af

# Ver uso do Docker
docker system df
```

## 🔍 Debug e Troubleshooting

```bash
# Entrar no container da aplicação
docker-compose exec app bash

# Entrar no container do banco
docker-compose exec postgres bash

# Ver variáveis de ambiente
docker-compose exec app env

# Testar conectividade
curl http://localhost:3000

# Ver processos rodando
docker-compose exec app ps aux

# Ver arquivos da aplicação
docker-compose exec app ls -la

# Verificar logs de erro específicos
docker-compose logs app | grep -i error

# Verificar logs de inicialização
docker-compose logs app | grep -i "ready\|listening\|started"
```

## 🌐 Rede e Conectividade

```bash
# Verificar portas abertas
netstat -tulpn | grep :3000
netstat -tulpn | grep :5432

# Testar conectividade interna
docker-compose exec app ping postgres

# Ver configuração de rede do Docker
docker network ls
docker network inspect tapago_default
```

## 📁 Arquivos e Configuração

```bash
# Ver configuração atual
cat .env

# Editar configuração
nano .env

# Ver logs do sistema
journalctl -u docker --tail=50

# Ver espaço em disco
df -h

# Ver uso de memória
free -h

# Ver processos do sistema
top
```

## 🔄 Git e Versionamento

```bash
# Ver status do repositório
git status

# Ver últimos commits
git log --oneline -10

# Ver diferenças
git diff

# Fazer stash das mudanças locais
git stash

# Aplicar stash
git stash pop

# Ver branches
git branch -a

# Trocar de branch
git checkout nome-da-branch
```

## 🚨 Comandos de Emergência

```bash
# Parar tudo imediatamente
docker-compose kill

# Remover containers e volumes (CUIDADO!)
docker-compose down -v

# Restaurar do backup mais recente
LATEST_BACKUP=$(ls -t backups/*.sql | head -1)
docker-compose down
docker-compose up postgres -d
sleep 10
docker-compose exec -T postgres psql -U postgres -d tapago < "$LATEST_BACKUP"
docker-compose up -d

# Reiniciar Docker (se necessário)
sudo systemctl restart docker
```

## 📈 Performance e Otimização

```bash
# Ver uso detalhado de recursos
docker stats --no-stream

# Analisar tamanho das imagens
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# Ver logs de performance
docker-compose logs app | grep -i "slow\|timeout\|performance"

# Verificar conexões ativas no banco
docker-compose exec postgres psql -U postgres -d tapago -c "SELECT count(*) FROM pg_stat_activity;"
```

## 🔐 Segurança

```bash
# Ver usuários logados
who

# Ver tentativas de login
sudo tail /var/log/auth.log

# Verificar firewall
sudo ufw status

# Ver processos suspeitos
ps aux | grep -v "\[.*\]"

# Verificar conexões de rede
netstat -an | grep ESTABLISHED
```

## 📋 Checklist Diário

```bash
# 1. Verificar status
docker-compose ps

# 2. Ver logs recentes
docker-compose logs app --tail=20

# 3. Verificar recursos
docker stats --no-stream

# 4. Verificar espaço
df -h

# 5. Backup (se necessário)
docker-compose exec postgres pg_dump -U postgres tapago > "backup_$(date +%Y%m%d).sql"
```

## 🆘 Contatos de Emergência

- **Logs de erro**: `docker-compose logs app | grep -i error`
- **Status do sistema**: `./health-check.sh`
- **Backup de emergência**: `docker-compose exec postgres pg_dump -U postgres tapago > emergency_backup.sql`

---

**💡 Dica**: Salve este arquivo como favorito e use os comandos conforme necessário. Sempre faça backup antes de mudanças importantes!