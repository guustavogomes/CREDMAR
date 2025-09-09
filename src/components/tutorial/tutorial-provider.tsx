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

// Definir os tours para cada página - detalhados
const tours = {
  dashboard: [
    {
      target: 'body',
      content: `
        <div style="line-height: 1.5;">
          <h3 style="margin: 0 0 12px 0; color: #1e40af;">🏠 Painel Principal - TaPago</h3>
          <p style="margin: 0 0 8px 0;"><strong>Este é seu centro de controle!</strong> Aqui você tem uma visão completa do seu negócio de empréstimos.</p>
          
          <p style="margin: 8px 0; font-size: 14px;"><strong>📊 Indicadores principais:</strong></p>
          <ul style="margin: 4px 0 8px 20px; font-size: 14px;">
            <li>Vencimentos de hoje, semana e mês</li>
            <li>Parcelas em atraso que precisam de atenção</li>
            <li>Total recebido no mês atual</li>
            <li>Número de empréstimos e clientes ativos</li>
          </ul>
          
          <p style="margin: 8px 0 4px 0; font-size: 14px; color: #059669;"><strong>💡 Dica:</strong> Os cards coloridos são clicáveis! Clique neles para ver os detalhes.</p>
        </div>
      `,
      placement: 'center' as const,
      disableBeacon: true
    }
  ],
  clientes: [
    {
      target: 'body',
      content: `
        <div style="line-height: 1.5;">
          <h3 style="margin: 0 0 12px 0; color: #1e40af;">👥 Gerenciamento de Clientes</h3>
          <p style="margin: 0 0 8px 0;"><strong>Gerencie sua base de clientes de forma completa!</strong></p>
          
          <p style="margin: 8px 0; font-size: 14px;"><strong>🛠️ O que você pode fazer:</strong></p>
          <ul style="margin: 4px 0 8px 20px; font-size: 14px;">
            <li><strong>Cadastrar novos clientes</strong> com dados completos (CPF, endereço, foto)</li>
            <li><strong>Consultar score</strong> e histórico de cada cliente</li>
            <li><strong>Buscar clientes</strong> rapidamente pelo nome ou CPF</li>
            <li><strong>Editar informações</strong> ou visualizar empréstimos do cliente</li>
            <li><strong>Organizar por rotas</strong> para facilitar cobrança</li>
          </ul>
          
          <p style="margin: 8px 0 4px 0; font-size: 14px; color: #059669;"><strong>💡 Dica:</strong> Use a busca por CEP para preenchimento automático do endereço!</p>
        </div>
      `,
      placement: 'center' as const,
      disableBeacon: true
    }
  ],
  emprestimos: [
    {
      target: 'body',
      content: `
        <div style="line-height: 1.5;">
          <h3 style="margin: 0 0 12px 0; color: #1e40af;">💰 Controle de Empréstimos</h3>
          <p style="margin: 0 0 8px 0;"><strong>Central completa para gerenciar todos os seus empréstimos!</strong></p>
          
          <p style="margin: 8px 0; font-size: 14px;"><strong>🎯 Funcionalidades principais:</strong></p>
          <ul style="margin: 4px 0 8px 20px; font-size: 14px;">
            <li><strong>Criar empréstimos</strong> com cálculo automático de parcelas</li>
            <li><strong>Visualizar status</strong> de cada empréstimo (ativo, finalizado)</li>
            <li><strong>Acompanhar pagamentos</strong> e parcelas em atraso</li>
            <li><strong>Editar empréstimos</strong> quando necessário</li>
            <li><strong>Filtrar e buscar</strong> empréstimos específicos</li>
          </ul>
          
          <p style="margin: 8px 0; font-size: 14px;"><strong>📋 Informações exibidas:</strong></p>
          <ul style="margin: 4px 0 8px 20px; font-size: 14px;">
            <li>Nome do cliente e dados de contato</li>
            <li>Valor total, parcelas restantes e próximo vencimento</li>
            <li>Status de pagamento e histórico</li>
          </ul>
          
          <p style="margin: 8px 0 4px 0; font-size: 14px; color: #059669;"><strong>💡 Dica:</strong> Clique em "Ver Parcelas" para acompanhar cada pagamento individualmente!</p>
        </div>
      `,
      placement: 'center' as const,
      disableBeacon: true
    }
  ],
  novo_emprestimo: [
    {
      target: 'body',
      content: `
        <div style="line-height: 1.5;">
          <h3 style="margin: 0 0 12px 0; color: #1e40af;">📝 Criação de Empréstimo</h3>
          <p style="margin: 0 0 8px 0;"><strong>Crie empréstimos de forma rápida e precisa!</strong></p>
          
          <p style="margin: 8px 0; font-size: 14px;"><strong>📋 Passo a passo:</strong></p>
          <ol style="margin: 4px 0 8px 20px; font-size: 14px;">
            <li><strong>Cliente:</strong> Selecione o cliente (ou cadastre um novo)</li>
            <li><strong>Valor Total:</strong> Digite o valor final que o cliente pagará</li>
            <li><strong>Valor sem Juros:</strong> Digite o valor líquido emprestado</li>
            <li><strong>Periodicidade:</strong> Escolha quando o cliente pagará (diário, semanal, mensal)</li>
            <li><strong>Parcelas:</strong> Defina em quantas vezes será dividido</li>
            <li><strong>Datas:</strong> Data do empréstimo e primeiro vencimento</li>
          </ol>
          
          <p style="margin: 8px 0; font-size: 14px;"><strong>🧮 Calculadora automática:</strong></p>
          <ul style="margin: 4px 0 8px 20px; font-size: 14px;">
            <li>O valor de cada parcela é calculado automaticamente</li>
            <li>As datas dos vencimentos são geradas conforme a periodicidade</li>
            <li>Você pode acompanhar o cálculo na lateral</li>
          </ul>
          
          <p style="margin: 8px 0 4px 0; font-size: 14px; color: #059669;"><strong>💡 Dica:</strong> Use o campo "Observação" para anotar detalhes importantes do empréstimo!</p>
        </div>
      `,
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
    
    toast({
      title: "🚪 Tutorial Encerrado",
      description: "Tutorial fechado manualmente."
    })
  }

  const handleJoyrideCallback = (data: any) => {
    const { status, type, action, index, lifecycle } = data
    console.log('JoyRide callback:', { status, type, action, index, lifecycle })
    
    // Qualquer situação que indique finalização
    const shouldClose = (
      status === 'finished' ||
      status === 'skipped' ||
      action === 'close' ||
      action === 'skip' ||
      type === 'tour:end' ||
      (type === 'step:after' && action === 'next' && index >= steps.length - 1)
    )
    
    if (shouldClose) {
      console.log('Fechando tutorial por:', { status, action, type })
      
      const tourKey = getTourKeyFromPath(pathname)
      if (tourKey) {
        markTourAsSeen(tourKey)
      }
      setRun(false)
      
      // Toast baseado no motivo do fechamento
      if (status === 'finished' || (type === 'step:after' && action === 'next')) {
        toast({
          title: "✅ Tutorial Concluído",
          description: "Parabéns! Você concluiu o tutorial desta página."
        })
      } else if (action === 'skip') {
        toast({
          title: "⏭️ Tutorial Pulado",
          description: "Tutorial pulado. Você pode acessá-lo novamente pelo botão de ajuda."
        })
      } else if (action === 'close') {
        toast({
          title: "❌ Tutorial Fechado",
          description: "Tutorial fechado. Você pode acessá-lo novamente pelo botão de ajuda."
        })
      } else {
        toast({
          title: "📋 Tutorial Encerrado",
          description: "Tutorial finalizado."
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
          continuous={false}
          showProgress={false}
          showSkipButton={true}
          hideCloseButton={false}
          disableOverlayClose={false}
          disableCloseOnEsc={false}
          spotlightPadding={5}
          callback={handleJoyrideCallback}
          locale={{
            back: 'Voltar',
            close: 'Fechar',
            last: 'Entendi!',
            next: 'Próximo',
            skip: 'Pular'
          }}
          styles={{
            options: {
              primaryColor: '#3b82f6',
              zIndex: 10000,
              overlayColor: 'rgba(0, 0, 0, 0.5)',
              width: 500
            },
            tooltip: {
              borderRadius: 8,
              fontSize: 16,
              padding: 20
            },
            tooltipContainer: {
              textAlign: 'left'
            },
            tooltipContent: {
              padding: '10px 0'
            },
            buttonNext: {
              backgroundColor: '#3b82f6',
              borderRadius: 4,
              fontSize: 14,
              padding: '8px 16px'
            },
            buttonBack: {
              marginRight: 10,
            },
            buttonClose: {
              display: 'block',
              position: 'absolute',
              right: 8,
              top: 8
            },
            buttonSkip: {
              color: '#6b7280',
              fontSize: 12
            }
          }}
        />
      )}
    </TutorialContext.Provider>
  )
}