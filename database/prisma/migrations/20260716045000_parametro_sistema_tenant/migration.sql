-- DropIndex
DROP INDEX "ParametroSistema_clave_key";

-- AlterTable
ALTER TABLE "ParametroSistema" ADD COLUMN "tenantId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "ParametroSistema_tenantId_idx" ON "ParametroSistema"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ParametroSistema_tenantId_clave_key" ON "ParametroSistema"("tenantId", "clave");

-- AddForeignKey
ALTER TABLE "ParametroSistema" ADD CONSTRAINT "ParametroSistema_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
