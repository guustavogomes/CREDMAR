# 🔧 Configuração do Asaas - Passo a Passo

## 📋 **Informações que você precisa do Asaas:**

### 1. **Chave da API (Access Token)**
- Acesse: https://www.asaas.com
- Faça login na sua conta
- Vá em **"Integrações"** > **"API"**
- Copie sua **"Chave de API"** (começa com `$aact_`)

### 2. **ID do Cliente (Customer ID)**
- No painel do Asaas, vá em **"Clientes"**
- Se você ainda não tem um cliente, crie um
- Copie o **ID do cliente** (começa com `cus_`)

### 3. **URL do seu aplicativo**
- **Desenvolvimento:** `http://localhost:3000`
- **Produção:** `https://seu-app.vercel.app` (ou sua URL)

### 4. **Token de segurança para webhook**
- Crie um token seguro (ex: `webhook_tapago_2024_secure_token_123`)

---

## 🚀 **Como configurar:**

### **Opção 1: Script Automático**
```bash
node configure-asaas.js
```
*Siga as instruções do script*

### **Opção 2: Configuração Manual**

1. **Edite o arquivo `.env`:**
```env
# Configurações do Asaas
ASAAS_API_KEY="sua_chave_api_aqui"
ASAAS_ENVIRONMENT="sandbox"  # ou "production"
ASAAS_CUSTOMER_ID="seu_customer_id_aqui"
ASAAS_WEBHOOK_TOKEN="seu_token_webhook_aqui"

# URL do seu app
NEXTAUTH_URL="http://localhost:3000"  # ou sua URL de produção

# Valor da mensalidade
MONTHLY_AMOUNT="100.00"
```

2. **Configure o webhook no Asaas:**
   - Acesse: https://www.asaas.com
   - Vá em **"Integrações"** > **"Webhooks"**
   - Clique em **"Novo Webhook"**
   - **URL:** `http://localhost:3000/api/payment/asaas/webhook`
   - **Email:** `seu_token_webhook_aqui`
   - **Eventos:** Selecione:
     - ✅ PAYMENT_CREATED
     - ✅ PAYMENT_RECEIVED
     - ✅ PAYMENT_OVERDUE
     - ✅ PAYMENT_REFUNDED
     - ✅ PAYMENT_DELETED
   - Clique em **"Salvar"**

---

## 🧪 **Testar a configuração:**

### 1. **Atualizar banco de dados:**
```bash
npm run db:push
```

### 2. **Iniciar o servidor:**
```bash
npm run dev
```

### 3. **Testar integração:**
```bash
node test-asaas-integration.js
```

### 4. **Testar webhook:**
```bash
node setup-webhook-asaas.js
```

---

## 📱 **Usar no aplicativo:**

1. **Acesse:** `http://localhost:3000/dashboard/payment/pix`
2. **Faça login** com sua conta
3. **Clique em "Criar Pagamento"**
4. **Escolha a forma de pagamento** (PIX, Cartão, Boleto)
5. **Pague** usando o QR Code ou link gerado
6. **Aguarde a confirmação** automática via webhook

---

## 🔍 **Verificar se está funcionando:**

### **Logs do servidor:**
- Abra o terminal onde está rodando `npm run dev`
- Procure por mensagens como:
  - `"Webhook recebido do Asaas"`
  - `"Pagamento aprovado"`
  - `"Usuário ativado via webhook"`

### **Painel do Asaas:**
- Vá em **"Cobranças"** para ver as cobranças criadas
- Vá em **"Webhooks"** para ver o status do webhook

### **Banco de dados:**
- Verifique se os pagamentos estão sendo criados
- Verifique se o status está sendo atualizado

---

## ❗ **Problemas comuns:**

### **Erro 401 - Unauthorized:**
- Verifique se a chave da API está correta
- Confirme se está usando a chave do ambiente correto (sandbox/production)

### **Webhook não funciona:**
- Verifique se a URL está acessível publicamente
- Confirme se o token está correto
- Teste com `curl` para verificar se o endpoint responde

### **QR Code não aparece:**
- Verifique se o método de pagamento é PIX
- Confirme se a API está retornando o QR Code
- Verifique logs do servidor para erros

---

## 📞 **Suporte:**

- **Documentação Asaas:** https://docs.asaas.com
- **Suporte Asaas:** https://ajuda.asaas.com
- **Status da API:** https://status.asaas.com

---

## ✅ **Checklist de configuração:**

- [ ] Chave da API configurada
- [ ] ID do cliente configurado
- [ ] Token de webhook configurado
- [ ] URL do aplicativo configurada
- [ ] Webhook criado no painel do Asaas
- [ ] Banco de dados atualizado
- [ ] Servidor iniciado
- [ ] Teste de integração executado
- [ ] Pagamento de teste criado
- [ ] Webhook funcionando
