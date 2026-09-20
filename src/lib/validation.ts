import { z } from 'zod'

// Validación de entrada con zod. Patrón: parsear en la ruta y devolver
// 400 con el primer mensaje si falla. Ampliar esquemas siguiendo este archivo.

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña obligatoria').max(128),
})

const optionalText = (max: number) => z.string().trim().max(max).optional()

export const clientCreateSchema = z.object({
  name: z.string().trim().min(1, 'Nombre obligatorio').max(100),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128),
  age: z.number().int().min(0).max(120).optional(),
  height: z.number().positive().max(500).optional(),
  weight: z.number().positive().max(1000).optional(),
  goal: optionalText(500),
  experienceLevel: optionalText(100),
  injuries: optionalText(1000),
  weeklyAvailability: optionalText(500),
  notes: optionalText(2000),
})

export const userCreateSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128),
  name: z.string().trim().min(1, 'Nombre obligatorio').max(100),
  role: z.enum(['admin', 'client']).optional(),
})

const sessionSetSchema = z.object({
  setNumber: z.number().int().min(1).max(100),
  reps: z.number().int().min(0).max(1000).optional(),
  weight: z.number().min(0).max(5000).optional(),
  rir: z.number().int().min(0).max(20).optional(),
  rpe: z.number().min(0).max(10).optional(),
})

const sessionExerciseSchema = z.object({
  exerciseName: z.string().trim().min(1).max(150),
  order: z.number().int().min(0).max(500).optional(),
  sets: z.array(sessionSetSchema).max(100).optional(),
})

export const sessionCreateSchema = z.object({
  clientId: z.string().min(1),
  trainingId: z.string().min(1).optional(),
  dayNumber: z.number().int().min(1).max(31).optional(),
  date: z.string().max(50).optional(),
  notes: optionalText(2000),
  rpe: z.number().min(0).max(10).optional(),
  exercises: z.array(sessionExerciseSchema).min(1, 'La sesión necesita al menos un ejercicio').max(100),
})

export function firstZodMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Datos inválidos'
}
