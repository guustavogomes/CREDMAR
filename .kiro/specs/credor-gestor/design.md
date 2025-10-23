# Design Document - Credor Gestor

## Overview

A funcionalidade de Credor Gestor permite que usuários designem um credor especial para representar seu capital próprio. Este credor será usado quando não há um credor externo específico para um empréstimo, facilitando a gestão de recursos próprios no sistema.

## Architecture

### Database Schema Changes

#### Creditor Model Update
```sql
ALTER TABLE creditors ADD COLUMN isManager BOOLEAN DEFAULT FALSE;
CREATE INDEX idx_creditors_manager ON creditors(userId, isManager) WHERE isManager = TRUE;
```

#### Validation Constraints
- Apenas um credor gestor por usuário (validação em aplicação)
- Campo isManager não pode ser alterado se há empréstimos ativos vinculados

### API Endpoints

#### Existing Endpoints (Modified)
- `GET /api/creditors` - Incluir campo isManager na resposta
- `POST /api/creditors` - Validar unicidade do credor gestor
- `PUT /api/creditors/[id]` - Validar alteração da flag gestor

#### New Endpoints
- `POST /api/creditors/[id]/set-manager` - Definir credor como gestor
- `DELETE /api/creditors/[id]/unset-manager` - Remover flag gestor

## Components and Interfaces

### Frontend Components

#### CreditorForm Component
```typescript
interface CreditorFormData {
  nome: string
  cpf: string
  telefone?: string
  email?: string
  endereco?: string
  cidade?: string
  estado?: string
  observacoes?: string
  isManager: boolean // Novo campo
}
```

#### CreditorCard Component
```typescript
interface CreditorCardProps {
  creditor: {
    id: string
    nome: string
    cpf: string
    isManager: boolean // Novo campo
    balance?: number
  }
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggleManager: (id: string, isManager: boolean) => void // Nova função
}
```

#### ManagerBadge Component
```typescript
interface ManagerBadgeProps {
  isManager: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline'
}
```

### Backend Interfaces

#### Creditor Service
```typescript
interface CreditorService {
  setManager(creditorId: string, userId: string): Promise<void>
  unsetManager(creditorId: string, userId: string): Promise<void>
  validateManagerUniqueness(userId: string, excludeId?: string): Promise<boolean>
  canChangeManagerFlag(creditorId: string): Promise<boolean>
  getManagerCreditor(userId: string): Promise<Creditor | null>
}
```

## Data Models

### Updated Creditor Model
```typescript
interface Creditor {
  id: string
  cpf: string
  nome: string
  telefone?: string
  email?: string
  endereco?: string
  cidade?: string
  estado?: string
  observacoes?: string
  isManager: boolean // Novo campo
  userId: string
  deletedAt?: Date
  createdAt: Date
  updatedAt: Date
  loans: Loan[]
  cashFlows: CashFlow[]
}
```

### Validation Rules
```typescript
interface CreditorValidation {
  // Regras existentes mantidas
  cpf: string // Obrigatório, único por usuário
  nome: string // Obrigatório
  
  // Novas regras para gestor
  isManager: boolean // Apenas um por usuário
  canChangeManager: boolean // Baseado em empréstimos ativos
}
```

## Error Handling

### Validation Errors
```typescript
enum CreditorManagerErrors {
  MANAGER_ALREADY_EXISTS = 'MANAGER_ALREADY_EXISTS',
  CANNOT_CHANGE_MANAGER_WITH_LOANS = 'CANNOT_CHANGE_MANAGER_WITH_LOANS',
  MANAGER_NOT_FOUND = 'MANAGER_NOT_FOUND',
  INVALID_MANAGER_OPERATION = 'INVALID_MANAGER_OPERATION'
}
```

