# Correção: Comissões Não Aparecem no PDF

## 🐛 Problema Identificado
A seção "Comissões sobre Valor Emprestado" parou de aparecer no PDF dos empréstimos.

## 🔍 Causa Raiz
A API `/api/loans/[id]` não estava retornando os campos necessários:
- ❌ `customer.route` (dados do intermediador)
- ❌ `creditor` (dados do credor)
- ❌ Campos `commission` e `creditorCommission` podem estar ausentes

## 🔧 Correções Aplicadas

### 1. **API Corrigida** (`/api/loans/[id]/route.ts`)
```typescript
// ANTES:
include: {
  customer: true,
  periodicity: true,
  // ...
}

// DEPOIS:
include: {
  customer: {
    include: {
      route: true  // ← ADICIONADO
    }
  },
  creditor: true,  // ← ADICIONADO
  periodicity: true,
  // ...
}
```

### 2. **Debug Adicionado** (`loan-pdf-generator.ts`)
```typescript
console.log('🔍 DEBUG PDF - Dados de comissão:', {
  commission: loanData.commission,
  creditorCommission: loanData.creditorCommission,
  hasCustomerRoute: !!loanData.customer?.route,
  hasCreditor: !!loanData.creditor,
  customerRoute: loanData.customer?.route?.description,
  creditorName: loanData.creditor?.nome
})
```

## 📋 Condições de Exibição no PDF

### **Seção de Comissões Aparece Se:**
```javascript
(loanData.commission || loanData.creditorCommission)
```

### **Comissão do Intermediador Aparece Se:**
```javascript
loanData.commission && loanData.customer.route
```

### **Comissão do Credor Aparece Se:**
```javascript
loanData.creditorCommission && loanData.creditor
```

## 🧪 Para Testar

### 1. **Verificar Console**
Ao gerar PDF, verifique o console para ver os dados de debug:
```
🔍 DEBUG PDF - Dados de comissão: {
  commission: 5,
  creditorCommission: 8,
  hasCustomerRoute: true,
  hasCreditor: true,
  customerRoute: "Intermediador Teste",
  creditorName: "Credor Teste"
}
```

### 2. **Cenários de Teste**
- ✅ Empréstimo com intermediador (commission + customer.route)
- ✅ Empréstimo com credor (creditorCommission + creditor)
- ✅ Empréstimo com ambos
- ✅ Empréstimo sem comissões (seção não deve aparecer)

### 3. **Resultado Esperado**
Se houver comissões, deve aparecer no PDF:
```
💰 Comissões sobre Valor Emprestado

• Comissão do Intermediador
  Intermediador: [Nome da Rota]
  Percentual: 5%
  Base de Cálculo: R$ 1.000,00
  Valor da Comissão: R$ 50,00

• Comissão do Credor  
  Credor: [Nome do Credor]
  Percentual: 8%
  Base de Cálculo: R$ 1.000,00
  Valor da Comissão: R$ 80,00
```

## ✅ Status
- ✅ API corrigida para incluir dados necessários
- ✅ Debug adicionado para facilitar troubleshooting
- ✅ Condições de exibição verificadas
- 🧪 Aguardando teste para confirmar correção