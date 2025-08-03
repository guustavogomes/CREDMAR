# Estágio de dependências
FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Instalar dependências
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# Estágio de build
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .

# Gerar o cliente Prisma antes do build
RUN npx prisma generate

# Build da aplicação
RUN npm run build

# Imagem de produção
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar dependências de produção
COPY --from=deps /app/node_modules ./node_modules

# Copiar arquivos necessários do build
COPY --from=builder /app/public ./public

# Copiar o build standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar cliente Prisma e schema
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copiar package.json para ter acesso aos scripts
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Usar o comando start do Next.js em vez de tentar executar server.js diretamente
CMD ["npm", "start"]