### Error Messages
```typescript
const errorMessages = {
  MANAGER_ALREADY_EXISTS: 'Já existe um credor gestor. Apenas um credor pode ser gestor por vez.',
  CANNOT_CHANGE_MANAGER_WITH_LOANS: 'Não é possível alterar o credor gestor pois há empréstimos ativos vinculados.',
  MANAGER_NOT_FOUND: 'Credor gestor não encontrado.',
  INVALID_MANAGER_OPERATION: 'Operação inválida para credor gestor.'
}
```

## Testing Strategy

### Unit Tests
1. **Creditor Service Tests**
   - Validação de unicidade do credor gestor
   - Verificação de empréstimos ativos antes de alterar flag
   - Operações de set/unset manager

2. **API Endpoint Tests**
   - POST /api/creditors com isManager=true
   - PUT /api/creditors/[id] alterando flag gestor
   - Validação de erros para múltiplos gestores

3. **Component Tests**
   - CreditorForm com campo isManager
   - ManagerBadge renderização
   - CreditorCard com ações de gestor

### Integration Tests
1. **Fluxo Completo**
   - Criar credor e definir como gestor
   - Tentar criar segundo gestor (deve falhar)
   - Criar empréstimo com credor gestor
   - Tentar alterar flag gestor (deve falhar)

2. **Migration Tests**
   - Verificar adição do campo isManager
   - Validar que todos os credores existentes têm isManager=false
   - Testar índice de performance

### E2E Tests
1. **Interface de Usuário**
   - Marcar credor como gestor via interface
   - Visualizar badge de gestor na listagem
   - Pré-seleção em novo empréstimo
   - Mensagens de erro apropriadas

## Performance Considerations

### Database Optimization
- Índice composto (userId, isManager) para consultas rápidas
- Consulta otimizada para encontrar credor gestor
- Cache de credor gestor por usuário

### Frontend Optimization
- Lazy loading do ManagerBadge component
- Memoização de validações de gestor
- Debounce em alterações de flag gestor

## Security Considerations

### Access Control
- Apenas o próprio usuário pode alterar seus credores
- Validação de propriedade do credor antes de operações
- Log de alterações de credor gestor para auditoria

### Data Integrity
- Validação de unicidade em nível de aplicação
- Transações para operações críticas
- Rollback automático em caso de erro

## Migration Strategy

### Phase 1: Database Migration
```sql
-- Adicionar campo isManager
ALTER TABLE creditors ADD COLUMN isManager BOOLEAN DEFAULT FALSE;

-- Criar índice para performance
CREATE INDEX idx_creditors_manager ON creditors(userId, isManager) WHERE isManager = TRUE;

-- Validar que todos os registros têm isManager=false
UPDATE creditors SET isManager = FALSE WHERE isManager IS NULL;
```

### Phase 2: Backend Implementation
1. Atualizar modelo Creditor
2. Implementar validações de negócio
3. Criar endpoints específicos para gestor
4. Adicionar testes unitários

### Phase 3: Frontend Implementation
1. Atualizar formulários de credor
2. Implementar ManagerBadge component
3. Atualizar listagens e seleções
4. Adicionar validações de UI

### Phase 4: Integration & Testing
1. Testes de integração completos
2. Testes E2E da funcionalidade
3. Validação de performance
4. Deploy em ambiente de teste

## Rollback Plan

### Database Rollback
```sql
-- Remover índice
DROP INDEX IF EXISTS idx_creditors_manager;

-- Remover campo (se necessário)
ALTER TABLE creditors DROP COLUMN IF EXISTS isManager;
```

### Application Rollback
- Feature flag para desabilitar funcionalidade
- Manter compatibilidade com versão anterior
- Rollback de código via Git

## Monitoring and Metrics

### Key Metrics
- Número de credores gestores por usuário
- Tentativas de criar múltiplos gestores
- Tentativas de alterar gestor com empréstimos
- Performance de consultas de credor gestor

### Alerts
- Múltiplos credores gestores detectados
- Falhas em operações de gestor
- Performance degradada em consultas