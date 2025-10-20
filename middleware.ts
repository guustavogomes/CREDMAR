import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // Verificar se o usuário está autenticado
  const session = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })
  
  // Rotas públicas que não precisam de autenticação
  const publicPaths = ['/', '/login', '/register']
  const isPublicPath = publicPaths.includes(path)
  
  // Se o usuário não estiver autenticado e tentar acessar uma rota protegida
  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Usar dados da sessão
  const userRole = session?.role
  
  // Se o usuário for ADMIN, aplicar regras específicas
  if (session && userRole === 'ADMIN') {
    // Se admin tentar acessar rota pública, redirecionar para admin
    if (isPublicPath) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    // Se admin tentar acessar dashboard comum, redirecionar para admin
    if (path.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    // Admin pode acessar qualquer rota admin
    if (path.startsWith('/admin')) {
      return NextResponse.next()
    }
  }
  
  // Se o usuário estiver autenticado e tentar acessar uma rota pública (não admin)
  if (session && isPublicPath && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Se o usuário tentar acessar a área de administração sem ser admin
  if (session && path.startsWith('/admin') && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
}

// Configurar quais caminhos o middleware deve ser executado
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}