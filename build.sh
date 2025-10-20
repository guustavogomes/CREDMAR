#!/bin/bash
set -e

echo "🔧 Iniciando build do CREDMAR..."

# Instalar dependências
echo "📦 Instalando dependências..."
yarn install

# Gerar Prisma Client
echo "🗄️ Gerando Prisma Client..."
yarn prisma generate

# Build do Next.js
echo "🏗️ Executando build do Next.js..."
yarn build

echo "✅ Build concluído com sucesso!"