import { beforeEach, describe, expect, it } from 'vitest';
import { ConflictException, ResourceNotFoundException, UnauthorizedException } from '../../src/exceptions/app.exception';
import { AuthServiceImpl } from '../../src/services/impl/auth.service.impl';
import { AuthValidatorImpl } from '../../src/validators/impl/auth.validator.impl';
import { buildUser, InMemoryUserRepository, MockPasswordHasher } from '../support/fixtures';

describe('AuthServiceImpl', () => {
  let repository: InMemoryUserRepository;
  let validator: AuthValidatorImpl;
  let hasher: MockPasswordHasher;
  let service: AuthServiceImpl;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
    validator = new AuthValidatorImpl(repository);
    hasher = new MockPasswordHasher();
    service = new AuthServiceImpl(repository, validator, hasher);
  });

  describe('register', () => {
    it('registra un usuario nuevo y registra evento de auditoría', async () => {
      // Arrange
      const user = buildUser({ id: undefined });

      // Act
      const created = await service.register(user);

      // Assert
      expect(created.id).toBeDefined();
      expect(created.email).toBe(user.email);
      expect(repository.auditLogs).toHaveLength(1);
      expect(repository.auditLogs[0].action).toBe('USER_REGISTERED');
    });

    it('rechaza el registro si el correo ya existe (409 Conflict)', async () => {
      // Arrange
      const existing = buildUser();
      repository.users.set(existing.id!, existing);

      // Act + Assert
      await expect(service.register(existing)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('autentica credenciales válidas y registra log de auditoría', async () => {
      // Arrange
      const user = buildUser();
      repository.users.set(user.id!, user);

      // Act
      const result = await service.login({
        email: user.email,
        password: 'Secret123',
        ipAddress: '127.0.0.1',
      });

      // Assert
      expect(result.id).toBe(user.id);
      expect(repository.auditLogs).toHaveLength(1);
      expect(repository.auditLogs[0].action).toBe('USER_LOGIN');
    });

    it('falla con 401 si el usuario no existe', async () => {
      // Act + Assert
      await expect(
        service.login({ email: 'inexistente@mail.escuelaing.edu.co', password: 'Secret123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('falla con 401 si la contraseña es incorrecta', async () => {
      // Arrange
      const user = buildUser();
      repository.users.set(user.id!, user);

      // Act + Assert
      await expect(
        service.login({ email: user.email, password: 'WrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('falla con 401 si el usuario está inactivo', async () => {
      // Arrange
      const user = buildUser({ isActive: false });
      repository.users.set(user.id!, user);

      // Act + Assert
      await expect(
        service.login({ email: user.email, password: 'Secret123' }),
      ).rejects.toThrow('cuenta inactiva');
    });
  });

  describe('getUserById', () => {
    it('obtiene el usuario por su ID', async () => {
      // Arrange
      const user = buildUser();
      repository.users.set(user.id!, user);

      // Act
      const result = await service.getUserById(user.id!);

      // Assert
      expect(result.id).toBe(user.id);
    });

    it('falla con 404 si el usuario no existe', async () => {
      // Act + Assert
      await expect(service.getUserById('id-inexistente')).rejects.toThrow(ResourceNotFoundException);
    });
  });
});
