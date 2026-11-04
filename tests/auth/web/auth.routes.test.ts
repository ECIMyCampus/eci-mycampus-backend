import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../../src/app';
import { authHttpModule } from '../../../src/modules/auth/module';
import type { AppConfig } from '../../../src/config/env';
import { AuthMapper } from '../../../src/modules/auth/mappers/auth.mapper';
import { AuthServiceImpl } from '../../../src/modules/auth/services/impl/auth.service.impl';
import { AuthValidatorImpl } from '../../../src/modules/auth/validators/impl/auth.validator.impl';
import { buildUser, InMemoryUserRepository, MockPasswordHasher } from '../support/fixtures';

const config: AppConfig = {
  nodeEnv: 'test',
  port: 0,
  databaseUrl: 'postgresql://unused',
  jwtSecret: 'test_jwt_secret_with_sufficient_length_123',
  corsOrigin: true,
  emailFrom: 'test@ecimycampus.dev',
};

const validRegisterBody = {
  email: 'carlos.gomez@mail.escuelaing.edu.co',
  password: 'Password123',
  fullName: 'Carlos Gómez',
  academicProgram: 'Ingeniería Civil',
  interests: ['Estructuras'],
  habeasDataAccepted: true,
};

describe('Auth API (Endpoints, Guards y Manejo de Errores)', () => {
  let app: FastifyInstance;
  let repository: InMemoryUserRepository;
  let hasher: MockPasswordHasher;

  beforeEach(async () => {
    repository = new InMemoryUserRepository();
    hasher = new MockPasswordHasher();
    const validator = new AuthValidatorImpl(repository);
    const service = new AuthServiceImpl(repository, validator, hasher);
    const mapper = new AuthMapper();

    app = await buildApp(config, () => ({
      modules: [authHttpModule({ authService: service, authMapper: mapper, passwordHasher: hasher })],
      dispose: async () => {},
    }));
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health responde 200 con status ok', async () => {
    // Act
    const res = await app.inject({ method: 'GET', url: '/health' });

    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok', service: 'eci-mycampus-backend' });
  });

  describe('POST /api/v1/auth/register', () => {
    it('registra un usuario válido y retorna 201', async () => {
      // Act
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: validRegisterBody,
      });

      // Assert
      expect(res.statusCode).toBe(201);
      expect(res.json().message).toContain('registrado exitosamente');
      expect(res.json().user).toMatchObject({
        email: validRegisterBody.email,
        fullName: validRegisterBody.fullName,
        role: 'ESTUDIANTE',
      });
    });

    it('responde 400 si el correo no pertenece al dominio institucional', async () => {
      // Act
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { ...validRegisterBody, email: 'externo@gmail.com' },
      });

      // Assert
      expect(res.statusCode).toBe(400);
      expect(res.json().status).toBe(400);
      expect(res.json().detalles[0].mensaje).toContain('correo institucional válido');
    });

    it('responde 400 si la contraseña no cumple la política de seguridad', async () => {
      // Act
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { ...validRegisterBody, password: 'debil' },
      });

      // Assert
      expect(res.statusCode).toBe(400);
      expect(res.json().status).toBe(400);
    });

    it('responde 409 si el correo ya existe', async () => {
      // Arrange
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: validRegisterBody,
      });

      // Act
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: validRegisterBody,
      });

      // Assert
      expect(res.statusCode).toBe(409);
      expect(res.json().error).toBe('Conflict');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('autentica credenciales válidas y retorna JWT de 7 días', async () => {
      // Arrange
      const user = buildUser({ passwordHash: 'hashed_Password123' });
      repository.users.set(user.id!, user);

      // Act
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: user.email,
          password: 'Password123',
        },
      });

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.json().token).toBeDefined();
      expect(res.json().user.fullName).toBe(user.fullName);
    });

    it('responde 401 si las credenciales son incorrectas', async () => {
      // Act
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'no.existe@mail.escuelaing.edu.co',
          password: 'Password123',
        },
      });

      // Assert
      expect(res.statusCode).toBe(401);
      expect(res.json().error).toBe('Unauthorized');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('responde 200 con el perfil del usuario autenticado vía Bearer token', async () => {
      // Arrange
      const user = buildUser();
      repository.users.set(user.id!, user);
      const token = app.jwt.sign({ id: user.id, email: user.email, role: user.role });

      // Act
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: { authorization: `Bearer ${token}` },
      });

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      });
    });

    it('responde 401 si no se envía token', async () => {
      // Act
      const res = await app.inject({ method: 'GET', url: '/api/v1/auth/me' });

      // Assert
      expect(res.statusCode).toBe(401);
    });
  });
});

