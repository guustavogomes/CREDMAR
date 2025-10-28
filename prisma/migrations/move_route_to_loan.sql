-- Migration: Move routeId from Customer to Loan
-- Step 1: Add routeId to loans table
ALTER TABLE "loans" ADD COLUMN "routeId" TEXT;

-- Step 2: Add foreign key constraint
ALTER TABLE "loans" ADD CONSTRAINT "loans_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 3: Migrate existing data (copy routeId from customer to their loans)
UPDATE "loans" 
SET "routeId" = "customers"."routeId"
FROM "customers" 
WHERE "loans"."customerId" = "customers"."id" 
AND "customers"."routeId" IS NOT NULL;

-- Step 4: Remove foreign key constraint from customers
ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "customers_routeId_fkey";

-- Step 5: Remove routeId column from customers
ALTER TABLE "customers" DROP COLUMN IF EXISTS "routeId";