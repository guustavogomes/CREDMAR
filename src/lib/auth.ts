import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { JWT } from "next-auth/jwt"
import { Session, User } from "next-auth"

export const authOptions = {
  adapter: PrismaAdapter(db) as any,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const validatedFields = z.object({
          email: z.string().email(),
          password: z.string().min(6)
        }).safeParse(credentials)

        if (!validatedFields.success) {
          return null
        }

        const { email, password } = validatedFields.data

        const user = await db.user.findUnique({
          where: { email }
        })

        if (!user || !user.password) {
          return null
        }

        const passwordsMatch = await bcrypt.compare(password, user.password)

        if (passwordsMatch) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status
          }
        }

        return null
      }
    })
  ],
  session: {
    strategy: "jwt" as const
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.role = (user as any).role
        token.status = (user as any).status
      } else if (token.sub) {
        // Buscar dados atualizados do usuário no banco
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.sub },
            select: { role: true, status: true }
          })
          
          if (dbUser) {
            token.role = dbUser.role
            token.status = dbUser.status
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error)
        }
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        session.user.id = token.sub as string
        session.user.role = token.role as string
        session.user.status = token.status as string
      }
      return session
    }
  },
  pages: {
    signIn: "/login"
  }
}

export default NextAuth(authOptions)