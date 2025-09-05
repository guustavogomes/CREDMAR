// Script para testar performance do cache implementado
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testCachePerformance() {
  console.log('🧪 Testando Performance do Cache...\n');

  // Teste 1: API de CEP (cache longo)
  console.log('📍 Testando API de CEP...');
  const cepTests = [
    { cep: '01310-100', name: 'Av. Paulista' },
    { cep: '20040-020', name: 'Centro RJ' },
    { cep: '40070-110', name: 'Centro Salvador' }
  ];

  for (const test of cepTests) {
    console.log(`\n  🔍 Testando CEP: ${test.cep} (${test.name})`);
    
    // Primeira requisição (MISS)
    const start1 = Date.now();
    const response1 = await fetch(`${BASE_URL}/api/cep/${test.cep.replace('-', '')}`);
    const time1 = Date.now() - start1;
    const cache1 = response1.headers.get('X-Cache');
    
    // Segunda requisição (HIT)
    const start2 = Date.now();
    const response2 = await fetch(`${BASE_URL}/api/cep/${test.cep.replace('-', '')}`);
    const time2 = Date.now() - start2;
    const cache2 = response2.headers.get('X-Cache');
    
    console.log(`    ⏱️  Primeira requisição: ${time1}ms (${cache1})`);
    console.log(`    ⏱️  Segunda requisição: ${time2}ms (${cache2})`);
    console.log(`    🚀 Melhoria: ${Math.round((time1 - time2) / time1 * 100)}% mais rápido`);
  }

  // Teste 2: API de Periodicidades (cache médio)
  console.log('\n📅 Testando API de Periodicidades...');
  
  const start1 = Date.now();
  const response1 = await fetch(`${BASE_URL}/api/periodicities`);
  const time1 = Date.now() - start1;
  const cache1 = response1.headers.get('X-Cache');
  
  const start2 = Date.now();
  const response2 = await fetch(`${BASE_URL}/api/periodicities`);
  const time2 = Date.now() - start2;
  const cache2 = response2.headers.get('X-Cache');
  
  console.log(`  ⏱️  Primeira requisição: ${time1}ms (${cache1})`);
  console.log(`  ⏱️  Segunda requisição: ${time2}ms (${cache2})`);
  console.log(`  🚀 Melhoria: ${Math.round((time1 - time2) / time1 * 100)}% mais rápido`);

  // Teste 3: Headers de Cache
  console.log('\n📋 Verificando Headers de Cache...');
  
  const cepResponse = await fetch(`${BASE_URL}/api/cep/01310100`);
  const periodicitiesResponse = await fetch(`${BASE_URL}/api/periodicities`);
  
  console.log('  📍 CEP Cache-Control:', cepResponse.headers.get('Cache-Control'));
  console.log('  📅 Periodicidades Cache-Control:', periodicitiesResponse.headers.get('Cache-Control'));

  console.log('\n✅ Teste de Performance Concluído!');
  console.log('\n📊 Resumo das Melhorias:');
  console.log('  • CEP: Cache de 24 horas com stale-while-revalidate de 1 semana');
  console.log('  • Periodicidades: Cache de 1 hora com stale-while-revalidate de 1 dia');
  console.log('  • Estatísticas: Cache de 15 minutos com stale-while-revalidate de 1 hora');
  console.log('  • Admin Stats: Cache de 10 minutos com stale-while-revalidate de 30 minutos');
}

// Executar teste
testCachePerformance().catch(console.error);
