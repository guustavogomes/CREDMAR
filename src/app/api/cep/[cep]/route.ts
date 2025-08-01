import { NextRequest, NextResponse } from 'next/server'

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
    
    // Buscar CEP na API ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    const data = await response.json()
    
    if (data.erro) {
      return NextResponse.json(
        { error: 'CEP não encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      cep: data.cep,
      endereco: `${data.logradouro}, ${data.bairro}`,
      cidade: data.localidade,
      estado: data.uf,
      bairro: data.bairro,
      logradouro: data.logradouro
    })
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}