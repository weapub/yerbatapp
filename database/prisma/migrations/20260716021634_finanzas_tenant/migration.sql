/*
  Warnings:

  - Added the required column `tenantId` to the `CategoriaFinanciera` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `CentroCosto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CategoriaFinanciera" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CentroCosto" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "CategoriaFinanciera_tenantId_idx" ON "CategoriaFinanciera"("tenantId");

-- CreateIndex
CREATE INDEX "CentroCosto_tenantId_idx" ON "CentroCosto"("tenantId");

-- AddForeignKey
ALTER TABLE "CategoriaFinanciera" ADD CONSTRAINT "CategoriaFinanciera_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CentroCosto" ADD CONSTRAINT "CentroCosto_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
