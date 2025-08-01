import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Criar instância do Prisma para o middleware
const prisma = new PrismaClient()

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
  
  // Se o usuário estiver autenticado, buscar dados atualizados do banco
  let userRole = session?.role
  let userStatus = session?.status
  
  if (session?.sub) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.sub },
        select: { role: true, status: true }
      })
      
      if (dbUser) {
        userRole = dbUser.role
        userStatus = dbUser.status
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário no middleware:', error)
    }
  }
  
  // Se o usuário estiver autenticado e tentar acessar uma rota pública
  if (session && isPublicPath) {
    // Se for admin, redirecionar SEMPRE para a área de administração
    if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    // Se for usuário normal, redirecionar para o dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Se o usuário tentar acessar a área de administração sem ser admin
  if (session && path.startsWith('/admin') && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Se o usuário for ADMIN, permitir acesso a TODAS as rotas admin independente do status
  if (session && userRole === 'ADMIN') {
    return NextResponse.next()
  }
  
  // Se o usuário estiver com status pendente e tentar acessar uma rota não permitida
  // (mas APENAS se NÃO for ADMIN)
  if (session && 
      userRole !== 'ADMIN' &&
      (userStatus === 'PENDING_PAYMENT' || userStatus === 'PENDING_APPROVAL') && 
      !isPendingUserAllowedPath && 
      !path.startsWith('/pending-payment')) {
    return NextResponse.redirect(new URL('/pending-payment', request.url))
  }
  
  return NextResponse.next()
}

// Configurar quais caminhos o middleware deve ser executado
export const config = {
  matcher: ['/', '/login', '/register', '/dashboard/:path*', '/admin/:path*', '/pending-payment/:path*'],
}