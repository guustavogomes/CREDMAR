'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

// Importar Joyride dinamicamente para evitar problemas de SSR
const JoyRide = dynamic(
  () => import('react-joyride').then(mod => ({ default: mod.default })), 
  { 
    ssr: false,
    loading: () => null 
  }
)

interface TutorialContextType {
  startTutorial: (tourName?: string) => void
  resetTutorials: () => void
  skipTutorial: () => void
}

const TutorialContext = createContext<TutorialContextType>({
  startTutorial: () => {},
  resetTutorials: () => {},
  skipTutorial: () => {}
})

export const useTutorial = () => useContext(TutorialContext)

// Definir os tours para cada página - simplificado
const tours = {
  dashboard: [
    {
      target: 'body',
      content: '👋 Bem-vindo ao TaPago! Este é seu painel principal onde você pode ver um resumo completo do seu negócio.',
      placement: 'center' as const,
      disableBeacon: true
    }
  ],
  clientes: [
    {
      target: 'body',
      content: '👥 Aqui você gerencia todos os seus clientes. Use o botão "Novo Cliente" para adicionar, ou clique em um cliente para ver detalhes.',
      placement: 'center' as const,
      disableBeacon: true
    }
  ],
  emprestimos: [
    {
      target: 'body',
      content: '💰 Gerencie todos os empréstimos ativos aqui. Use o botão "Novo Empréstimo" para criar um novo.',
      placement: 'center' as const,
      disableBeacon: true
    }
  ],
  novo_emprestimo: [
    {
      target: 'body',
      content: '📝 Para criar um novo empréstimo: 1) Selecione o cliente, 2) Digite o valor total e valor sem juros, 3) Escolha a periodicidade e número de parcelas.',
      placement: 'center' as const,
      disableBeacon: true
    }
  ]
}

interface TutorialProviderProps {
  children: ReactNode
}

export default function TutorialProvider({ children }: TutorialProviderProps) {
  const [run, setRun] = useState(false)
  const [steps, setSteps] = useState<any[]>([])
  const [stepIndex, setStepIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { toast } = useToast()
  
  // Controlar se o componente está montado
  useEffect(() => {
    setMounted(true)
  }, [])

  const getTourKeyFromPath = (path: string): string | null => {
    if (path === '/dashboard') return 'dashboard'
    if (path === '/dashboard/clientes') return 'clientes'
    if (path === '/dashboard/emprestimos') return 'emprestimos'
    if (path === '/dashboard/emprestimos/novo') return 'novo_emprestimo'
    return null
  }

  const hasSeenTour = (tourKey: string): boolean => {
    if (typeof window === 'undefined') return false
    const seenTours = JSON.parse(localStorage.getItem('seenTours') || '[]')
    return seenTours.includes(tourKey)
  }

  const markTourAsSeen = (tourKey: string) => {
    if (typeof window === 'undefined') return
    const seenTours = JSON.parse(localStorage.getItem('seenTours') || '[]')
    if (!seenTours.includes(tourKey)) {
      seenTours.push(tourKey)
      localStorage.setItem('seenTours', JSON.stringify(seenTours))
    }
    localStorage.setItem('hasSeenTutorial', 'true')
  }

  const startTutorial = (tourName?: string) => {
    if (!mounted) return
    
    const tourKey = tourName || getTourKeyFromPath(pathname)
    if (tourKey && tours[tourKey as keyof typeof tours]) {
      const tourSteps = tours[tourKey as keyof typeof tours]
      setSteps(tourSteps)
      setStepIndex(0)
      setRun(true)
      
      toast({
        title: "🎓 Tutorial Iniciado",
        description: "Siga as instruções para aprender a usar esta página!"
      })
    } else {
      toast({
        title: "📋 Tutorial não disponível",
        description: "Não há tutorial específico para esta página.",
        variant: "destructive"
      })
    }
  }

  const resetTutorials = () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem('hasSeenTutorial')
    localStorage.removeItem('seenTours')
    
    toast({
      title: "🔄 Tutoriais Reiniciados",
      description: "Todos os tutoriais foram redefinidos. Agora você pode vê-los novamente!"
    })
  }

  const skipTutorial = () => {
    setRun(false)
    const tourKey = getTourKeyFromPath(pathname)
    if (tourKey) {
      markTourAsSeen(tourKey)
    }
  }

  const handleJoyrideCallback = (data: any) => {
    const { status, type } = data
    const finishedStatuses = ['finished', 'skipped']
    
    if (finishedStatuses.includes(status)) {
      const tourKey = getTourKeyFromPath(pathname)
      if (tourKey) {
        markTourAsSeen(tourKey)
      }
      setRun(false)
      
      if (status === 'finished') {
        toast({
          title: "✅ Tutorial Concluído",
          description: "Parabéns! Você concluiu o tutorial desta página."
        })
      }
    }
  }

  return (
    <TutorialContext.Provider value={{ startTutorial, resetTutorials, skipTutorial }}>
      {children}
      {mounted && (
        <JoyRide
          steps={steps}
          run={run}
          stepIndex={stepIndex}
          continuous
          showProgress
          showSkipButton
          callback={handleJoyrideCallback}
          locale={{
            back: 'Voltar',
            close: 'Fechar',
            last: 'Finalizar',
            next: 'Próximo',
            skip: 'Pular'
          }}
          styles={{
            options: {
              primaryColor: '#3b82f6',
              zIndex: 10000,
            },
            tooltip: {
              borderRadius: 8,
              fontSize: 16
            },
            buttonNext: {
              backgroundColor: '#3b82f6',
              borderRadius: 4,
            },
            buttonBack: {
              marginRight: 10,
            }
          }}
        />
      )}
    </TutorialContext.Provider>
  )
}