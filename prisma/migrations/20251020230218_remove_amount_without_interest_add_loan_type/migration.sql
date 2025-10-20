/*
  Warnings:

  - The values [PENDING_PAYMENT,PENDING_APPROVAL] on the enum `UserStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `advanceAmount` on the `loans` table. All the data in the column will be lost.
  - You are about to drop the `payments` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserStatus_new" AS ENUM ('ACTIVE', 'SUSPENDED');
ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "status" TYPE "UserStatus_new" USING ("status"::text::"UserStatus_new");
ALTER TYPE "UserStatus" RENAME TO "UserStatus_old";
ALTER TYPE "UserStatus_new" RENAME TO "UserStatus";
DROP TYPE "UserStatus_old";
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_userId_fkey";

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "cep" DROP NOT NULL,
ALTER COLUMN "endereco" DROP NOT NULL,
ALTER COLUMN "cidade" DROP NOT NULL,
ALTER COLUMN "estado" DROP NOT NULL,
ALTER COLUMN "bairro" DROP NOT NULL;

-- AlterTable
ALTER TABLE "loans" DROP COLUMN "advanceAmount",
ADD COLUMN     "commission" DOUBLE PRECISION,
ADD COLUMN     "creditorId" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "interestRate" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
ADD COLUMN     "loanType" TEXT NOT NULL DEFAULT 'PRICE',
ADD COLUMN     "observation" TEXT,
ALTER COLUMN "customerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- DropTable
DROP TABLE "payments";

-- DropEnum
DROP TYPE "PaymentMethod";

-- DropEnum
DROP TYPE "PaymentStatus";

-- CreateTable
CREATE TABLE "creditors" (
    "id" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "observacoes" TEXT,
    "userId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creditors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "creditors_cpf_userId_key" ON "creditors"("cpf", "userId");

-- AddForeignKey
ALTER TABLE "creditors" ADD CONSTRAINT "creditors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_creditorId_fkey" FOREIGN KEY ("creditorId") REFERENCES "creditors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
