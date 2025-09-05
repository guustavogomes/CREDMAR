import { NextRequest, NextResponse } from 'next/server'

// Cache de CEPs em memória (para desenvolvimento)
const cepCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 horas

export async function GET(
  request: NextRequest,
  { params }: { params: { cep: string } }
) {
  try {
    const { cep } = params
    
    // Validar formato do CEP
    const cepRegex = /^\d{8}$/
    if (!cepRegex.test(cep)) {
      return NextResponse.json(
        { error: 'CEP deve conter exatamente 8 dígitos' },
        { status: 400 }
      )
    }
    
    // Verificar cache primeiro
    const cached = cepCache.get(cep)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800', // 1 dia + 1 semana stale
          'X-Cache': 'HIT'
        }
      })
    }
    
    // Buscar CEP na API ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    const data = await response.json()
    
    if (data.erro) {
      return NextResponse.json(
        { error: 'CEP não encontrado' },
        { status: 404 }
      )
    }
    
    const result = {
      cep: data.cep,
      endereco: `${data.logradouro}, ${data.bairro}`,
      cidade: data.localidade,
      estado: data.uf,
      bairro: data.bairro,
      logradouro: data.logradouro
    }
    
    // Armazenar no cache
    cepCache.set(cep, { data: result, timestamp: Date.now() })
    
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800', // 1 dia + 1 semana stale
        'X-Cache': 'MISS'
      }
    })
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}