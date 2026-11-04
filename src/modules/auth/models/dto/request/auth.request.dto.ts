import { z } from 'zod';

/**
 * Nivel 1 de validación (frontera HTTP): sintaxis, tipos, restricciones de correo institucional.
 * .strict() previene Mass Assignment.
 */
export const RegisterRequestSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email('Formato de correo electrónico no válido')
      .refine(
        (val) => val.endsWith('@mail.escuelaing.edu.co') || val.endsWith('@escuelaing.edu.co'),
        'El registro exige un correo institucional válido (@mail.escuelaing.edu.co o @escuelaing.edu.co)',
      ),
    password: z
      .string()
      .min(8, 'La contraseña debe contener al menos 8 caracteres')
      .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
      .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
    fullName: z.string().trim().min(3, 'El nombre completo debe tener al menos 3 caracteres').max(100),
    facultyId: z.guid('Identificador de facultad no válido').optional(),
    academicProgram: z.string().trim().max(100).optional(),
    interests: z.array(z.string().trim().max(50)).default([]),
    habeasDataAccepted: z.literal(true, {
      error: 'Debe aceptar la política de tratamiento de datos (Habeas Data)',
    }),
  })
  .strict();

export const LoginRequestSchema = z
  .object({
    email: z.string().trim().email('Formato de correo no válido'),
    password: z.string().min(1, 'La contraseña es obligatoria'),
  })
  .strict();

export type RegisterRequestDTO = z.infer<typeof RegisterRequestSchema>;
export type LoginRequestDTO = z.infer<typeof LoginRequestSchema>;

