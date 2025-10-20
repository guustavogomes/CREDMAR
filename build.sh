#!/bin/bash
set -e

echo "🔧 Iniciando build do CREDMAR..."

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Gerar Prisma Client
echo "🗄️ Gerando Prisma Client..."
npm run db:generate

# Build do Next.js
echo "🏗️ Executando build do Next.js..."
npm run build

echo "✅ Build concluído com sucesso!"