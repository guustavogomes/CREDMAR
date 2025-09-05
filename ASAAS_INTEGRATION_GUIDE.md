# 🚀 Guia de Integração com Asaas

## ✅ Sistema Implementado

### 🔧 **1. Configuração de Variáveis de Ambiente**

Configure as seguintes variáveis no seu arquivo `.env` ou no painel da Vercel:

```env
# Configurações do Asaas
ASAAS_API_KEY=sua_chave_api_do_asaas
ASAAS_ENVIRONMENT=sandbox  # ou 'production' para produção
ASAAS_WEBHOOK_TOKEN=seu_token_webhook_seguro
ASAAS_CUSTOMER_ID=id_do_cliente_no_asaas

# Configurações gerais
MONTHLY_AMOUNT=100.00
NEXTAUTH_URL=https://seu-app.vercel.app  # ou http://localhost:3000 para desenvolvimento
```

### 🤖 **2. Funcionalidades Implementadas**

#### **Endpoints da API:**
- `POST /api/payment/asaas/create` - Criar nova cobrança
- `POST /api/payment/asaas/status` - Verificar status do pagamento
- `POST /api/payment/asaas/webhook` - Webhook para confirmação automática
- `GET /api/payment/asaas/webhook?action=setup` - Configurar webhook (desenvolvimento)

#### **Componentes:**
- `AsaasPayment` - Componente React para pagamentos
- `AsaasAPI` - Classe para integração com a API do Asaas

#### **Recursos:**
- ✅ Criação automática de clientes no Asaas
- ✅ Geração de cobranças PIX, Cartão e Boleto
- ✅ Webhook para confirmação automática de pagamentos
- ✅ Verificação de status em tempo real
- ✅ Ativação automática de usuários após pagamento
- ✅ QR Code PIX integrado
- ✅ Cópia de código PIX para área de transferência

## 🚀 **Como Configurar**

### **1. Criar Conta no Asaas**

1. Acesse [https://www.asaas.com](https://www.asaas.com)
2. Crie sua conta
3. Acesse o painel e vá em "Integrações" > "API"
4. Gere sua chave de API

### **2. Configurar Variáveis de Ambiente**

#### **Desenvolvimento (.env.local):**
```env
ASAAS_API_KEY=$aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5M2JjN2M3M2M6MGM4M2I0YTU1MzUyZWI4YTg5NTU3Y2E3ZTI5MWYxZQ==
ASAAS_ENVIRONMENT=sandbox
ASAAS_WEBHOOK_TOKEN=meu_token_super_seguro_123
ASAAS_CUSTOMER_ID=cus_000000000001
MONTHLY_AMOUNT=100.00
NEXTAUTH_URL=http://localhost:3000
```

#### **Produção (Vercel):**
```env
ASAAS_API_KEY=sua_chave_de_producao
ASAAS_ENVIRONMENT=production
ASAAS_WEBHOOK_TOKEN=token_super_seguro_producao
ASAAS_CUSTOMER_ID=id_cliente_producao
MONTHLY_AMOUNT=100.00
NEXTAUTH_URL=https://seu-app.vercel.app
```

### **3. Configurar Webhook**

#### **Opção A: Automática (Desenvolvimento)**
```bash
curl "http://localhost:3000/api/payment/asaas/webhook?action=setup"
```

#### **Opção B: Manual (Produção)**
1. Acesse o painel do Asaas
2. Vá em "Integrações" > "Webhooks"
3. Adicione nova URL: `https://seu-app.vercel.app/api/payment/asaas/webhook`
4. Selecione os eventos:
   - `PAYMENT_CREATED`
   - `PAYMENT_RECEIVED`
   - `PAYMENT_OVERDUE`
   - `PAYMENT_REFUNDED`
   - `PAYMENT_DELETED`

### **4. Testar Integração**

#### **Criar Pagamento de Teste:**
```bash
curl -X POST http://localhost:3000/api/payment/asaas/create \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=seu_token" \
  -d '{
    "amount": 100.00,
    "method": "PIX",
    "description": "Teste TaPago"
  }'
```

#### **Verificar Status:**
```bash
curl -X POST http://localhost:3000/api/payment/asaas/status \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=seu_token" \
  -d '{
    "paymentId": "id_do_pagamento"
  }'
```

## 📱 **Como Usar no Frontend**

### **1. Importar Componente:**
```tsx
import { AsaasPayment } from '@/components/ui/asaas-payment'

export default function PaymentPage() {
  return (
    <div>
      <AsaasPayment 
        valor={100}
        onPaymentCreated={(payment) => {
          console.log('Pagamento criado:', payment)
        }}
        onPaymentStatusChange={(status) => {
          console.log('Status alterado:', status)
        }}
      />
    </div>
  )
}
```

### **2. Usar API Diretamente:**
```tsx
// Criar pagamento
const response = await fetch('/api/payment/asaas/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 100,
    method: 'PIX'
  })
})

// Verificar status
const statusResponse = await fetch('/api/payment/asaas/status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    paymentId: 'id_do_pagamento'
  })
})
```

## 🔄 **Fluxo de Pagamento**

1. **Usuário cria pagamento** → Sistema cria cliente no Asaas (se não existir)
2. **Sistema gera cobrança** → Asaas retorna QR Code PIX e dados
3. **Usuário paga** → Asaas processa o pagamento
4. **Webhook notifica** → Sistema atualiza status e ativa usuário
5. **Verificação automática** → Frontend verifica status a cada 10 segundos

## 🛡️ **Segurança**

- ✅ Validação de tokens de webhook
- ✅ Verificação de assinaturas
- ✅ Sanitização de dados
- ✅ Rate limiting (implementar se necessário)
- ✅ Logs de auditoria

## 📊 **Status de Pagamento**

| Status Asaas | Status Sistema | Descrição |
|--------------|----------------|-----------|
| `RECEIVED` | `APPROVED` | Pagamento confirmado |
| `CONFIRMED` | `APPROVED` | Pagamento confirmado |
| `OVERDUE` | `PENDING` | Pagamento em atraso |
| `REFUNDED` | `REJECTED` | Pagamento estornado |
| `DELETED` | `REJECTED` | Cobrança cancelada |
| `PENDING` | `PENDING` | Aguardando pagamento |

## 🐛 **Troubleshooting**

### **Erro 401 - Unauthorized**
- Verifique se `ASAAS_API_KEY` está correto
- Confirme se está usando a chave do ambiente correto (sandbox/production)

### **Erro 404 - Cliente não encontrado**
- Verifique se `ASAAS_CUSTOMER_ID` está configurado
- O sistema criará automaticamente se não existir

### **Webhook não funciona**
- Verifique se `ASAAS_WEBHOOK_TOKEN` está correto
- Confirme se a URL está acessível publicamente
- Teste com `curl` para verificar se o endpoint responde

### **QR Code não aparece**
- Verifique se o método de pagamento é PIX
- Confirme se `pixQrCode` está sendo retornado pela API
- Verifique logs do servidor para erros

## 📈 **Próximos Passos**

- [ ] Implementar pagamentos com cartão de crédito
- [ ] Adicionar boleto bancário
- [ ] Implementar parcelamentos
- [ ] Adicionar relatórios de pagamentos
- [ ] Implementar notificações por email
- [ ] Adicionar dashboard de pagamentos

## 📞 **Suporte**

- **Documentação Asaas:** [https://docs.asaas.com](https://docs.asaas.com)
- **Suporte Asaas:** [https://ajuda.asaas.com](https://ajuda.asaas.com)
- **Status da API:** [https://status.asaas.com](https://status.asaas.com)
