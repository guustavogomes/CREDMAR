# 🚀 Configuração de Produção - Asaas

## 🌐 **Seu Domínio:**
**https://www.organizaemprestimos.com.br/**

---

## 🔗 **URL do Webhook para o Asaas:**
```
https://www.organizaemprestimos.com.br/api/payment/asaas/webhook
```

---

## 📋 **Configuração no Painel do Asaas:**

### **1. Acesse o Painel:**
- URL: https://www.asaas.com
- Faça login na sua conta

### **2. Configure o Webhook:**
- Vá em **"Integrações"** > **"Webhooks"**
- Clique em **"Novo Webhook"**
- **URL:** `https://www.organizaemprestimos.com.br/api/payment/asaas/webhook`
- **Email:** `webhook_organiza_emprestimos_2024_secure_token`
- **Eventos:** Selecione:
  - ✅ PAYMENT_CREATED
  - ✅ PAYMENT_RECEIVED
  - ✅ PAYMENT_OVERDUE
  - ✅ PAYMENT_REFUNDED
  - ✅ PAYMENT_DELETED
  - ✅ PAYMENT_RESTORED
- Clique em **"Salvar"**

### **3. Obtenha suas Credenciais:**
- **Chave da API:** Vá em **"Integrações"** > **"API"** > Copie sua chave de produção
- **Customer ID:** Vá em **"Clientes"** > Crie ou selecione um cliente > Copie o ID

---

## ⚙️ **Configuração no Arquivo .env:**

Edite o arquivo `.env` com suas credenciais de produção:

```env
# Configurações de Produção
NEXTAUTH_URL="https://www.organizaemprestimos.com.br"
ASAAS_ENVIRONMENT="production"
ASAAS_API_KEY="sua_chave_de_producao_aqui"
ASAAS_CUSTOMER_ID="seu_customer_id_de_producao"
ASAAS_WEBHOOK_TOKEN="webhook_organiza_emprestimos_2024_secure_token"
MONTHLY_AMOUNT="100.00"

# Outras configurações
DATABASE_URL="sua_url_do_banco_de_producao"
NEXTAUTH_SECRET="seu_secret_key_de_producao"
```

---

## 🚀 **Deploy e Testes:**

### **1. Atualizar Banco de Dados:**
```bash
npm run db:push
```

### **2. Fazer Deploy:**
- Faça o deploy da aplicação para seu servidor
- Certifique-se de que as variáveis de ambiente estão configuradas

### **3. Testar Conexão:**
```bash
node test-asaas-connection.js
```

### **4. Testar Webhook:**
```bash
node setup-webhook-asaas.js
```

### **5. Testar Pagamentos:**
- Acesse: https://www.organizaemprestimos.com.br/dashboard/payment/pix
- Faça login
- Crie um pagamento de teste
- Verifique se o webhook está funcionando

---

## 🔍 **Verificações Importantes:**

### **✅ Checklist de Produção:**
- [ ] Chave de API de produção configurada
- [ ] Customer ID de produção configurada
- [ ] Webhook configurado no Asaas
- [ ] URL do webhook acessível publicamente
- [ ] Banco de dados atualizado
- [ ] Aplicação deployada
- [ ] Teste de pagamento realizado
- [ ] Webhook funcionando
- [ ] Logs sendo monitorados

### **🧪 Testes Recomendados:**
1. **Criar pagamento PIX** e verificar QR Code
2. **Simular pagamento** e verificar confirmação automática
3. **Verificar logs** do servidor para webhooks
4. **Testar diferentes valores** de pagamento
5. **Verificar ativação** automática de usuários

---

## 📊 **Monitoramento:**

### **Logs para Acompanhar:**
- Webhooks recebidos do Asaas
- Pagamentos confirmados
- Usuários ativados automaticamente
- Erros de integração

### **Métricas Importantes:**
- Taxa de sucesso dos pagamentos
- Tempo de confirmação dos webhooks
- Volume de transações
- Erros de integração

---

## 🆘 **Suporte e Troubleshooting:**

### **Problemas Comuns:**
- **Webhook não funciona:** Verifique se a URL está acessível
- **Pagamento não confirma:** Verifique logs do servidor
- **Erro 401:** Verifique chave de API de produção
- **QR Code não aparece:** Verifique configurações do PIX

### **Links Úteis:**
- **Painel Asaas:** https://www.asaas.com
- **Documentação:** https://docs.asaas.com
- **Suporte Asaas:** https://ajuda.asaas.com
- **Status da API:** https://status.asaas.com

---

## 🎯 **Próximos Passos:**

1. **Configure suas credenciais** no arquivo `.env`
2. **Configure o webhook** no painel do Asaas
3. **Faça o deploy** da aplicação
4. **Teste a integração** com pagamentos reais
5. **Monitore os logs** e métricas
6. **Configure alertas** para problemas

---

## ⚠️ **Importante:**

- **Use sempre chaves de PRODUÇÃO** do Asaas
- **Configure o webhook** com a URL de produção
- **Teste em ambiente real** antes de usar
- **Monitore constantemente** os logs e métricas
- **Tenha um plano de backup** para problemas
