/*
  Warnings:

  - Added the required column `tenantId` to the `Campania` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Campania" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Campania_tenantId_idx" ON "Campania"("tenantId");

-- AddForeignKey
ALTER TABLE "Campania" ADD CONSTRAINT "Campania_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
