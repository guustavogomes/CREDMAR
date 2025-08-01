# TaPago - Sistema de Gestão de Empréstimos

Sistema completo para gestão de empréstimos e cobrança com interface administrativa.

## 🚀 Funcionalidades

- **Dashboard Administrativo**: Painel completo para administradores
- **Gestão de Usuários**: Controle de usuários e permissões
- **Sistema de Pagamentos**: Gestão de mensalidades e pagamentos
- **Configurações**: Troca de tema e alteração de senhas
- **Autenticação**: Sistema seguro com NextAuth.js
- **Banco de Dados**: PostgreSQL com Prisma ORM

## 🛠️ Tecnologias

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Banco de Dados**: PostgreSQL
- **Autenticação**: NextAuth.js
- **Containerização**: Docker & Docker Compose

## 📋 Pré-requisitos

- Docker e Docker Compose
- Git

## 🚀 Instalação e Execução

### 1. Clone o repositório
```bash
git clone https://github.com/guustavogomes/Tapago.git
cd Tapago
```

### 2. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

### 3. Execute com Docker
```bash
# Subir os containers
docker-compose up --build -d

# Verificar se os containers estão rodando
docker-compose ps
```

### 4. Execute o seed do banco de dados
```bash
# Executar seed no container
docker-compose exec app npx tsx prisma/seed.ts
```

### 5. Acesse a aplicação

- **Aplicação**: http://localhost:3001
- **Login Admin**: 
  - Email: `admin@tapago.com`
  - Senha: `admin123`

## 📁 Estrutura do Projeto

```
├── src/
│   ├── app/                    # App Router do Next.js
│   │   ├── (admin)/           # Área administrativa
│   │   ├── (auth)/            # Páginas de autenticação
│   │   ├── (dashboard)/       # Dashboard do usuário
│   │   └── api/               # API Routes
│   ├── components/            # Componentes React
│   ├── lib/                   # Utilitários e configurações
│   └── types/                 # Tipos TypeScript
├── prisma/                    # Schema e migrations do Prisma
├── docker-compose.yml         # Configuração do Docker
├── Dockerfile                 # Imagem Docker da aplicação
└── README.md
```

## 🐳 Comandos Docker Úteis

```bash
# Ver logs da aplicação
docker-compose logs app

# Ver logs do PostgreSQL
docker-compose logs postgres

# Parar os containers
docker-compose down

# Reconstruir e subir
docker-compose up --build -d

# Executar comandos no container da aplicação
docker-compose exec app [comando]
```

## 🔧 Desenvolvimento

Para desenvolvimento local sem Docker:

```bash
# Instalar dependências
npm install

# Configurar banco de dados
npx prisma db push

# Executar seed
npm run db:seed

# Iniciar em modo desenvolvimento
npm run dev
```

## 📝 Funcionalidades Principais

### Área Administrativa (`/admin`)
- Dashboard com estatísticas
- Gestão de usuários
- Controle de pagamentos
- Configuração de periodicidades
- Configurações do sistema

### Dashboard do Usuário (`/dashboard`)
- Visão geral dos dados
- Gestão de clientes
- Controle de empréstimos
- Histórico de pagamentos
- Configurações pessoais

## 🔐 Autenticação

O sistema utiliza NextAuth.js com:
- Login por email/senha
- Controle de sessões
- Proteção de rotas
- Diferentes níveis de acesso (USER/ADMIN)

## 💾 Banco de Dados

Estrutura principal:
- **Users**: Usuários do sistema
- **Customers**: Clientes dos usuários
- **Loans**: Empréstimos
- **Payments**: Pagamentos/mensalidades
- **Periodicities**: Configurações de periodicidade

## 🚀 Deploy em VPS

1. Clone o repositório na VPS
2. Configure as variáveis de ambiente
3. Execute `docker-compose up --build -d`
4. Execute o seed do banco
5. Configure proxy reverso (Nginx) se necessário

## 📄 Licença

Este projeto está sob a licença MIT.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

Para suporte, entre em contato através do GitHub Issues.