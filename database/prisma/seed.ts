import path from 'node:path';
import { config } from 'dotenv';
import { PrismaClient, RolUsuario, EstadoSanitario } from '@prisma/client';
import bcrypt from 'bcryptjs';

config({ path: path.resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();

const TENANT_NAME = process.env.DEFAULT_TENANT_NAME ?? 'Yerbatera Demo S.A.';
const ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL ?? 'admin@yerbatapp.com';
const ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD ?? 'Admin123!';
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

async function main() {
  console.log(`Sembrando datos demo para "${TENANT_NAME}"...`);

  const tenant = await prisma.tenant.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      nombre: TENANT_NAME,
      razonSocial: TENANT_NAME,
      activo: true,
    },
  });

  await prisma.empresaConfig.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: { tenantId: tenant.id, razonSocial: TENANT_NAME, ivaGeneral: 21 },
  });

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      tenantId: tenant.id,
      nombre: 'Administrador',
      email: ADMIN_EMAIL,
      passwordHash,
      rol: RolUsuario.ADMIN,
    },
  });

  const supervisorHash = await bcrypt.hash('Supervisor123!', SALT_ROUNDS);
  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@yerbatapp.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      nombre: 'Supervisor de Campo',
      email: 'supervisor@yerbatapp.com',
      passwordHash: supervisorHash,
      rol: RolUsuario.SUPERVISOR,
    },
  });

  const campoNombres = [
    { nombre: 'Campo 1', ubicacion: 'Oberá, Misiones', superficieHa: 85.5 },
    { nombre: 'Campo 2', ubicacion: 'Apóstoles, Misiones', superficieHa: 62.3 },
    { nombre: 'Campo 3', ubicacion: 'Leandro N. Alem, Misiones', superficieHa: 110.0 },
  ];

  for (const [index, campoData] of campoNombres.entries()) {
    const campo = await prisma.campo.upsert({
      where: { id: `00000000-0000-0000-0000-00000000010${index + 1}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0000-00000000010${index + 1}`,
        tenantId: tenant.id,
        nombre: campoData.nombre,
        ubicacion: campoData.ubicacion,
        superficieHa: campoData.superficieHa,
        responsableId: index === 0 ? supervisor.id : admin.id,
        observaciones: 'Campo sembrado automáticamente por seed.ts',
      },
    });

    await prisma.cultivo.upsert({
      where: { id: `00000000-0000-0000-0000-00000000020${index + 1}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0000-00000000020${index + 1}`,
        campoId: campo.id,
        nombre: 'Yerba Mate',
        variedad: 'Común',
        fechaPlantacion: new Date('2015-06-01'),
        cantidadPlantas: 4000 + index * 500,
        estadoSanitario: EstadoSanitario.BUENO,
        produccionEsperadaKg: 12000 + index * 1000,
      },
    });

    await prisma.campoNota.create({
      data: {
        campoId: campo.id,
        usuarioId: admin.id,
        titulo: 'Alta inicial del campo',
        descripcion: 'Campo cargado en el sistema con datos de referencia.',
      },
    });
  }

  console.log('Seed completado.');
  console.log(`Login admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
