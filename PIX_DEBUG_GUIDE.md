# 🔧 Guia de Debug do Sistema PIX - Tapago

## ✅ Melhorias Implementadas

### 1. **Validação Rigorosa da Chave PIX**
- Suporte para UUID, CPF, CNPJ, Email e Telefone
- Validação automática do formato antes da geração
- Logs detalhados do tipo de chave detectado

### 2. **Algoritmo CRC16 Aprimorado**
- Implementação mais robusta usando TextEncoder
- Garantia de resultado sempre com 4 dígitos hexadecimais
- Logs do cálculo do CRC para debug

### 3. **Normalização de Dados**
- Remoção automática de acentos (NFD normalization)
- Limitação correta de tamanhos conforme padrão do Banco Central
- Conversão para maiúsculas e trim automático

### 4. **Logs Detalhados**
- Debug completo da geração do PIX na API
- Validação de estrutura do código gerado
- Informações de debug na interface (modo desenvolvimento)

### 5. **Validações de Estrutura**
- Verificação se o código inicia com "000201"
- Confirmação da presença de "BR.GOV.BCB.PIX"
- Validação do tamanho (100-512 caracteres)
- Verificação da presença do CRC

## 🧪 Como Testar

### 1. **Teste Local**
```bash
node test-pix.js
```

### 2. **Teste na Aplicação**
1. Acesse: https://tapago-nliqru0fe-gustavo-gomes-projects-0b92cb30.vercel.app/pending-payment
2. Faça login ou crie uma conta
3. Observe os logs no console do navegador (F12)
4. Teste o QR Code com seu app bancário

### 3. **Logs da Vercel**
- Acesse o painel da Vercel
- Vá em Functions > View Function Logs
- Procure por "=== DEBUG PIX GENERATION ==="

## 📊 Dados Atuais do PIX

```
Chave PIX: cce3e219-d60a-4c42-9e17-809f85bca641 (UUID)
Nome: GUSTAVO NOVAES GOMES (20 chars)
Cidade: DIVINOPOLIS (11 chars)
Descrição: TAPAGO MENSALIDADE (18 chars)
Valor: R$ 100,00
```

## 🔍 Estrutura do Código PIX Gerado

```
Tamanho: 174 caracteres
Formato: 00020101021226800014BR.GOV.BCB.PIX0136cce3e219-d60a-4c42-9e17-809f85bca6410218TAPAGO MENSALIDADE5204000053039865406100.005802BR5920GUSTAVO NOVAES GOMES6011DIVINOPOLIS63048584
```

### Campos:
- `000201`: Format Indicator
- `0112`: Point of Initiation Method (estático)
- `2680...`: Merchant Account Information
- `52040000`: Merchant Category Code
- `53039865`: Currency (986 = BRL)
- `5406100.00`: Amount
- `5802BR`: Country Code
- `5920GUSTAVO NOVAES GOMES`: Merchant Name
- `6011DIVINOPOLIS`: Merchant City
- `63048584`: CRC16

## 🚨 Possíveis Problemas e Soluções

### 1. **Banco não aceita o PIX**
- Verifique se a chave PIX está ativa no seu banco
- Confirme se o valor está correto (R$ 100,00)
- Teste com diferentes bancos

### 2. **QR Code não funciona**
- Verifique os logs no console
- Teste copiar e colar o código PIX manualmente
- Confirme se o app bancário está atualizado

### 3. **Erro na geração**
- Verifique os logs da Vercel
- Confirme se as variáveis de ambiente estão configuradas
- Teste o script local `test-pix.js`

## 🔧 Configuração de Variáveis de Ambiente

```env
PIX_KEY=cce3e219-d60a-4c42-9e17-809f85bca641
PIX_MERCHANT_NAME=GUSTAVO NOVAES GOMES
PIX_MERCHANT_CITY=DIVINOPOLIS
```

## 📱 Bancos Testados

- [ ] Nubank
- [ ] Inter
- [ ] Itaú
- [ ] Bradesco
- [ ] Banco do Brasil
- [ ] Santander
- [ ] C6 Bank
- [ ] PicPay

## 🎯 Próximos Passos

1. Testar com diferentes bancos
2. Implementar webhook para confirmação automática
3. Adicionar timeout para pagamentos
4. Melhorar UX da página de pagamento
5. Adicionar histórico de tentativas de pagamento