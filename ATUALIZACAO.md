# 🔄 Guia de Atualização do TaPago na VPS

Este guia explica como atualizar sua aplicação TaPago na VPS de forma segura e eficiente.

## 📋 Métodos de Atualização

### 1. 🚀 Atualização Automática (Recomendado)

Criamos scripts automatizados para facilitar o processo:

#### No Linux/VPS:
```bash
# Dar permissão de execução
chmod +x update-vps.sh

# Executar atualização
./update-vps.sh
```

#### No Windows (PowerShell):
```powershell
# Executar como administrador
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\Update-VPS.ps1
```

#### No Windows (CMD):
```cmd
update-vps.bat
```

### 2. 🔧 Atualização Manual

Se preferir fazer manualmente, siga estes passos:

```bash
# 1. Parar containers
docker-compose down

# 2. Backup (opcional mas recomendado)
docker-compose exec postgres pg_dump -U postgres tapago > backup_$(date +%Y%m%d).sql

# 3. Atualizar código
git stash
git pull origin main

# 4. Reconstruir e iniciar
docker-compose up --build -d

# 5. Verificar status
docker-compose ps
docker-compose logs app --tail=20
```

## 🛡️ Checklist de Segurança

Antes de atualizar, verifique:

- [ ] ✅ Backup do banco de dados criado
- [ ] ✅ Backup do arquivo `.env` feito
- [ ] ✅ Aplicação está funcionando antes da atualização
- [ ] ✅ Espaço em disco suficiente (pelo menos 2GB livres)
- [ ] ✅ Não há usuários críticos usando o sistema

## 📊 Monitoramento Pós-Atualização

Após a atualização, monitore:

### Verificar containers:
```bash
docker-compose ps
```

### Ver logs em tempo real:
```bash
docker-compose logs -f app
```

### Verificar uso de recursos:
```bash
docker stats
```

### Testar funcionalidades principais:
- [ ] Login de usuário
- [ ] Criação de pagamento
- [ ] Upload de comprovante
- [ ] Aprovação de pagamento (admin)

## 🚨 Troubleshooting

### Container não inicia:
```bash
# Ver logs detalhados
docker-compose logs app

# Reconstruir do zero
docker-compose down
docker system prune -f
docker-compose up --build
```

### Erro de migração do banco:
```bash
# Executar migrações manualmente
docker-compose exec app npx prisma db push
docker-compose exec app npx prisma generate
```

### Aplicação não responde:
```bash
# Verificar se porta está livre
netstat -tulpn | grep :3000

# Reiniciar apenas o app
docker-compose restart app
```

### Erro de permissão:
```bash
# Verificar permissões Docker
sudo usermod -aG docker $USER
newgrp docker
```

## 🔄 Rollback (Reverter Atualização)

Se algo der errado, você pode reverter:

### 1. Voltar código anterior:
```bash
git log --oneline -5  # Ver últimos commits
git reset --hard HEAD~1  # Voltar 1 commit
```

### 2. Restaurar banco (se necessário):
```bash
# Parar containers
docker-compose down

# Restaurar backup
docker-compose up postgres -d
sleep 10
docker-compose exec -T postgres psql -U postgres -d tapago < backup_YYYYMMDD.sql
```

### 3. Reconstruir:
```bash
docker-compose up --build -d
```

## 📈 Otimizações

### Limpeza periódica:
```bash
# Limpar imagens não utilizadas
docker image prune -f

# Limpar volumes órfãos
docker volume prune -f

# Limpeza completa (cuidado!)
docker system prune -af
```

### Monitoramento de espaço:
```bash
# Verificar espaço em disco
df -h

# Verificar uso do Docker
docker system df
```

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs**: `docker-compose logs app`
2. **Verifique o status**: `docker-compose ps`
3. **Teste a conectividade**: `curl http://localhost:3000`
4. **Verifique recursos**: `docker stats`

### Logs importantes para debug:
- Logs da aplicação: `docker-compose logs app`
- Logs do banco: `docker-compose logs postgres`
- Logs do sistema: `journalctl -u docker`

## 🎯 Dicas de Performance

### Para atualizações mais rápidas:
- Use `docker-compose up -d` sem `--build` se não houve mudanças no código
- Mantenha imagens base atualizadas
- Use `.dockerignore` para excluir arquivos desnecessários

### Para economizar espaço:
- Execute limpeza regular: `docker system prune -f`
- Use multi-stage builds (já implementado)
- Monitore uso de disco: `docker system df`

## 📅 Cronograma Sugerido

### Atualizações de segurança: Imediatas
### Atualizações de funcionalidade: Semanais
### Atualizações de dependências: Mensais

---

**💡 Dica**: Sempre teste atualizações em ambiente de desenvolvimento antes de aplicar em produção!