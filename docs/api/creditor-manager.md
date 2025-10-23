# API Documentation - Credor Gestor

## Overview

A funcionalidade de Credor Gestor permite que usuários designem um credor especial para representar seu capital próprio. Este documento descreve as APIs disponíveis para gerenciar credores gestores.

## Endpoints

### 1. Definir Credor como Gestor

**POST** `/api/creditors/{id}/set-manager`

Define um credor específico como gestor, removendo automaticamente a flag de outros credores do mesmo usuário.

#### Parâmetros

- `id` (path): ID do credor a ser definido como gestor

#### Validações

- Credor deve existir e pertencer ao usuário autenticado
- Não pode haver empréstimos ativos vinculados ao credor atual (se já for gestor)
- Apenas um credor pode ser gestor por usuário

#### Resposta de Sucesso

```json
{
  "success": true,
  "message": "Credor definido como gestor com sucesso"
}
```

#### Respostas de Erro

```json
// 400 - Já existe um gestor
{
  "error": "Já existe um credor gestor. Apenas um credor pode ser gestor por vez."
}

// 400 - Empréstimos ativos
{
  "error": "Não é possível alterar o credor gestor pois há empréstimos ativos vinculados."
}

// 404 - Credor não encontrado
{
  "error": "Credor não encontrado"
}
```

### 2. Remover Flag de Gestor

**POST** `/api/creditors/{id}/unset-manager`

Remove a flag de gestor de um credor específico.

#### Parâmetros

- `id` (path): ID do credor gestor

#### Validações

- Credor deve ser gestor do usuário autenticado
- Não pode haver empréstimos ativos vinculados ao credor

#### Resposta de Sucesso

```json
{
  "success": true,
  "message": "Flag de gestor removida com sucesso"
}
```

#### Respostas de Erro

```json
// 400 - Empréstimos ativos
{
  "error": "Não é possível alterar o credor gestor pois há empréstimos ativos vinculados."
}

// 404 - Gestor não encontrado
{
  "error": "Credor gestor não encontrado"
}
```

### 3. Listar Credores (Atualizada)

**GET** `/api/creditors`

Lista todos os credores do usuário, com o gestor aparecendo primeiro na ordenação.

#### Parâmetros de Query

- `search` (opcional): Termo de busca
- `page` (opcional): Página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 10)

#### Resposta

```json
{
  "creditors": [
    {
      "id": "creditor_id",
      "nome": "João Silva",
      "cpf": "12345678901",
      "telefone": "11999999999",
      "email": "joao@email.com",
      "isManager": true,
      "_count": {
        "loans": 5
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### 4. Criar Credor (Atualizada)

**POST** `/api/creditors`

Cria um novo credor com opção de definir como gestor.

#### Body

```json
{
  "cpf": "12345678901",
  "nome": "João Silva",
  "telefone": "11999999999",
  "email": "joao@email.com",
  "endereco": "Rua A, 123",
  "cidade": "São Paulo",
  "estado": "SP",
  "observacoes": "Observações",
  "isManager": true
}
```

#### Validações

- CPF e nome são obrigatórios
- Se `isManager` for true, não pode haver outro gestor para o usuário
- CPF deve ser único por usuário

#### Resposta de Sucesso

```json
{
  "id": "creditor_id",
  "nome": "João Silva",
  "cpf": "12345678901",
  "isManager": true,
  // ... outros campos
}
```

### 5. Atualizar Credor (Atualizada)

**PUT** `/api/creditors/{id}`

Atualiza um credor existente, incluindo a flag de gestor.

#### Body

```json
{
  "nome": "João Silva Santos",
  "telefone": "11888888888",
  "email": "joao.santos@email.com",
  "endereco": "Rua B, 456",
  "cidade": "São Paulo",
  "estado": "SP",
  "observacoes": "Observações atualizadas",
  "isManager": false
}
```

#### Validações

- Se alterando `isManager` para true, não pode haver outro gestor
- Se alterando `isManager` para false, não pode haver empréstimos ativos
- Nome é obrigatório

### 6. Verificação de Integridade

**GET** `/api/admin/creditor-integrity`

Verifica a integridade dos dados de credores gestores.

#### Parâmetros de Query

- `action`: Tipo de verificação
  - `check`: Verificação rápida do usuário atual
  - `report`: Relatório completo (admin)
  - `full-check`: Verificação completa com correções

#### Resposta para `action=check`

```json
{
  "isValid": true,
  "message": "Dados íntegros"
}
```

#### Resposta para `action=report`

```json
{
  "totalUsers": 100,
  "usersWithIssues": 2,
  "totalIssues": 3,
  "issuesByType": {
    "multiple_managers": 2,
    "other": 1
  },
  "details": [
    {
      "userId": "user_id",
      "userEmail": "user@email.com",
      "issues": ["Usuário possui 2 credores gestores"],
      "managerCount": 2
    }
  ]
}
```

**POST** `/api/admin/creditor-integrity`

Executa correções de integridade.

#### Body

```json
{
  "action": "fix-user",
  "userId": "user_id" // opcional, usa usuário atual se não fornecido
}
```

#### Resposta

```json
{
  "success": true,
  "fixedIssues": [
    "Removida flag de gestor do credor Maria Santos - mantido apenas João Silva"
  ],
  "message": "Problemas corrigidos"
}
```

## Regras de Negócio

### Unicidade do Gestor

- Apenas um credor pode ser gestor por usuário
- Ao definir um novo gestor, o anterior é automaticamente removido
- Validação ocorre tanto no frontend quanto no backend

### Restrições com Empréstimos Ativos

- Não é possível alterar a flag de gestor se há empréstimos com status `ACTIVE`
- Esta validação protege a integridade histórica dos dados
- Empréstimos com outros status não impedem a alteração

### Pré-seleção em Empréstimos

- O credor gestor é automaticamente pré-selecionado em novos empréstimos
- Esta seleção pode ser alterada pelo usuário
- Se não há gestor, nenhum credor é pré-selecionado

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Dados inválidos ou regras de negócio violadas |
| 401 | Usuário não autenticado |
| 404 | Credor não encontrado |
| 500 | Erro interno do servidor |

## Exemplos de Uso

### Definir Primeiro Gestor

```javascript
// 1. Criar credor como gestor
const response = await fetch('/api/creditors', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cpf: '12345678901',
    nome: 'Capital Próprio',
    isManager: true
  })
})

// 2. Ou definir credor existente como gestor
await fetch('/api/creditors/creditor_id/set-manager', {
  method: 'POST'
})
```

### Alterar Gestor

```javascript
// Remove gestor atual e define novo
await fetch('/api/creditors/new_creditor_id/set-manager', {
  method: 'POST'
})
```

### Verificar Integridade

```javascript
// Verificação rápida
const check = await fetch('/api/admin/creditor-integrity?action=check')
const result = await check.json()

if (!result.isValid) {
  // Corrigir problemas
  await fetch('/api/admin/creditor-integrity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'fix-user' })
  })
}
```

## Considerações de Performance

- Consultas de gestor usam índice otimizado `(userId, isManager)`
- Validações são executadas de forma eficiente
- Correções automáticas são executadas em transações

## Segurança

- Todas as operações requerem autenticação
- Usuários só podem gerenciar seus próprios credores
- Validações são executadas no backend independente do frontend