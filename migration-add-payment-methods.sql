-- Migração para adicionar novos métodos de pagamento
-- Execute este SQL no seu banco de dados PostgreSQL quando quiser

-- 1. Adicionar novos valores ao enum PaymentMethod
ALTER TYPE "PaymentMethod" ADD VALUE 'MANUAL';
ALTER TYPE "PaymentMethod" ADD VALUE 'ADMIN_MANUAL';

-- 2. Verificar se os valores foram adicionados
SELECT unnest(enum_range(NULL::"PaymentMethod")) AS payment_methods;

-- 3. Opcional: Atualizar pagamentos existentes com descrição específica
UPDATE payments 
SET method = 'MANUAL' 
WHERE description LIKE '%APROVACAO MANUAL%' 
  AND method = 'PIX';

UPDATE payments 
SET method = 'ADMIN_MANUAL' 
WHERE description LIKE '%APROVACAO MANUAL POR ADMIN%' 
  AND method = 'PIX';

-- 4. Verificar as mudanças
SELECT method, COUNT(*) as total 
FROM payments 
GROUP BY method 
ORDER BY method;