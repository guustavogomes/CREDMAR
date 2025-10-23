-- CreateEnum
CREATE TYPE "CashFlowType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "CashFlowCategory" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'COMMISSION', 'LOAN_DISBURSEMENT');

-- CreateTable
CREATE TABLE "CashFlow" (
    "id" TEXT NOT NULL,
    "creditorId" TEXT NOT NULL,
    "type" "CashFlowType" NOT NULL,
    "category" "CashFlowCategory" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "loanId" TEXT,
    "installmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CashFlow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CashFlow_creditorId_idx" ON "CashFlow"("creditorId");

-- CreateIndex
CREATE INDEX "CashFlow_type_idx" ON "CashFlow"("type");

-- CreateIndex
CREATE INDEX "CashFlow_category_idx" ON "CashFlow"("category");

-- CreateIndex
CREATE INDEX "CashFlow_createdAt_idx" ON "CashFlow"("createdAt");

-- AddForeignKey
ALTER TABLE "CashFlow" ADD CONSTRAINT "CashFlow_creditorId_fkey" FOREIGN KEY ("creditorId") REFERENCES "Creditor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashFlow" ADD CONSTRAINT "CashFlow_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashFlow" ADD CONSTRAINT "CashFlow_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "Installment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashFlow" ADD CONSTRAINT "CashFlow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;