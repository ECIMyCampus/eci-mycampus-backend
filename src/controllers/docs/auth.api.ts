import {
  LoginRequestSchema,
  RegisterRequestSchema,
} from '../../models/dto/request/auth.request.dto';
import {
  LoginResponseSchema,
  RegisterResponseSchema,
  UserResponseSchema,
} from '../../models/dto/response/auth.response.dto';
import { ErrorResponseSchema } from '../../models/dto/response/error.response.dto';

const TAG = ['Autenticación'];
const bearer = [{ bearerAuth: [] }];

const errors = {
  400: ErrorResponseSchema.describe('Datos de entrada malformados'),
  401: ErrorResponseSchema.describe('Credenciales inválidas o no autenticado'),
  403: ErrorResponseSchema.describe('Rol sin permisos suficientes'),
  404: ErrorResponseSchema.describe('Usuario no encontrado'),
  409: ErrorResponseSchema.describe('Correo electrónico ya registrado'),
  422: ErrorResponseSchema.describe('Violación de reglas de registro'),
};

export const AuthApi = {
  register: {
    tags: TAG,
    summary: 'Registrar nuevo usuario',
    description: 'Registra un usuario institucional con correo @escuelaing.edu.co y contraseña segura.',
    body: RegisterRequestSchema,
    response: {
      201: RegisterResponseSchema,
      400: errors[400],
      409: errors[409],
      422: errors[422],
    },
  },

  login: {
    tags: TAG,
    summary: 'Iniciar sesión',
    description: 'Autentica credenciales y genera un token JWT firmado de 7 días de validez.',
    body: LoginRequestSchema,
    response: {
      200: LoginResponseSchema,
      400: errors[400],
      401: errors[401],
    },
  },

  me: {
    tags: TAG,
    summary: 'Consultar perfil del usuario autenticado',
    security: bearer,
    response: {
      200: UserResponseSchema,
      401: errors[401],
      404: errors[404],
    },
  },
} as const;
