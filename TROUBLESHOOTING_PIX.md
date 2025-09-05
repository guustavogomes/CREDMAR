# 🔧 Guia de Resolução de Problemas - PIX

## ❌ Problema: "Erro ao gerar código PIX"

### 🔍 **Possíveis Causas e Soluções:**

#### **1. Problema de Autenticação**
- **Sintoma:** Erro 401 ou redirecionamento para login
- **Solução:** Faça login na aplicação primeiro
- **Teste:** Acesse https://tapago-f7cbkk1yf-gustavo-gomes-projects-0b92cb30.vercel.app/auth/signin

#### **2. Configuração Inválida**
- **Sintoma:** Erro 500 com "Configuração do pagamento inválida"
- **Verificar:**
  ```bash
  # Verifique se as variáveis estão configuradas na Vercel
  - PIX_KEY
  - PIX_MERCHANT_NAME  
  - PIX_MERCHANT_CITY
  - MONTHLY_AMOUNT
  ```

#### **3. Valor Muito Baixo**
- **Sintoma:** Erro de validação
- **Solução:** Valor mínimo é R$ 0,01
- **Configurar:** `MONTHLY_AMOUNT=0.01` ou maior

#### **4. Problema no Banco de Dados**
- **Sintoma:** Erro ao salvar pagamento
- **Verificar:** Conexão com PostgreSQL na Vercel

### 🧪 **Como Debugar:**

#### **1. Verificar Logs da Vercel**
1. Acesse: https://vercel.com/dashboard
2. Vá no seu projeto > Functions
3. Clique em "View Function Logs"
4. Procure por logs com "=== INICIANDO GERAÇÃO PIX ==="

#### **2. Verificar Console do Navegador**
1. Abra a página de pagamento
2. Pressione F12 (DevTools)
3. Vá na aba Console
4. Procure por erros em vermelho

#### **3. Teste Local**
```bash
# Teste a geração do PIX localmente
node test-pix.js

# Deve mostrar:
# ✅ PIX CODE GERADO COM SUCESSO!
```

### 🔧 **Soluções Rápidas:**

#### **Solução 1: Reconfigurar Variáveis**
Na Vercel Dashboard:
```env
PIX_KEY=cce3e219-d60a-4c42-9e17-809f85bca641
PIX_MERCHANT_NAME=GUSTAVO NOVAES GOMES
PIX_MERCHANT_CITY=DIVINOPOLIS
PIX_DESCRIPTION=TAPAGO MENSALIDADE
MONTHLY_AMOUNT=0.01
```

#### **Solução 2: Limpar Cache**
```bash
# Fazer novo deploy
vercel --prod

# Ou limpar cache do navegador
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

#### **Solução 3: Verificar Status do Usuário**
```sql
-- No banco de dados, verificar se o usuário tem status correto
SELECT email, status FROM users WHERE email = 'seu-email@exemplo.com';

-- Se necessário, atualizar status
UPDATE users SET status = 'PENDING_PAYMENT' WHERE email = 'seu-email@exemplo.com';
```

### 📊 **Logs Esperados (Sucesso):**

```
=== INICIANDO GERAÇÃO PIX ===
Session user ID: cuid_do_usuario
Validando configurações...
Resultado da validação: { isValid: true, errors: [] }
✅ Configurações válidas
Gerando código PIX com configurações: {
  pixKey: "cce3e219-d60a-4c42-9e17-809f85bca641",
  merchantName: "GUSTAVO NOVAES GOMES",
  merchantCity: "DIVINOPOLIS",
  amount: 0.01,
  description: "TAPAGO MENSALIDADE"
}
✅ PIX Code gerado com sucesso
```

### 📊 **Logs de Erro (Exemplo):**

```
❌ ERRO GERAL ao gerar PIX: Error: Chave PIX inválida
Stack trace: Error: Chave PIX inválida
    at validatePixKey (route.ts:45:11)
    at generatePixCode (route.ts:67:23)
```

### 🚨 **Casos Específicos:**

#### **Erro: "Chave PIX inválida"**
- Verifique se a chave PIX está no formato correto
- UUID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- CPF: `12345678901` (11 dígitos)
- Email: `email@exemplo.com`

#### **Erro: "MONTHLY_AMOUNT deve ser pelo menos R$ 0,01"**
- Configure `MONTHLY_AMOUNT=0.01` ou maior
- Não use valores negativos ou zero

#### **Erro: "Não autorizado"**
- Faça login na aplicação
- Verifique se a sessão não expirou
- Tente fazer logout e login novamente

### 🎯 **URLs para Teste:**

1. **Login:** https://tapago-f7cbkk1yf-gustavo-gomes-projects-0b92cb30.vercel.app/auth/signin
2. **Registro:** https://tapago-f7cbkk1yf-gustavo-gomes-projects-0b92cb30.vercel.app/auth/signup  
3. **PIX:** https://tapago-f7cbkk1yf-gustavo-gomes-projects-0b92cb30.vercel.app/pending-payment
4. **Dashboard:** https://tapago-f7cbkk1yf-gustavo-gomes-projects-0b92cb30.vercel.app/dashboard

### 📞 **Próximos Passos se o Problema Persistir:**

1. **Verifique os logs da Vercel** (mais importante)
2. **Teste com uma conta nova** 
3. **Verifique se o banco de dados está funcionando**
4. **Confirme se todas as variáveis de ambiente estão configuradas**
5. **Teste em modo incógnito** (para descartar cache)

### 💡 **Dica Final:**
O valor de R$ 0,01 está configurado e funcionando. Se ainda houver erro, o problema provavelmente é de autenticação ou configuração de variáveis na Vercel.