# 🚀 Comandos Vercel CLI - Configuração de Produção

## 📋 **Comandos para executar na Vercel CLI:**

### **1. Verificar se Vercel CLI está instalado:**
```bash
vercel --version
```

### **2. Se não estiver instalado, instale:**
```bash
npm install -g vercel
```

### **3. Fazer login na Vercel:**
```bash
vercel login
```

### **4. Configurar variáveis automáticas:**
```bash
# URL da aplicação
vercel env add NEXTAUTH_URL production
# Valor: https://www.organizaemprestimos.com.br

# Ambiente do Asaas
vercel env add ASAAS_ENVIRONMENT production
# Valor: production

# Token do webhook
vercel env add ASAAS_WEBHOOK_TOKEN production
# Valor: webhook_organiza_emprestimos_mf4ow1hg_cjwofz5i54r

# Valor da mensalidade
vercel env add MONTHLY_AMOUNT production
# Valor: 100.00

# Timeout de pagamento
vercel env add PAYMENT_TIMEOUT_MINUTES production
# Valor: 30

# Nome do merchant PIX
vercel env add PIX_MERCHANT_NAME production
# Valor: Organiza Empréstimos

# Cidade do merchant PIX
vercel env add PIX_MERCHANT_CITY production
# Valor: São Paulo

# Descrição do PIX
vercel env add PIX_DESCRIPTION production
# Valor: Organiza Empréstimos - Mensalidade

# Email de envio
vercel env add EMAIL_FROM production
# Valor: noreply@organizaemprestimos.com.br

# Servidor SMTP
vercel env add EMAIL_SERVER_HOST production
# Valor: smtp.gmail.com

# Porta SMTP
vercel env add EMAIL_SERVER_PORT production
# Valor: 587
```

### **5. Configurar variáveis manuais (com seus valores reais):**
```bash
# URL do banco de dados
vercel env add DATABASE_URL production
# Valor: sua_url_do_banco_de_dados

# Secret do NextAuth
vercel env add NEXTAUTH_SECRET production
# Valor: seu_secret_key_seguro

# Chave da API do Asaas
vercel env add ASAAS_API_KEY production
# Valor: sua_chave_de_producao_do_asaas

# ID do cliente no Asaas
vercel env add ASAAS_CUSTOMER_ID production
# Valor: seu_customer_id_do_asaas

# Chave PIX
vercel env add PIX_KEY production
# Valor: sua_chave_pix

# Secret do webhook
vercel env add WEBHOOK_SECRET production
# Valor: seu_webhook_secret

# Usuário do email
vercel env add EMAIL_SERVER_USER production
# Valor: seu_email@gmail.com

# Senha do email
vercel env add EMAIL_SERVER_PASSWORD production
# Valor: sua_senha_de_app
```

### **6. Verificar variáveis configuradas:**
```bash
vercel env ls
```

### **7. Fazer deploy de produção:**
```bash
vercel --prod
```

---

## 🎯 **Script automatizado (alternativa):**

Se preferir, execute o script automatizado:
```bash
bash setup-vercel-env.sh
```

---

## 📝 **Checklist de configuração:**

- [ ] Vercel CLI instalado
- [ ] Login feito na Vercel
- [ ] Variáveis automáticas configuradas
- [ ] Variáveis manuais configuradas
- [ ] Deploy de produção realizado
- [ ] Aplicação testada em produção

---

## 🔍 **Verificações importantes:**

### **1. Verificar se todas as variáveis estão configuradas:**
```bash
vercel env ls
```

### **2. Testar a aplicação:**
- Acesse: https://www.organizaemprestimos.com.br
- Teste login/registro
- Teste criação de pagamento
- Verifique se o webhook está funcionando

### **3. Verificar logs:**
```bash
vercel logs
```

---

## 🆘 **Troubleshooting:**

### **Erro de autenticação:**
```bash
vercel logout
vercel login
```

### **Erro de variável:**
```bash
vercel env rm NOME_DA_VARIAVEL production
vercel env add NOME_DA_VARIAVEL production
```

### **Verificar status do projeto:**
```bash
vercel ls
```

---

## 🔗 **Links úteis:**

- **Painel Vercel:** https://vercel.com/dashboard
- **Documentação:** https://vercel.com/docs
- **Seu app:** https://www.organizaemprestimos.com.br
- **Logs:** https://vercel.com/dashboard/[seu-projeto]/functions
