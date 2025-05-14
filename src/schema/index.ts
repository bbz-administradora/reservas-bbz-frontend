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

const isBrowser = typeof window !== 'undefined'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]
export const fiveImageValidation = isBrowser
  ? z
      .array(z.instanceof(File), {
        required_error: 'Envie ao menos uma imagem para continuar.',
      })
      .min(1, { message: 'Envie ao menos uma imagem para continuar.' })
      .max(5, { message: 'Você pode enviar até 5 imagens.' })
      .refine((files) => files.every((file) => file.size <= MAX_FILE_SIZE), {
        message:
          'Uma ou mais imagens são muito grandes. O tamanho máximo é 10MB por imagem.',
      })
      .refine(
        (files) =>
          files.every((file) => ACCEPTED_IMAGE_TYPES.includes(file.type)),
        {
          message:
            'Uma ou mais imagens não são de um tipo válido. Use jpg, jpeg, png ou webp.',
        },
      )
  : z.any()
