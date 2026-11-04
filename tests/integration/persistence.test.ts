import { PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app';
import type { AppConfig } from '../../src/config/env';
import { buildContainer } from '../../src/container';

/**
 * Pruebas contra PostgreSQL real, con las migraciones ya aplicadas.
 * Se omiten sin TEST_DATABASE_URL. Borran datos, así que exigen una base cuyo nombre contenga "test".
 */
const databaseUrl = process.env.TEST_DATABASE_URL;

if (databaseUrl && !new URL(databaseUrl).pathname.includes('test')) {
  throw new Error('TEST_DATABASE_URL debe apuntar a una base cuyo nombre contenga "test".');
}

const config: AppConfig = {
  nodeEnv: 'test',
  port: 0,
  databaseUrl: databaseUrl ?? '',
  jwtSecret: 'test_secret_with_more_than_16_chars',
  corsOrigin: false,
  emailFrom: 'test@ecimycampus.dev',
};

describe.skipIf(!databaseUrl)('Persistencia con PostgreSQL real', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;

  const tokenFor = (id: string, role: 'ESTUDIANTE' | 'MODERADOR' = 'ESTUDIANTE') =>
    `Bearer ${app.jwt.sign({ id, role, email: `${id}@mail.escuelaing.edu.co`, fullName: id })}`;

  const createPublishedEvent = async (maxCapacity: number): Promise<string> => {
    const start = new Date(Date.now() + 3_600_000);
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/events',
      headers: { authorization: tokenFor('organizer') },
      payload: {
        title: 'Taller de Docker',
        description: 'Introducción práctica a contenedores',
        category: 'ACADEMICO',
        buildingId: 'BLQ-B',
        specificLocation: 'Sala B-201',
        startTime: start.toISOString(),
        endTime: new Date(start.getTime() + 3_600_000).toISOString(),
        requiresRegistration: true,
        maxCapacity,
      },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json().status).toBe('PENDIENTE_APROBACION');

    const id: string = created.json().id;
    const approved = await app.inject({
      method: 'PATCH',
      url: `/api/v1/events/${id}/approve`,
      headers: { authorization: tokenFor('moderator', 'MODERADOR') },
    });
    expect(approved.statusCode).toBe(200);
    return id;
  };

  const register = (eventId: string, userId: string) =>
    app.inject({
      method: 'POST',
      url: `/api/v1/events/${eventId}/register`,
      headers: { authorization: tokenFor(userId) },
    });

  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: databaseUrl });
    app = await buildApp(config, (logger) => buildContainer(config, logger));
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(`
      TRUNCATE auth_schema.users, auth_schema.audit_logs,
               campus_schema.universities, campus_schema.faculties, campus_schema.sports_facilities,
               events_schema.events CASCADE
    `);
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it('registra, inicia sesión, guarda auditoría y normaliza el correo', async () => {
    const password = 'Password123';
    const registered = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'Ana.Perez@mail.escuelaing.edu.co',
        password,
        fullName: 'Ana Pérez',
        habeasDataAccepted: true,
      },
    });
    expect(registered.statusCode).toBe(201);

    const duplicate = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'ana.perez@mail.escuelaing.edu.co',
        password,
        fullName: 'Ana Pérez',
        habeasDataAccepted: true,
      },
    });
    expect(duplicate.statusCode).toBe(409);

    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'ana.perez@mail.escuelaing.edu.co', password },
    });
    expect(login.statusCode).toBe(200);

    const me = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: `Bearer ${login.json().token}` },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().fullName).toBe('Ana Pérez');

    const stored = await prisma.user.findUniqueOrThrow({ where: { email: 'ana.perez@mail.escuelaing.edu.co' } });
    expect(stored.passwordHash.startsWith('$argon2id$')).toBe(true);
    const actions = await prisma.auditLog.findMany({ where: { actorId: stored.id }, select: { action: true } });
    expect(actions.map((a) => a.action).sort()).toEqual(['USER_LOGIN', 'USER_REGISTERED']);
  });

  it('conserva la auditoría al borrar a su actor', async () => {
    const user = await prisma.user.create({ data: { email: 'x@mail.escuelaing.edu.co', passwordHash: 'h' } });
    const log = await prisma.auditLog.create({
      data: { actorId: user.id, action: 'A', targetEntity: 'User', targetId: user.id, ipAddress: 'test' },
    });

    await prisma.user.delete({ where: { id: user.id } });

    const kept = await prisma.auditLog.findUniqueOrThrow({ where: { id: log.id } });
    expect(kept.actorId).toBeNull();
  });

  it('lee el catálogo del campus con sus relaciones', async () => {
    await prisma.university.create({ data: {} });
    await prisma.building.create({
      data: {
        code: 'BLQ-A',
        name: 'Bloque A',
        svgElementId: 'ECI-BLQ-A',
        places: { create: { name: 'A-101', floor: '1' } },
        services: { create: { name: 'Café', serviceType: 'CAFETERIA' } },
      },
    });
    await prisma.faculty.create({ data: { name: 'Sistemas', slug: 'sistemas' } });

    const buildings = await app.inject({ method: 'GET', url: '/api/v1/campus/buildings' });
    const byCode = await app.inject({ method: 'GET', url: '/api/v1/campus/buildings/BLQ-A' });
    const faculties = await app.inject({ method: 'GET', url: '/api/v1/campus/faculties' });
    const missing = await app.inject({ method: 'GET', url: '/api/v1/campus/buildings/NO-EXISTE' });

    expect(buildings.statusCode).toBe(200);
    expect(buildings.json()).toHaveLength(1);
    expect(byCode.json().code).toBe('BLQ-A');
    expect(faculties.json()[0].slug).toBe('sistemas');
    expect(missing.statusCode).toBe(404);
  });

  it('nunca sobrevende cupos bajo inscripciones concurrentes', async () => {
    const eventId = await createPublishedEvent(5);

    const responses = await Promise.all(Array.from({ length: 20 }, (_, i) => register(eventId, `user-${i}`)));

    const codes = responses.map((r) => r.statusCode);
    expect(codes.filter((c) => c === 201)).toHaveLength(5);
    expect(codes.filter((c) => c === 409)).toHaveLength(15);

    const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });
    expect(event.availableCapacity).toBe(0);
    expect(await prisma.eventRegistration.count({ where: { eventId, status: 'CONFIRMADA' } })).toBe(5);
  });

  it('una inscripción duplicada concurrente devuelve el cupo', async () => {
    const eventId = await createPublishedEvent(5);

    const responses = await Promise.all(Array.from({ length: 5 }, () => register(eventId, 'same-user')));

    expect(responses.filter((r) => r.statusCode === 201)).toHaveLength(1);
    expect(responses.filter((r) => r.statusCode === 409)).toHaveLength(4);
    const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });
    expect(event.availableCapacity).toBe(4);
  });

  it('el radar público solo muestra eventos publicados', async () => {
    const published = await createPublishedEvent(5);
    await prisma.event.create({
      data: {
        title: 'Pendiente',
        description: 'No visible',
        category: 'CULTURAL',
        organizerId: 'o',
        organizerName: 'O',
        buildingId: 'BLQ-C',
        specificLocation: 'Plazoleta',
        startTime: new Date(Date.now() + 3_600_000),
        endTime: new Date(Date.now() + 7_200_000),
        originalEndTime: new Date(Date.now() + 7_200_000),
      },
    });

    const radar = await app.inject({ method: 'GET', url: '/api/v1/events/radar' });

    expect(radar.statusCode).toBe(200);
    expect(radar.json().map((entry: { id: string }) => entry.id)).toEqual([published]);
  });
});
