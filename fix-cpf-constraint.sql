-- Remover constraint antiga se existir
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_cpf_key;

-- Adicionar nova constraint composta
ALTER TABLE customers ADD CONSTRAINT unique_cpf_per_user UNIQUE (cpf, "userId");

-- Verificar se foi criada
SELECT conname, contype FROM pg_constraint WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = 'customers');