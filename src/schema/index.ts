import { z } from 'zod'

export const fullNameSchema = z
  .string({ required_error: 'O preenchimento do nome é obrigatório.' })
  .trim()
  .min(2, {
    message: 'O preenchimento do nome é obrigatório.',
  })
  .max(100, 'O nome é muito longo.')
  .regex(/^\S+\s+\S+/, {
    message: 'Informe o nome completo com pelo menos um sobrenome.',
  })
  .toLowerCase()

export const emailSchema = z
  .string({ required_error: 'O preenchimento do email é obrigatório.' })
  .trim()
  .toLowerCase()
  .min(3, { message: 'O preenchimento do email é obrigatório.' })
  .max(254, 'O e-mail é muito longo.')
  .email({ message: 'E-mail inválido.' })
