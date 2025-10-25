/**
 * Debug do cálculo de saldo devedor
 */

// Simular o caso real: totalAmount = 1350, deve resultar em principal ≈ 1000
const loanData = {
  id: 'test-loan',
  loanType: 'SAC', // ou outro tipo que não seja SIMPLE_INTEREST
  totalAmount: 1350, // Valor total com juros
  installments: 5,
  interestRate: 35, // 35% total
  commission: 5, // 5% para intermediador
  creditorCommission: 10, // 10% para credor
  periodicityId: 'monthly'
}

console.log('🔍 DEBUG: Cálculo de Saldo Devedor')
console.log('=' .repeat(50))
console.log(`Total Amount (com juros): R$ ${loanData.totalAmount}`)
console.log(`Taxa de juros: ${loanData.interestRate}%`)

// Simular busca binária para encontrar o principal
let minPrincipal = loanData.totalAmount * 0.5
let maxPrincipal = loanData.totalAmount
let bestPrincipal = loanData.totalAmount

console.log('\n🔄 Busca binária pelo valor principal:')

for (let i = 0; i < 10; i++) {
  const testPrincipal = (minPrincipal + maxPrincipal) / 2
  
  // Simular que o total seria testPrincipal * (1 + taxa/100)
  // Para SAC é mais complexo, mas vamos usar uma aproximação
  const estimatedTotal = testPrincipal * (1 + (loanData.interestRate / 100))
  
  const diff = estimatedTotal - loanData.totalAmount
  
  console.log(`  Iteração ${i + 1}: Principal=${testPrincipal.toFixed(2)} -> Total=${estimatedTotal.toFixed(2)} (diff: ${diff.toFixed(2)})`)
  
  if (Math.abs(diff) < 0.01) {
    bestPrincipal = testPrincipal
    console.log(`  ✅ Encontrado! Principal = R$ ${bestPrincipal.toFixed(2)}`)
    break
  }
  
  if (diff > 0) {
    maxPrincipal = testPrincipal
  } else {
    minPrincipal = testPrincipal
  }
  
  bestPrincipal = testPrincipal
}

console.log(`\n💰 Valor principal calculado: R$ ${bestPrincipal.toFixed(2)}`)

// Simular saldo devedor para cada parcela
console.log('\n📊 Simulação de Saldo Devedor:')

// Para SAC, a amortização é constante
const amortizacaoConstante = bestPrincipal / loanData.installments

for (let parcela = 1; parcela <= loanData.installments; parcela++) {
  const amortizacaoAcumulada = (parcela - 1) * amortizacaoConstante
  const saldoDevedor = bestPrincipal - amortizacaoAcumulada
  
  console.log(`  Parcela ${parcela}: Saldo Devedor = R$ ${saldoDevedor.toFixed(2)}`)
  
  if (parcela === 1) {
    console.log(`    ✅ Base para comissão: R$ ${bestPrincipal.toFixed(2)} (valor emprestado)`)
  } else {
    console.log(`    ✅ Base para comissão: R$ ${saldoDevedor.toFixed(2)} (saldo devedor)`)
  }
}

console.log('\n🎯 RESULTADO ESPERADO:')
console.log('- Parcela 1: Comissão sobre R$ 1.000 (valor emprestado)')
console.log('- Parcela 2: Comissão sobre R$ 800 (saldo devedor)')
console.log('- Parcela 3: Comissão sobre R$ 600 (saldo devedor)')
console.log('- E assim por diante...')