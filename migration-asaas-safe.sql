-- Migração segura para adicionar campos do Asaas
-- Esta migração apenas adiciona colunas sem afetar dados existentes

-- Adicionar colunas do Asaas na tabela payments (apenas se não existirem)
DO $$ 
BEGIN
    -- Verificar e adicionar asaasPaymentId
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'asaasPaymentId') THEN
        ALTER TABLE payments ADD COLUMN "asaasPaymentId" TEXT;
    END IF;

    -- Verificar e adicionar asaasCustomerId
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'asaasCustomerId') THEN
        ALTER TABLE payments ADD COLUMN "asaasCustomerId" TEXT;
    END IF;

    -- Verificar e adicionar asaasExternalReference
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'asaasExternalReference') THEN
        ALTER TABLE payments ADD COLUMN "asaasExternalReference" TEXT;
    END IF;

    -- Verificar e adicionar asaasPixQrCode
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'asaasPixQrCode') THEN
        ALTER TABLE payments ADD COLUMN "asaasPixQrCode" TEXT;
    END IF;

    -- Verificar e adicionar asaasPixPayload
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'asaasPixPayload') THEN
        ALTER TABLE payments ADD COLUMN "asaasPixPayload" TEXT;
    END IF;

    -- Verificar e adicionar asaasDueDate
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'asaasDueDate') THEN
        ALTER TABLE payments ADD COLUMN "asaasDueDate" TIMESTAMP(3);
    END IF;

    -- Verificar e adicionar asaasNetValue
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'asaasNetValue') THEN
        ALTER TABLE payments ADD COLUMN "asaasNetValue" DOUBLE PRECISION;
    END IF;

    -- Verificar e adicionar asaasOriginalValue
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'asaasOriginalValue') THEN
        ALTER TABLE payments ADD COLUMN "asaasOriginalValue" DOUBLE PRECISION;
    END IF;

    -- Verificar e adicionar asaasInterestValue
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'asaasInterestValue') THEN
        ALTER TABLE payments ADD COLUMN "asaasInterestValue" DOUBLE PRECISION;
    END IF;

END $$;

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND column_name LIKE 'asaas%'
ORDER BY column_name;
