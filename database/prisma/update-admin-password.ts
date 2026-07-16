// Resetea la contraseña de un usuario sin depender del envío de mail (no hay
// SMTP configurado por defecto). Uso:
//   TARGET_ADMIN_EMAIL=x@y.com TARGET_ADMIN_PASSWORD=NuevaClave123 npx tsx database/prisma/update-admin-password.ts
import path from 'node:path';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

config({ path: path.resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();

async function main() {
  const email = process.env.TARGET_ADMIN_EMAIL ?? 'admin@yerbatapp.com';
  const newPassword = process.env.TARGET_ADMIN_PASSWORD ?? 'Admin1234';
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

  const passwordHash = await bcrypt.hash(newPassword, saltRounds);
  const user = await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });
  console.log(`Contraseña actualizada para ${user.email} (rol ${user.rol}).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
