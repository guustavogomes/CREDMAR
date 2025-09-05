#!/usr/bin/env node

/**
 * Script para executar migração segura do banco de dados
 * Adiciona apenas as colunas do Asaas sem afetar dados existentes
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

async function executarMigracaoSegura() {
  console.log('🔒 Executando migração segura do banco de dados...\n')

  // Verificar se existe arquivo .env.production
  const envFile = path.join(__dirname, '.env.production')
  if (!fs.existsSync(envFile)) {
    console.log('❌ Arquivo .env.production não encontrado!')
    console.log('Execute primeiro: vercel env pull .env.production')
    process.exit(1)
  }

  // Carregar variáveis de ambiente
  require('dotenv').config({ path: envFile })

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.log('❌ DATABASE_URL não encontrada no .env.production')
    process.exit(1)
  }

  console.log('📋 Configurações:')
  console.log(`- Database URL: ${databaseUrl.substring(0, 20)}...`)
  console.log('')

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    await client.connect()
    console.log('✅ Conectado ao banco de dados')

    // Ler o arquivo de migração
    const migrationSQL = fs.readFileSync(path.join(__dirname, 'migration-asaas-safe.sql'), 'utf8')
    
    console.log('🔍 Verificando colunas existentes...')
    
    // Verificar colunas existentes
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      AND column_name LIKE 'asaas%'
      ORDER BY column_name;
    `
    
    const existingColumns = await client.query(checkQuery)
    console.log(`Colunas do Asaas existentes: ${existingColumns.rows.length}`)
    
    if (existingColumns.rows.length > 0) {
      console.log('Colunas encontradas:')
      existingColumns.rows.forEach(row => {
        console.log(`  - ${row.column_name}`)
      })
    }

    console.log('\n🚀 Executando migração...')
    
    // Executar a migração
    await client.query(migrationSQL)
    
    console.log('✅ Migração executada com sucesso!')
    
    // Verificar novamente as colunas
    console.log('\n🔍 Verificando colunas após migração...')
    const newColumns = await client.query(checkQuery)
    console.log(`Colunas do Asaas após migração: ${newColumns.rows.length}`)
    
    if (newColumns.rows.length > 0) {
      console.log('Colunas encontradas:')
      newColumns.rows.forEach(row => {
        console.log(`  - ${row.column_name}`)
      })
    }

    // Verificar se a tabela payments tem dados
    const countQuery = 'SELECT COUNT(*) as total FROM payments;'
    const countResult = await client.query(countQuery)
    console.log(`\n📊 Total de pagamentos na tabela: ${countResult.rows[0].total}`)

    console.log('\n🎉 Migração concluída com sucesso!')
    console.log('✅ Dados existentes preservados')
    console.log('✅ Colunas do Asaas adicionadas')

  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message)
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n🔌 Conexão com banco de dados encerrada')
  }
}

// Executar a migração
executarMigracaoSegura()
