# Guia do Usuário - Credor Gestor

## O que é o Credor Gestor?

O **Credor Gestor** é uma funcionalidade que permite designar um credor especial para representar seu **capital próprio**. Quando você faz empréstimos usando seus próprios recursos (não de terceiros), o credor gestor é usado para controlar esse fluxo financeiro.

## Principais Características

### ✅ **Único por Conta**
- Apenas um credor pode ser gestor por vez
- Representa seu capital próprio/empresa

### ✅ **Pré-seleção Automática**
- É automaticamente selecionado em novos empréstimos
- Agiliza o processo quando você usa capital próprio

### ✅ **Identificação Visual**
- Badge dourado com ícone de coroa
- Aparece sempre no topo da lista de credores

### ✅ **Proteção de Dados**
- Não pode ser alterado se há empréstimos ativos
- Garante integridade do histórico financeiro

## Como Usar

### 1. Definindo o Primeiro Credor Gestor

#### **Ao Criar um Novo Credor:**

1. Acesse **Dashboard → Credores → Novo Credor**
2. Preencha os dados normalmente
3. Marque a opção **"Definir como Credor Gestor (Capital Próprio)"**
4. Clique em **"Salvar Credor"**

#### **Transformando um Credor Existente:**

1. Acesse **Dashboard → Credores**
2. Clique em **"Editar"** no credor desejado
3. Marque a opção **"Definir como Credor Gestor (Capital Próprio)"**
4. Clique em **"Salvar Alterações"**

### 2. Identificando o Credor Gestor

Na listagem de credores, o gestor é facilmente identificado:

```
┌─────────────────────────────────────┐
│ 👤 João Silva - Capital Próprio     │
│    123.456.789-00                   │
│    👑 Gestor  📊 5 empréstimo(s)    │
└─────────────────────────────────────┘
```

### 3. Usando em Empréstimos

Quando você criar um novo empréstimo:

1. O **credor gestor será pré-selecionado** automaticamente
2. Você pode alterar para outro credor se necessário
3. O gestor aparece com destaque na lista de seleção

### 4. Alterando o Credor Gestor

#### **Quando é Possível:**
- ✅ Credor gestor não possui empréstimos ativos
- ✅ Todos os empréstimos estão quitados ou cancelados

#### **Quando NÃO é Possível:**
- ❌ Há empréstimos ativos vinculados ao gestor atual
- ❌ Sistema mostrará mensagem explicativa

#### **Como Alterar:**
1. Quite todos os empréstimos ativos do gestor atual
2. Edite o credor desejado
3. Marque como gestor (o anterior será automaticamente desmarcado)

## Cenários de Uso

### 📊 **Cenário 1: Capital 100% Próprio**

Você trabalha apenas com seu próprio dinheiro:

1. Crie um credor chamado "Capital Próprio" ou seu nome
2. Defina como gestor
3. Use sempre este credor em seus empréstimos

### 📊 **Cenário 2: Capital Misto**

Você usa tanto capital próprio quanto de terceiros:

1. Crie credores para cada investidor externo
2. Defina um como gestor (seu capital)
3. Selecione o credor apropriado para cada empréstimo

### 📊 **Cenário 3: Mudança de Estratégia**

Você quer alterar qual credor representa seu capital:

1. Quite todos os empréstimos do gestor atual
2. Defina outro credor como gestor
3. Novos empréstimos usarão o novo gestor como padrão

## Fluxo de Caixa e Credor Gestor

O credor gestor funciona normalmente no **Fluxo de Caixa**:

### **Movimentações Automáticas:**
- ✅ **Débito** quando empréstimo é criado
- ✅ **Comissão** quando parcela é paga (se configurada)

### **Movimentações Manuais:**
- ✅ **Depósitos** - aportes de capital próprio
- ✅ **Saques** - retiradas de lucro

### **Saldo em Tempo Real:**
- ✅ Acompanhe quanto de capital próprio está disponível
- ✅ Controle total sobre seus recursos

## Dicas e Boas Práticas

### 💡 **Nomenclatura Clara**
```
✅ Bom: "Capital Próprio", "João Silva - Gestor", "Empresa XYZ"
❌ Evite: "Credor 1", "Teste", "Temporário"
```

### 💡 **Organização Financeira**
- Use o credor gestor para capital próprio
- Crie credores separados para cada investidor
- Mantenha descrições claras em cada credor

### 💡 **Controle de Saldo**
- Monitore regularmente o saldo do gestor
- Faça aportes via "Nova Movimentação" quando necessário
- Acompanhe o fluxo de caixa para decisões estratégicas

### 💡 **Planejamento de Mudanças**
- Planeje com antecedência alterações de gestor
- Quite empréstimos ativos antes de alterar
- Comunique mudanças à equipe se aplicável

## Solução de Problemas

### ❓ **"Não consigo alterar o credor gestor"**

**Causa:** Há empréstimos ativos vinculados ao gestor atual.

**Solução:**
1. Acesse **Dashboard → Empréstimos**
2. Filtre por credor gestor
3. Quite todos os empréstimos ativos
4. Tente alterar novamente

### ❓ **"Não aparece a opção de gestor"**

**Causa:** Já existe outro credor gestor.

**Solução:**
1. Apenas um credor pode ser gestor
2. Remova a flag do gestor atual primeiro
3. Ou use a edição direta (remove automaticamente)

### ❓ **"Credor gestor não aparece pré-selecionado"**

**Causa:** Cache do navegador ou erro temporário.

**Solução:**
1. Atualize a página (F5)
2. Limpe o cache do navegador
3. Verifique se o credor ainda é gestor

### ❓ **"Saldo do gestor está incorreto"**

**Causa:** Possível inconsistência nos dados.

**Solução:**
1. Verifique o histórico no Fluxo de Caixa
2. Contate o suporte se necessário
3. Sistema possui correção automática de inconsistências

## Perguntas Frequentes

### **P: Posso ter mais de um credor gestor?**
R: Não. Apenas um credor pode ser gestor por conta. Isso garante clareza na gestão do capital próprio.

### **P: O que acontece se eu excluir o credor gestor?**
R: Você não pode excluir um credor que possui empréstimos. Quite todos os empréstimos primeiro, depois poderá excluir.

### **P: O credor gestor afeta os relatórios?**
R: Não. O credor gestor é apenas uma marcação para facilitar o uso. Todos os relatórios funcionam normalmente.

### **P: Posso usar o sistema sem credor gestor?**
R: Sim. O credor gestor é opcional. Se não definir nenhum, você precisará selecionar o credor manualmente em cada empréstimo.

### **P: Como migrar de outro sistema?**
R: Importe seus credores normalmente e depois defina um como gestor. O sistema se adaptará automaticamente.

## Suporte

Se você encontrar problemas ou tiver dúvidas:

1. **Consulte este guia** primeiro
2. **Verifique as mensagens** do sistema (são explicativas)
3. **Contate o suporte** se o problema persistir

O sistema possui **correção automática** de inconsistências e **validações robustas** para garantir que seus dados estejam sempre íntegros.