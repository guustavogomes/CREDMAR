# Requirements Document - Credor Gestor

## Introduction

Esta especificação define a implementação da funcionalidade de "Credor Gestor" no sistema CREDMAR. O Credor Gestor é um credor especial que representa o próprio usuário/empresa e é usado quando não há um credor externo específico para um empréstimo (capital próprio).

## Glossary

- **Sistema**: O sistema CREDMAR de gestão de empréstimos
- **Credor Gestor**: Credor especial que representa o capital próprio do usuário/empresa
- **Credor Externo**: Credores terceiros que emprestam dinheiro através do sistema
- **Flag Gestor**: Campo booleano que identifica qual credor é o gestor
- **Empréstimo Ativo**: Empréstimo com status ACTIVE no sistema

## Requirements

### Requirement 1

**User Story:** Como usuário do sistema, eu quero designar um credor como "Credor Gestor" para representar meu capital próprio, de forma que eu possa fazer empréstimos usando recursos próprios.

#### Acceptance Criteria

1. O Sistema SHALL permitir marcar apenas um credor como "Credor Gestor" por usuário
2. WHEN um credor é marcado como gestor, THE Sistema SHALL desmarcar automaticamente qualquer outro credor gestor do mesmo usuário
3. O Sistema SHALL exibir uma identificação visual clara para o credor gestor na listagem
4. WHERE um usuário não possui credor gestor, THE Sistema SHALL permitir marcar qualquer credor como gestor
5. O Sistema SHALL validar que apenas um credor gestor existe por usuário antes de salvar

### Requirement 2

**User Story:** Como usuário do sistema, eu quero que o credor gestor não possa ser alterado após ter empréstimos cadastrados, de forma que a integridade dos dados históricos seja mantida.

#### Acceptance Criteria

1. WHEN existe pelo menos um empréstimo ativo vinculado ao credor gestor, THE Sistema SHALL bloquear a alteração da flag gestor
2. O Sistema SHALL exibir mensagem explicativa quando tentar alterar credor gestor com empréstimos
3. WHEN um credor gestor possui empréstimos, THE Sistema SHALL desabilitar o campo de edição da flag gestor
4. O Sistema SHALL permitir alterar outros dados do credor gestor exceto a flag gestor
5. WHEN não há empréstimos ativos, THE Sistema SHALL permitir alterar a flag gestor normalmente

### Requirement 3

**User Story:** Como usuário do sistema, eu quero que o credor gestor seja claramente identificado na interface, de forma que eu possa distingui-lo facilmente dos credores externos.

#### Acceptance Criteria

1. O Sistema SHALL exibir um badge ou ícone especial para identificar o credor gestor
2. O Sistema SHALL mostrar "Capital Próprio" ou similar como identificação do credor gestor
3. WHEN listando credores, THE Sistema SHALL destacar visualmente o credor gestor
4. O Sistema SHALL exibir o credor gestor no topo da lista de credores
5. WHEN selecionando credor em empréstimos, THE Sistema SHALL identificar claramente o credor gestor

### Requirement 4

**User Story:** Como usuário do sistema, eu quero que o sistema valide a unicidade do credor gestor, de forma que não haja conflitos ou inconsistências nos dados.

#### Acceptance Criteria

1. O Sistema SHALL validar que apenas um credor gestor existe por usuário ao salvar
2. WHEN tentativa de marcar segundo credor como gestor, THE Sistema SHALL exibir erro explicativo
3. O Sistema SHALL verificar a integridade dos dados de credor gestor na inicialização
4. WHEN dados inconsistentes são detectados, THE Sistema SHALL registrar log de erro
5. O Sistema SHALL fornecer mecanismo para corrigir inconsistências de credor gestor

### Requirement 5

**User Story:** Como usuário do sistema, eu quero que o credor gestor seja automaticamente selecionado como padrão em novos empréstimos, de forma que o processo seja mais ágil quando uso capital próprio.

#### Acceptance Criteria

1. WHEN criando novo empréstimo, THE Sistema SHALL pré-selecionar o credor gestor se existir
2. O Sistema SHALL permitir alterar a seleção para outros credores normalmente
3. WHEN não há credor gestor definido, THE Sistema SHALL manter comportamento atual
4. O Sistema SHALL manter a seleção do credor gestor entre sessões
5. WHEN credor gestor é removido, THE Sistema SHALL limpar a pré-seleção

### Requirement 6

**User Story:** Como desenvolvedor do sistema, eu quero que a migração para adicionar a flag gestor seja segura e não afete dados existentes, de forma que o sistema continue funcionando normalmente.

#### Acceptance Criteria

1. O Sistema SHALL adicionar campo "isManager" como booleano opcional na tabela creditors
2. O Sistema SHALL definir valor padrão false para todos os credores existentes
3. O Sistema SHALL criar índice para otimizar consultas por credor gestor
4. O Sistema SHALL manter compatibilidade com código existente durante migração
5. O Sistema SHALL validar integridade dos dados após migração