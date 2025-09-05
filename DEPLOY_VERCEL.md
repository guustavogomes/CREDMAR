# Deploy na Vercel - Tapago

## Pré-requisitos

1. Conta na Vercel (https://vercel.com)
2. Repositório Git (GitHub, GitLab ou Bitbucket)
3. Banco PostgreSQL configurado (já temos no Render)

## Passos para Deploy

### 1. Preparar o Repositório

Certifique-se de que todos os arquivos estão commitados:

```bash
git add .
git commit -m "Preparando para deploy na Vercel"
git push origin main
```

### 2. Conectar na Vercel

1. Acesse https://vercel.com e faça login
2. Clique em "New Project"
3. Conecte seu repositório Git
4. Selecione o repositório do Tapago

### 3. Configurar Variáveis de Ambiente

Na página de configuração do projeto na Vercel, adicione as seguintes variáveis de ambiente:

**Obrigatórias:**
- `DATABASE_URL`: `postgresql://tapago_9e3w_user:nfgPLXXxPaktDTy4cFwzTVwNfo5qp1AK@dpg-d2pgjuv5r7bs739mgg3g-a.oregon-postgres.render.com/tapago_9e3w`
- `NEXTAUTH_SECRET`: Gere uma chave secreta (pode usar: https://generate-secret.vercel.app/32)
- `NEXTAUTH_URL`: `https://tapago-blond.vercel.app` (temporária até configurar domínio personalizado)

**Opcionais (para email):**
- `EMAIL_SERVER_HOST`
- `EMAIL_SERVER_PORT`
- `EMAIL_SERVER_USER`
- `EMAIL_SERVER_PASSWORD`
- `EMAIL_FROM`

### 4. Deploy

1. Clique em "Deploy"
2. Aguarde o build completar
3. A Vercel irá automaticamente:
   - Instalar dependências (`npm install`)
   - Gerar o Prisma Client (`prisma generate`)
   - Fazer o build do Next.js (`next build`)

### 5. Configurar Domínio

1. Na dashboard do projeto na Vercel
2. Vá em "Settings" > "Domains"
3. Adicione o domínio: `organizaemprestimos.com.br`
4. Configure os DNS do seu provedor de domínio:
   - Tipo: CNAME
   - Nome: @ (ou deixe vazio)
   - Valor: cname.vercel-dns.com
5. Aguarde a propagação do DNS (pode levar até 48h)

### 6. Executar Migrações do Banco

Após o primeiro deploy, você pode precisar executar as migrações do Prisma:

```bash
# Localmente, com a DATABASE_URL de produção
npx prisma db push
```

Ou use o Prisma Studio para verificar se as tabelas foram criadas corretamente.

## Configurações Importantes

### Build Command
O projeto está configurado para executar automaticamente:
```bash
prisma generate && next build
```

### Variáveis de Ambiente
- As variáveis são configuradas através da interface da Vercel
- O arquivo `.env.production` serve apenas como referência
- NUNCA commite arquivos `.env` com dados sensíveis

### Banco de Dados
- O banco PostgreSQL no Render já está configurado
- A URL de conexão está sendo usada diretamente
- Certifique-se de que o banco permite conexões externas

## Troubleshooting

### Erro de Build
Se o build falhar:
1. Verifique os logs na Vercel
2. Certifique-se de que todas as dependências estão no `package.json`
3. Verifique se o `DATABASE_URL` está correto

### Erro de Conexão com Banco
1. Verifique se a URL do banco está correta
2. Confirme se o banco no Render está ativo
3. Teste a conexão localmente primeiro

### Problemas com Prisma
1. Certifique-se de que `prisma generate` está sendo executado no build
2. Verifique se o schema está correto
3. Execute `npx prisma db push` se necessário

## URLs Importantes

- **Projeto na Vercel**: Será fornecida após o deploy
- **Banco de Dados**: dpg-d2pgjuv5r7bs739mgg3g-a.oregon-postgres.render.com
- **Repositório**: [Seu repositório Git]

## Comandos Úteis

```bash
# Testar build localmente
npm run build

# Gerar Prisma Client
npx prisma generate

# Verificar banco de dados
npx prisma studio

# Deploy manual (se necessário)
vercel --prod
```