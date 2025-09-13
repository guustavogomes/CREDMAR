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
  
  // Rotas permitidas para usuários pendentes
  const pendingUserAllowedPaths = ['/pending-payment', '/api/payment/upload-proof']
  const isPendingUserAllowedPath = pendingUserAllowedPaths.some(allowedPath => path.startsWith(allowedPath))
  
  // Se o usuário não estiver autenticado e tentar acessar uma rota protegida
  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Usar dados da sessão (que são atualizados no login)
  let userRole = session?.role
  let userStatus = session?.status
  
  // PRIMEIRO: Se o usuário for ADMIN, aplicar regras específicas
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
  
  // VERIFICAR STATUS PENDENTE ANTES DE OUTROS REDIRECIONAMENTOS
  // Se o usuário estiver com status pendente e tentar acessar uma rota não permitida
  // (mas APENAS se NÃO for ADMIN)
  if (session && 
      userRole !== 'ADMIN' &&
      (userStatus === 'PENDING_PAYMENT' || userStatus === 'PENDING_APPROVAL') && 
      !isPendingUserAllowedPath && 
      !path.startsWith('/pending-payment')) {
    return NextResponse.redirect(new URL('/pending-payment', request.url))
  }
  
  // Se o usuário estiver autenticado e tentar acessar uma rota pública (não admin)
  // MAS APENAS se NÃO tiver status pendente
  if (session && isPublicPath && userRole !== 'ADMIN' && 
      userStatus !== 'PENDING_PAYMENT' && userStatus !== 'PENDING_APPROVAL') {
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