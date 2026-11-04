import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Argon2PasswordHasher } from '../src/modules/auth/adapters/impl/argon2-password-hasher';

/**
 * Sembrado idempotente: se puede ejecutar varias veces sin duplicar datos ni pisar cambios manuales.
 * El catálogo es de demostración, tomado del mapa de la web; debe validarse con datos oficiales.
 */
const BUILDINGS = [
  { code: 'BLQ-A', name: 'Bloque A', description: 'Rectoría, Vicerrectoría, Admisiones y Registro Académico.' },
  { code: 'BLQ-B', name: 'Bloque B', description: 'Aulas de clases magistrales y dependencias de Ciencias Básicas.' },
  { code: 'BLQ-C', name: 'Bloque C', description: 'Decanatura de Ingeniería de Sistemas, Electrónica y Salas de Cómputo.' },
  { code: 'BLQ-D', name: 'Bloque D', description: 'Decanatura de Ingeniería Civil, Laboratorios de Suelos e Hidráulica.' },
  { code: 'BLQ-E', name: 'Bloque E', description: 'Ingeniería Industrial, Economía, Administración y Cafetería Central.' },
  { code: 'BLQ-F', name: 'Bloque F', description: 'Centro de Innovación y Desarrollo (I+D+i), Robótica y Posgrados.' },
  { code: 'BIB-LLR', name: 'Biblioteca Jorge Álvarez Lleras', description: 'Salas de estudio individual y grupal, hemeroteca y auditorio.' },
];

const SPORTS_FACILITIES = [
  { code: 'COL-OTO', name: 'Coliseo El Otoño', sportTypes: ['Baloncesto', 'Voleibol'] },
  { code: 'CAN-FUT', name: 'Cancha de Fútbol 1', sportTypes: ['Fútbol'] },
];

const FACULTIES = [
  { name: 'Ingeniería de Sistemas', slug: 'ingenieria-de-sistemas' },
  { name: 'Ingeniería Electrónica', slug: 'ingenieria-electronica' },
  { name: 'Ingeniería Civil', slug: 'ingenieria-civil' },
  { name: 'Ingeniería Industrial', slug: 'ingenieria-industrial' },
  { name: 'Economía', slug: 'economia' },
  { name: 'Administración', slug: 'administracion' },
];

const svgElementId = (code: string) => `ECI-${code}`;

export interface SeedAdmin {
  email: string;
  password: string;
}

export async function seedDatabase(prisma: PrismaClient, admin?: SeedAdmin): Promise<void> {
  await prisma.university.upsert({ where: { id: 'ECI' }, update: {}, create: {} });

  for (const building of BUILDINGS) {
    await prisma.building.upsert({
      where: { code: building.code },
      update: {},
      create: { ...building, svgElementId: svgElementId(building.code) },
    });
  }

  for (const facility of SPORTS_FACILITIES) {
    await prisma.sportsFacility.upsert({
      where: { code: facility.code },
      update: {},
      create: { ...facility, svgElementId: svgElementId(facility.code) },
    });
  }

  for (const faculty of FACULTIES) {
    await prisma.faculty.upsert({ where: { slug: faculty.slug }, update: {}, create: faculty });
  }

  if (admin) await seedAdmin(prisma, admin);
}

/** Sin endpoint de roles, este es el único acceso reproducible a la moderación. No cambia una cuenta existente. */
async function seedAdmin(prisma: PrismaClient, admin: SeedAdmin): Promise<void> {
  const email = admin.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) return;

  await prisma.user.create({
    data: {
      email,
      passwordHash: await new Argon2PasswordHasher().hash(admin.password),
      role: 'ADMIN',
      profile: { create: { fullName: 'Administración ECI-MyCampus', isAuthorizedOrganizer: true } },
    },
  });
}

function adminFromEnv(env: NodeJS.ProcessEnv): SeedAdmin | undefined {
  const { SEED_ADMIN_EMAIL: email, SEED_ADMIN_PASSWORD: password } = env;
  if (!email && !password) return undefined;
  if (!email || !password || password.length < 12) {
    throw new Error('[seed] Define SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD (mínimo 12 caracteres), o ninguna de las dos.');
  }
  return { email, password };
}

async function main(): Promise<void> {
  const admin = adminFromEnv(process.env);
  const prisma = new PrismaClient();
  try {
    await seedDatabase(prisma, admin);
    console.log(`[seed] Catálogo listo${admin ? ` y administrador ${admin.email} verificado` : ''}.`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
