# 💰 Guia Completo de Configuração do Sistema de Pagamento

## ✅ Sistema Implementado

### 🔧 **1. Configuração de Valores**

O valor do PIX agora é configurável através de variáveis de ambiente:

```env
# .env ou .env.production
MONTHLY_AMOUNT="100.00"  # Altere aqui o valor da mensalidade
PIX_KEY="sua-chave-pix"
PIX_MERCHANT_NAME="SEU NOME"
PIX_MERCHANT_CITY="SUA CIDADE"
PIX_DESCRIPTION="TAPAGO MENSALIDADE"
```

### 🤖 **2. Aprovação Automática**

Sistema implementado com duas opções:

#### **Opção A: Webhook Real (Recomendado)**
- Configure um webhook no seu banco/gateway de pagamento
- URL: `https://seu-app.vercel.app/api/payment/webhook`
- Método: `POST`
- Header: `x-webhook-signature: seu-webhook-secret`

#### **Opção B: Simulação para Testes**
- Botão "🧪 Simular Pagamento" na interface (apenas desenvolvimento)
- Ativa automaticamente a conta para testes

## 🚀 **Como Configurar**

### **1. Variáveis de Ambiente na Vercel**

Acesse o painel da Vercel e configure:

```env
MONTHLY_AMOUNT=150.00
PIX_KEY=sua-chave-pix-real
PIX_MERCHANT_NAME=SEU NOME COMPLETO
PIX_MERCHANT_CITY=SUA CIDADE
PIX_DESCRIPTION=TAPAGO MENSALIDADE
WEBHOOK_SECRET=seu-secret-super-seguro
```

### **2. Configurar Webhook no Banco**

**Para bancos que suportam webhook:**

1. **Mercado Pago:**
   ```bash
   curl -X POST \
     'https://api.mercadopago.com/v1/webhooks' \
     -H 'Authorization: Bearer SEU_ACCESS_TOKEN' \
     -H 'Content-Type: application/json' \
     -d '{
       "url": "https://seu-app.vercel.app/api/payment/webhook",
       "events": ["payment"]
     }'
   ```

2. **PagSeguro:**
   - Acesse o painel do PagSeguro
   - Vá em Integrações > Notificações
   - Configure a URL do webhook

3. **Outros Bancos:**
   - Consulte a documentação do seu banco
   - Configure para enviar notificações de pagamento PIX

### **3. Formato do Webhook**

Seu sistema de pagamento deve enviar dados neste formato:

```json
{
  "pixCode": "codigo-pix-gerado",
  "amount": 100.00,
  "status": "PAID",
  "transactionId": "TXN_123456789",
  "paidAt": "2025-08-31T01:30:00Z"
}
```

## 🧪 **Como Testar**

### **1. Teste Local**
```bash
# Inicie o servidor
npm run dev

# Execute o teste
node test-webhook.js
```

### **2. Teste na Produção**
1. Acesse: https://tapago-enebbbp3w-gustavo-gomes-projects-0b92cb30.vercel.app/pending-payment
2. Gere um PIX
3. Use o botão "🧪 Simular Pagamento" (desenvolvimento)
4. Ou faça um pagamento real e aguarde o webhook

### **3. Teste do Webhook**
```bash
# Teste direto do webhook
curl -X POST https://seu-app.vercel.app/api/payment/webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: seu-webhook-secret" \
  -d '{
    "pixCode": "seu-codigo-pix",
    "amount": 100.00,
    "status": "PAID",
    "transactionId": "TEST_123",
    "paidAt": "2025-08-31T01:30:00Z"
  }'
```

## 📊 **Monitoramento**

### **1. Logs da Vercel**
- Acesse: Vercel Dashboard > Functions > View Function Logs
- Procure por: "=== WEBHOOK PAGAMENTO RECEBIDO ==="

### **2. Logs de Debug**
- Console do navegador (F12) na página de pagamento
- Logs detalhados da geração do PIX

### **3. Banco de Dados**
```sql
-- Verificar pagamentos pendentes
SELECT * FROM payments WHERE status = 'PENDING';

-- Verificar usuários ativos
SELECT * FROM users WHERE status = 'ACTIVE';

-- Histórico de pagamentos
SELECT u.email, p.amount, p.status, p.createdAt, p.approvedAt 
FROM payments p 
JOIN users u ON p.userId = u.id 
ORDER BY p.createdAt DESC;
```

## 🔧 **Alterando o Valor**

### **Método 1: Variável de Ambiente (Recomendado)**
1. Acesse o painel da Vercel
2. Vá em Settings > Environment Variables
3. Edite `MONTHLY_AMOUNT` para o novo valor
4. Faça um novo deploy

### **Método 2: Código Direto**
Edite `src/lib/payment-config.ts`:
```typescript
export const PAYMENT_CONFIG = {
  MONTHLY_AMOUNT: 150.00, // Novo valor aqui
  // ...
}
```

## 🚨 **Troubleshooting**

### **Problema: PIX não é aceito pelo banco**
- ✅ Verifique se a chave PIX está ativa
- ✅ Confirme se o valor está correto
- ✅ Teste com diferentes bancos

### **Problema: Webhook não funciona**
- ✅ Verifique a URL do webhook
- ✅ Confirme o header `x-webhook-signature`
- ✅ Verifique os logs da Vercel

### **Problema: Usuário não é ativado**
- ✅ Verifique se o webhook foi recebido
- ✅ Confirme se o PIX code confere
- ✅ Verifique se o valor está correto

## 🎯 **URLs Importantes**

- **App:** https://tapago-enebbbp3w-gustavo-gomes-projects-0b92cb30.vercel.app
- **Pagamento:** https://tapago-enebbbp3w-gustavo-gomes-projects-0b92cb30.vercel.app/pending-payment
- **Webhook:** https://tapago-enebbbp3w-gustavo-gomes-projects-0b92cb30.vercel.app/api/payment/webhook

## 📞 **Próximos Passos**

1. **Configure as variáveis de ambiente na Vercel**
2. **Teste o sistema com o botão de simulação**
3. **Configure o webhook no seu banco/gateway**
4. **Monitore os logs para garantir funcionamento**
5. **Documente quais bancos funcionam melhor**

Agora seu sistema está pronto para receber pagamentos PIX e ativar usuários automaticamente! 🎉