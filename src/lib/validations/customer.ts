import { z } from 'zod'

export const customerSchema = z.object({
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos').max(11, 'CPF deve ter 11 dígitos'),
  nomeCompleto: z.string().min(1, 'Nome completo é obrigatório'),
  celular: z.string().min(1, 'Celular é obrigatório'),
  cep: z.string().regex(/^\d{8}$/, 'CEP deve conter exatamente 8 dígitos'),
  endereco: z.string().min(1, 'Endereço é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().min(1, 'Estado é obrigatório'),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  referencia: z.string().optional(),
  routeId: z.string().optional(),
  foto: z.string().optional()
})
