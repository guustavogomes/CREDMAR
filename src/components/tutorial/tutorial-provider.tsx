'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

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

// Definir os tours para cada página
const tours = {
  dashboard: [
    {
      target: '.dashboard-welcome',
      content: '👋 Bem-vindo ao TaPago! Este é seu painel principal onde você pode ver um resumo completo do seu negócio.',
      placement: 'center' as const,
      disableBeacon: true
    },
    {
      target: '[href="/dashboard/vencimentos/hoje"]',
      content: '📅 Aqui você vê os vencimentos de hoje. Clique para ver detalhes e marcar como pago.',
      placement: 'bottom' as const
    },
    {
      target: '[href="/dashboard/vencimentos/semana"]',
      content: '📊 Vencimentos da semana mostra todas as parcelas dos próximos 7 dias.',
      placement: 'bottom' as const
    },
    {
      target: '[href="/dashboard/vencimentos/atraso"]',
      content: '⚠️ Parcelas em atraso precisam de atenção especial. Clique para gerenciar.',
      placement: 'bottom' as const
    },
    {
      target: '.performance-section',
      content: '📈 Aqui você acompanha o desempenho do seu negócio com métricas importantes.',
      placement: 'top' as const
    }
  ],
  clientes: [
    {
      target: '.page-header',
      content: '👥 Aqui você gerencia todos os seus clientes.',
      placement: 'bottom' as const,
      disableBeacon: true
    },
    {
      target: '[href="/dashboard/clientes/novo"]',
      content: '➕ Clique aqui para cadastrar um novo cliente.',
      placement: 'bottom' as const
    },
    {
      target: '.search-bar',
      content: '🔍 Use a barra de pesquisa para encontrar clientes rapidamente.',
      placement: 'bottom' as const
    },
    {
      target: '.customer-card:first-child',
      content: '📋 Cada card mostra as informações do cliente. Clique para ver detalhes ou editar.',
      placement: 'right' as const
    }
  ],
  emprestimos: [
    {
      target: '.page-header',
      content: '💰 Gerencie todos os empréstimos ativos aqui.',
      placement: 'bottom' as const,
      disableBeacon: true
    },
    {
      target: '[href="/dashboard/emprestimos/novo"]',
      content: '➕ Clique aqui para criar um novo empréstimo.',
      placement: 'bottom' as const
    },
    {
      target: '.loan-filters',
      content: '🎯 Use os filtros para encontrar empréstimos específicos.',
      placement: 'bottom' as const
    },
    {
      target: '.loan-card:first-child',
      content: '📊 Cada card mostra os detalhes do empréstimo. Você pode ver parcelas, editar ou excluir.',
      placement: 'right' as const
    }
  ],
  novo_emprestimo: [
    {
      target: '.loan-form',
      content: '📝 Vamos criar um novo empréstimo! Preencha os campos com atenção.',
      placement: 'center' as const,
      disableBeacon: true
    },
    {
      target: '#customer',
      content: '👤 Primeiro, selecione o cliente que receberá o empréstimo.',
      placement: 'right' as const
    },
    {
      target: '#totalAmount',
      content: '💵 Digite o valor total do empréstimo (com juros).',
      placement: 'right' as const
    },
    {
      target: '#amountWithoutInterest',
      content: '💰 Digite o valor sem juros (valor que o cliente realmente recebeu).',
      placement: 'right' as const
    },
    {
      target: '#periodicity',
      content: '📅 Escolha a periodicidade de pagamento (diário, semanal, mensal, etc).',
      placement: 'right' as const
    },
    {
      target: '#installments',
      content: '🔢 Digite o número de parcelas.',
      placement: 'right' as const
    },
    {
      target: '.calculation-card',
      content: '🧮 Aqui você vê o cálculo automático do valor de cada parcela.',
      placement: 'left' as const
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
  
  // Controlar se o componente está montado
  useEffect(() => {
    setMounted(true)
  }, [])

  // Verificar se é a primeira vez do usuário (apenas no cliente)
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return
    
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial')
    if (!hasSeenTutorial && pathname === '/dashboard') {
      setTimeout(() => {
        startTutorial('dashboard')
      }, 1000)
    }
  }, [pathname, mounted])

  // Detectar mudança de página e sugerir tutorial (apenas no cliente)
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return
    
    const tourKey = getTourKeyFromPath(pathname)
    if (tourKey && !hasSeenTour(tourKey)) {
      // Pequeno delay para a página carregar
      setTimeout(() => {
        const shouldShow = window.confirm('🎓 Deseja ver um tutorial rápido desta página?')
        if (shouldShow) {
          startTutorial(tourKey)
        } else {
          markTourAsSeen(tourKey)
        }
      }, 500)
    }
  }, [pathname, mounted])

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
    const tourKey = tourName || getTourKeyFromPath(pathname)
    if (tourKey && tours[tourKey as keyof typeof tours]) {
      setSteps(tours[tourKey as keyof typeof tours])
      setStepIndex(0)
      setRun(true)
    }
  }

  const resetTutorials = () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem('hasSeenTutorial')
    localStorage.removeItem('seenTours')
    window.location.reload()
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