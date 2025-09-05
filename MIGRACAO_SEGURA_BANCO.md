# 🔒 Migração Segura do Banco de Dados

## ⚠️ **IMPORTANTE: Banco Contém Dados!**

Esta migração foi criada para ser **100% segura** e **não afetar dados existentes**.

## 🎯 **O que a Migração Faz:**

### ✅ **Adiciona Apenas:**
- Colunas do Asaas na tabela `payments`
- Todas as colunas são **opcionais** (NULL permitido)
- **Nenhum dado existente é modificado**

### ❌ **NÃO Remove:**
- Nenhuma coluna existente
- Nenhum dado existente
- Nenhuma estrutura existente

---

## 📋 **Passo a Passo Seguro:**

### **1. Baixar Variáveis de Ambiente:**
```bash
vercel env pull .env.production
```

### **2. Instalar Dependências (se necessário):**
```bash
npm install pg dotenv
```

### **3. Executar Migração Segura:**
```bash
node executar-migracao-segura.js
```

### **4. Verificar Resultado:**
- ✅ Colunas do Asaas adicionadas
- ✅ Dados existentes preservados
- ✅ Tabela funcionando normalmente

---

## 🔍 **Colunas que Serão Adicionadas:**

```sql
-- Campos específicos do Asaas (todos opcionais)
asaasPaymentId        TEXT        -- ID da cobrança no Asaas
asaasCustomerId       TEXT        -- ID do cliente no Asaas
asaasExternalReference TEXT       -- Referência externa no Asaas
asaasPixQrCode        TEXT        -- QR Code PIX do Asaas
asaasPixPayload       TEXT        -- Payload PIX do Asaas
asaasDueDate          TIMESTAMP   -- Data de vencimento no Asaas
asaasNetValue         FLOAT       -- Valor líquido recebido
asaasOriginalValue    FLOAT       -- Valor original da cobrança
asaasInterestValue    FLOAT       -- Valor de juros
```

---

## 🛡️ **Segurança da Migração:**

### **✅ Verificações Automáticas:**
- Verifica se a coluna já existe antes de adicionar
- Usa `IF NOT EXISTS` para evitar erros
- Preserva todos os dados existentes
- Não modifica estrutura existente

### **✅ Backup Automático:**
- A migração é **não-destrutiva**
- Dados existentes **não são tocados**
- Estrutura existente **não é modificada**

---

## 🧪 **Como Testar Após Migração:**

### **1. Verificar Colunas:**
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND column_name LIKE 'asaas%'
ORDER BY column_name;
```

### **2. Verificar Dados:**
```sql
SELECT COUNT(*) as total_pagamentos FROM payments;
SELECT COUNT(*) as pagamentos_asaas FROM payments WHERE "asaasPaymentId" IS NOT NULL;
```

### **3. Testar API:**
```bash
curl -X POST https://www.organizaemprestimos.com.br/api/payment/asaas/create \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "method": "PIX"}'
```

---

## 🚨 **Em Caso de Problema:**

### **Rollback (se necessário):**
```sql
-- Remover colunas do Asaas (apenas se necessário)
ALTER TABLE payments DROP COLUMN IF EXISTS "asaasPaymentId";
ALTER TABLE payments DROP COLUMN IF EXISTS "asaasCustomerId";
-- ... (outras colunas)
```

### **Verificar Logs:**
```bash
vercel logs [URL_DO_DEPLOYMENT]
```

---

## 📊 **Antes e Depois:**

### **Antes da Migração:**
- ❌ Erro: `The column 'payments.asaasPaymentId' does not exist`
- ❌ API retorna 500
- ❌ Pagamentos não funcionam

### **Depois da Migração:**
- ✅ Colunas do Asaas existem
- ✅ API funciona normalmente
- ✅ Pagamentos são criados com sucesso
- ✅ Dados existentes preservados

---

## 🎯 **Próximos Passos:**

1. ✅ Executar migração segura
2. ✅ Verificar se colunas foram adicionadas
3. ✅ Testar criação de pagamento
4. ✅ Configurar credenciais reais do Asaas
5. ✅ Fazer deploy final

---

## 📞 **Suporte:**

### **Se algo der errado:**
1. Verificar logs da migração
2. Verificar se dados existentes estão intactos
3. Executar rollback se necessário
4. Contatar suporte

---

**🔒 Esta migração é 100% segura e não afetará seus dados existentes!**
