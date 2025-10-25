# Exemplo de Cálculo de Comissões Corrigido

## Cenário do Empréstimo
- **Valor**: R$ 1.000,00
- **Taxa de Juros**: 35% ao mês
- **Comissão Intermediário**: 5%
- **Comissão Credor**: 8%
- **Comissão Gestor**: 22% (35% - 5% - 8%)

## Para Juros Simples
**Lógica**: Comissões baseadas na taxa de juros sobre o valor da parcela

Se parcela = R$ 200,00:
- Intermediário: R$ 10,00 (5% da parcela)
- Credor: R$ 16,00 (8% da parcela)
- Gestor: R$ 44,00 (22% da parcela)
- **Retorno**: R$ 200,00 - R$ 10,00 - R$ 16,00 - R$ 44,00 = **R$ 130,00**

## Para Outros Tipos (PRICE, SAC, etc.)
**Lógica**: Comissões baseadas na taxa de juros sobre valor do empréstimo na 1ª parcela, depois sobre amortização

### Primeira Parcela
Se parcela = R$ 200,00:
- **Base de cálculo**: R$ 1.000,00 (valor do empréstimo)
- Intermediário: R$ 50,00 (5% de R$ 1.000)
- Credor: R$ 80,00 (8% de R$ 1.000)
- Gestor: R$ 220,00 (22% de R$ 1.000)
- **Retorno**: R$ 200,00 - R$ 50,00 - R$ 80,00 - R$ 220,00 = **-R$ 150,00**

### Demais Parcelas
Se parcela = R$ 200,00 e amortização = R$ 150,00:
- **Base de cálculo**: R$ 150,00 (amortização)
- Intermediário: R$ 7,50 (5% de R$ 150)
- Credor: R$ 12,00 (8% de R$ 150)
- Gestor: R$ 33,00 (22% de R$ 150)
- **Retorno**: R$ 200,00 - R$ 7,50 - R$ 12,00 - R$ 33,00 = **R$ 147,50**

## Observação Importante
- **Não há mais lógica de 50%** - tudo é baseado na taxa de juros do empréstimo
- As comissões são rateadas proporcionalmente dentro da taxa de juros total
- Na primeira parcela de empréstimos PRICE/SAC, o retorno pode ser negativo se as comissões excedem o valor da parcela