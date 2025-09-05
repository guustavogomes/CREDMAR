# 🏦 Configuração da API PIX do Banco Central (BACEN)

## 📋 **Pré-requisitos:**

### **1. Certificado Digital**
- **Obrigatório:** Certificado A1 ou A3 válido
- **Tipo:** Pessoa Jurídica (CNPJ) ou Pessoa Física (CPF)
- **Formato:** .p12 ou .pfx

### **2. Registro no BACEN**
- Cadastro no Sistema de Pagamentos Instantâneos (SPI)
- Autorização para usar APIs PIX
- Chave PIX ativa e validada

## 🔧 **Como Configurar:**

### **Passo 1: Obter Credenciais**

1. **Acesse:** https://www.bcb.gov.br/estabilidadefinanceira/pix
2. **Registre-se** no ambiente de produção ou sandbox
3. **Obtenha:**
   - Client ID
   - Client Secret
   - URL da API
   - Certificado digital

### **Passo 2: Configurar Variáveis de Ambiente**

Na Vercel, adicione:

```env
# API PIX BACEN
BACEN_PIX_API_URL=https://api.bcb.gov.br/pix/v2
BACEN_CLIENT_ID=seu_client_id_aqui
BACEN_CLIENT_SECRET=seu_client_secret_aqui
BACEN_CERTIFICATE=base64_do_certificado_aqui

# Sua chave PIX (deve estar registrada no BACEN)
PIX_KEY=sua_chave_pix_registrada
```

### **Passo 3: Preparar Certificado**

```bash
# Converter certificado para base64
base64 -i seu_certificado.p12 -o certificado_base64.txt

# Ou no Windows PowerShell:
[Convert]::ToBase64String([IO.File]::ReadAllBytes("seu_certificado.p12"))
```

## 🧪 **Ambiente de Testes (Sandbox):**

### **URLs de Teste:**
```
API Base: https://api.sandbox.bcb.gov.br/pix/v2
OAuth: https://api.sandbox.bcb.gov.br/pix/v2/oauth/token
```

### **Credenciais de Teste:**
```env
BACEN_PIX_API_URL=https://api.sandbox.bcb.gov.br/pix/v2
BACEN_CLIENT_ID=test_client_id
BACEN_CLIENT_SECRET=test_client_secret
```

## 📊 **Como Funciona:**

### **1. Fluxo de Verificação:**
```
1. Usuário faz PIX → Banco processa
2. Sistema consulta BACEN a cada 30s
3. BACEN retorna transações recentes
4. Sistema encontra PIX pelo valor
5. Usuário é ativado automaticamente
```

### **2. Consulta por Período:**
```javascript
// Buscar PIX dos últimos 10 minutos
const pixList = await bacenPixAPI.consultarPixRecebidos(
  new Date(Date.now() - 10 * 60 * 1000), // 10 min atrás
  new Date() // agora
)
```

### **3. Verificação por Valor:**
```javascript
// Procurar PIX de R$ 0,01
const pix = await bacenPixAPI.verificarPagamentoPix(0.01, 'sua_chave_pix')
```

## 🚨 **Limitações e Considerações:**

### **1. Rate Limits:**
- **Produção:** 1000 req/min
- **Sandbox:** 100 req/min
- **Recomendado:** Verificar a cada 30-60 segundos

### **2. Janela de Tempo:**
- PIX fica disponível por **90 dias** na API
- Recomendado consultar últimas **2-4 horas**

### **3. Certificado:**
- **Renovação:** Certificados expiram (1-3 anos)
- **Backup:** Manter cópia segura
- **Formato:** Deve ser válido e não expirado

## 🔧 **Implementação Atual:**

### **Com BACEN (Produção):**
```
✅ Verificação real via API oficial
✅ Confirmação instantânea
✅ EndToEndId para rastreamento
✅ Dados oficiais do BACEN
```

### **Sem BACEN (Fallback):**
```
🧪 Simulação após 2 minutos
🧪 Ativação automática para testes
🧪 Funciona sem certificado
```

## 📱 **Status Atual do Sistema:**

### **Configurado:**
- ✅ Estrutura da API BACEN
- ✅ Fallback para simulação
- ✅ Verificação automática
- ✅ Interface de usuário

### **Pendente:**
- ⏳ Certificado digital
- ⏳ Credenciais do BACEN
- ⏳ Teste em produção

## 🎯 **Próximos Passos:**

1. **Obter certificado digital** (A1 ou A3)
2. **Registrar no BACEN** para PIX
3. **Configurar credenciais** na Vercel
4. **Testar no sandbox** primeiro
5. **Migrar para produção**

## 💡 **Alternativas Mais Simples:**

### **1. Mercado Pago:**
- Webhook automático
- Sem certificado
- Setup em 10 minutos

### **2. PagSeguro:**
- API simples
- Notificações automáticas
- Integração rápida

### **3. Asaas:**
- PIX + Webhook
- Dashboard completo
- Suporte brasileiro

**Recomendação:** Use Mercado Pago ou PagSeguro para começar, migre para BACEN depois se necessário.