# 🚀 Scripts Finais - TaPago

Scripts funcionais para deploy e configuração do TaPago.

## 📋 **Scripts Disponíveis:**

### **1. Deploy Inicial** 
- **Arquivo**: `deploy-simples.ps1`
- **Uso**: Deploy inicial em VPS nova
- **Comando**: `powershell -ExecutionPolicy Bypass -File deploy-simples.ps1`
- **Função**: Instala Docker, envia projeto, configura e inicia aplicação

### **2. Configuração SSH**
- **Arquivo**: `setup-ssh.ps1` 
- **Uso**: Configurar chave SSH na VPS
- **Comando**: `powershell -ExecutionPolicy Bypass -File setup-ssh.ps1`
- **Função**: Mostra instruções para configurar SSH

### **3. Configuração Nginx + Cloudflare**
- **Arquivo**: `setup-cloudflare.ps1`
- **Arquivo auxiliar**: `setup-nginx-cloudflare.sh`
- **Uso**: Configurar proxy reverso com Cloudflare
- **Comando**: `powershell -ExecutionPolicy Bypass -File setup-cloudflare.ps1`
- **Função**: Instala e configura Nginx otimizado para Cloudflare

### **4. Atualizações Automáticas**
- **Arquivo**: `update-auto.ps1`
- **Uso**: Atualizar aplicação na VPS
- **Comando**: `powershell -ExecutionPolicy Bypass -File update-auto.ps1`
- **Função**: Compacta, envia, faz backup e atualiza aplicação

### **5. Atualizar IP da VPS**
- **Arquivo**: `update-ip.ps1`
- **Uso**: Atualizar IP em todos os scripts
- **Comando**: `powershell -ExecutionPolicy Bypass -File update-ip.ps1 -NewIp "NOVO_IP"`
- **Função**: Atualiza IP da VPS em todos os arquivos

## 🎯 **Fluxo Completo de Deploy:**

### **1ª Vez - VPS Nova:**
```powershell
# 1. Deploy inicial
powershell -ExecutionPolicy Bypass -File deploy-simples.ps1

# 2. Configurar Nginx + Cloudflare
powershell -ExecutionPolicy Bypass -File setup-cloudflare.ps1

# 3. Configurar DNS no Cloudflare
# - A record: @ -> IP_DA_VPS
# - A record: www -> IP_DA_VPS
```

### **Atualizações:**
```powershell
# Atualizar aplicação
powershell -ExecutionPolicy Bypass -File update-auto.ps1
```

### **Trocar VPS:**
```powershell
# Atualizar IP em todos os scripts
powershell -ExecutionPolicy Bypass -File update-ip.ps1 -NewIp "NOVO_IP"
```

## 📊 **Status Atual:**

- ✅ **VPS**: 159.65.225.133
- ✅ **Domínio**: organizaemprestimos.com.br
- ✅ **SSL**: Cloudflare (automático)
- ✅ **Aplicação**: http://159.65.225.133:3002
- ✅ **Site público**: https://organizaemprestimos.com.br

## 🔧 **Comandos Úteis na VPS:**

```bash
# Status da aplicação
cd /opt/tapago && docker-compose ps

# Logs da aplicação
docker-compose logs app --tail 50

# Status do Nginx
systemctl status nginx

# Logs do Nginx
tail -f /var/log/nginx/organizaemprestimos.com.br.access.log

# Reiniciar aplicação
docker-compose restart app

# Reiniciar Nginx
systemctl restart nginx
```

## 📁 **Arquivos de Configuração:**

- **Docker**: `docker-compose.yml`, `Dockerfile`
- **Next.js**: `next.config.js`, `middleware.ts`
- **Banco**: `prisma/schema.prisma`
- **Nginx**: Configurado automaticamente pelo script
- **SSL**: Gerenciado pelo Cloudflare

## 🎉 **Sistema Completo:**

O TaPago está configurado com:
- Deploy automatizado
- Proxy reverso otimizado
- SSL automático via Cloudflare
- Backup automático nas atualizações
- Logs centralizados
- Monitoramento simplificado