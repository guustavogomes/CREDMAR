#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Verificando se o projeto está pronto para deploy na Vercel...\n');

const checks = [
  {
    name: 'package.json existe',
    check: () => fs.existsSync('package.json'),
    fix: 'Certifique-se de que o package.json existe'
  },
  {
    name: 'next.config.js configurado',
    check: () => {
      if (!fs.existsSync('next.config.js')) return false;
      const content = fs.readFileSync('next.config.js', 'utf8');
      return !content.includes("output: 'standalone'");
    },
    fix: 'Remove "output: \'standalone\'" do next.config.js'
  },
  {
    name: 'vercel.json existe',
    check: () => fs.existsSync('vercel.json'),
    fix: 'Arquivo vercel.json foi criado'
  },
  {
    name: 'Script de build configurado',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.scripts.build.includes('prisma generate');
    },
    fix: 'Script de build deve incluir "prisma generate"'
  },
  {
    name: 'Prisma schema existe',
    check: () => fs.existsSync('prisma/schema.prisma'),
    fix: 'Certifique-se de que prisma/schema.prisma existe'
  },
  {
    name: 'Middleware otimizado',
    check: () => {
      if (!fs.existsSync('middleware.ts')) return true;
      const content = fs.readFileSync('middleware.ts', 'utf8');
      return !content.includes('new PrismaClient()');
    },
    fix: 'Middleware não deve instanciar PrismaClient diretamente'
  }
];

let allPassed = true;

checks.forEach((check, index) => {
  const passed = check.check();
  const status = passed ? '✅' : '❌';
  console.log(`${index + 1}. ${status} ${check.name}`);
  
  if (!passed) {
    console.log(`   💡 ${check.fix}`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('🎉 Projeto pronto para deploy na Vercel!');
  console.log('\nPróximos passos:');
  console.log('1. Commit e push das alterações');
  console.log('2. Conectar repositório na Vercel');
  console.log('3. Configurar variáveis de ambiente');
  console.log('4. Fazer deploy');
  console.log('\nLeia o arquivo DEPLOY_VERCEL.md para instruções detalhadas.');
} else {
  console.log('⚠️  Corrija os problemas acima antes do deploy.');
}

console.log('\n📋 Variáveis de ambiente necessárias:');
console.log('- DATABASE_URL (já configurada)');
console.log('- NEXTAUTH_SECRET (gerar nova)');
console.log('- NEXTAUTH_URL: https://tapago-blond.vercel.app (temporária)');
console.log('\n🌐 URL temporária: https://tapago-blond.vercel.app
🎯 Domínio futuro: organizaemprestimos.com.br');
console.log('📄 Veja DNS_CONFIG.md para configurações de DNS');