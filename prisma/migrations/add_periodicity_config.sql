-- AlterTable
ALTER TABLE "periodicities" ADD COLUMN "intervalType" TEXT NOT NULL DEFAULT 'MONTHLY';
ALTER TABLE "periodicities" ADD COLUMN "intervalValue" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "periodicities" ADD COLUMN "allowedWeekdays" TEXT;
ALTER TABLE "periodicities" ADD COLUMN "allowedMonthDays" TEXT;
ALTER TABLE "periodicities" ADD COLUMN "allowedMonths" TEXT;