# 🔧 Configurar Credenciais do Asaas

## ❌ **Problema Identificado:**

O erro 500 está ocorrendo porque as credenciais do Asaas não estão configuradas corretamente na Vercel.

## 🔑 **Variáveis que Precisam ser Configuradas:**

### **1. ASAAS_API_KEY**
- **Descrição:** Sua chave de API do Asaas (produção)
- **Formato:** Começa com `$aact_`
- **Como obter:** Painel do Asaas > Integrações > API

### **2. ASAAS_CUSTOMER_ID**
- **Descrição:** ID do cliente padrão no Asaas
- **Formato:** Começa com `cus_`
- **Como obter:** Painel do Asaas > Clientes

---

## 📋 **Passo a Passo para Configurar:**

### **1. Acesse o Painel do Asaas:**
```
https://www.asaas.com
```

### **2. Obtenha a API Key:**
1. Faça login no painel
2. Vá em **Integrações** > **API**
3. Copie sua **Chave de API de Produção**
4. Ela deve começar com `$aact_`

### **3. Obtenha o Customer ID:**
1. Vá em **Clientes** no painel
2. Crie um cliente ou use um existente
3. Copie o **ID do Cliente**
4. Ele deve começar com `cus_`

### **4. Configure na Vercel:**

#### **Opção A: Via CLI (Recomendado)**
```bash
# Remover as variáveis temporárias
vercel env rm ASAAS_API_KEY production
vercel env rm ASAAS_CUSTOMER_ID production

# Adicionar com os valores reais
echo "SUA_CHAVE_REAL_AQUI" | vercel env add ASAAS_API_KEY production
echo "SEU_CUSTOMER_ID_REAL_AQUI" | vercel env add ASAAS_CUSTOMER_ID production

# Fazer novo deploy
vercel --prod
```

#### **Opção B: Via Painel da Vercel**
1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** > **Environment Variables**
4. Adicione as variáveis com os valores reais

---

## 🧪 **Testar a Configuração:**

### **1. Teste Local:**
```bash
# Configure as variáveis no .env
ASAAS_API_KEY=SUA_CHAVE_REAL
ASAAS_CUSTOMER_ID=SEU_CUSTOMER_ID_REAL

# Execute o teste
node test-asaas-debug.js
```

### **2. Teste em Produção:**
1. Acesse: https://www.organizaemprestimos.com.br/pending-payment
2. Tente criar um pagamento PIX
3. Verifique se não há mais erro 500

---

## 🔍 **Verificar se Está Funcionando:**

### **Logs da Vercel:**
```bash
vercel logs https://tapago-q9g0senxq-gustavo-gomes-projects-0b92cb30.vercel.app
```

### **Teste de API:**
```bash
curl -X POST https://www.organizaemprestimos.com.br/api/payment/asaas/create \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "method": "PIX"}'
```

---

## ⚠️ **Importante:**

### **Segurança:**
- ✅ Use sempre a chave de **PRODUÇÃO**
- ✅ Mantenha as credenciais seguras
- ✅ Não compartilhe as chaves

### **Validação:**
- ✅ A API Key deve começar com `$aact_`
- ✅ O Customer ID deve começar com `cus_`
- ✅ Teste sempre antes de usar em produção

---

## 🚨 **Se Ainda Houver Erro:**

### **1. Verifique os Logs:**
```bash
vercel logs [URL_DO_DEPLOYMENT]
```

### **2. Teste a API do Asaas:**
```bash
node test-asaas-debug.js
```

### **3. Verifique as Variáveis:**
```bash
vercel env ls
```

---

## 📞 **Suporte:**

### **Asaas:**
- **Documentação:** https://docs.asaas.com
- **Suporte:** https://www.asaas.com/contato

### **Vercel:**
- **Documentação:** https://vercel.com/docs
- **Suporte:** https://vercel.com/support

---

## 🎯 **Próximos Passos:**

1. ✅ Obter credenciais reais do Asaas
2. ✅ Configurar na Vercel
3. ✅ Fazer novo deploy
4. ✅ Testar a funcionalidade
5. ✅ Configurar webhook (se necessário)

---

**🔑 Configure as credenciais reais do Asaas para resolver o erro 500!**
