'use client'

import { useState } from 'react'
import { HelpCircle, GraduationCap, RefreshCw, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTutorial } from './tutorial-provider'
import { useToast } from '@/hooks/use-toast'

export function TutorialButton() {
  const { startTutorial, resetTutorials, skipTutorial } = useTutorial()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)

  const handleStartTutorial = () => {
    startTutorial()
    setIsOpen(false)
  }

  const handleResetTutorials = () => {
    // Substituir alert por toast de confirmação
    toast({
      title: "🔄 Confirmar Ação",
      description: "Deseja realmente reiniciar todos os tutoriais? Clique novamente para confirmar.",
      action: (
        <Button 
          size="sm" 
          onClick={() => {
            resetTutorials()
            setIsOpen(false)
          }}
        >
          Confirmar
        </Button>
      )
    })
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-20 right-4 z-50 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0 hover:from-purple-600 hover:to-indigo-600"
        >
          <GraduationCap className="h-6 w-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          Central de Ajuda
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleStartTutorial} className="cursor-pointer">
          <Play className="mr-2 h-4 w-4 text-green-600" />
          <div>
            <div className="font-medium">Iniciar Tutorial</div>
            <div className="text-xs text-muted-foreground">
              Aprenda a usar esta página
            </div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleResetTutorials} className="cursor-pointer">
          <RefreshCw className="mr-2 h-4 w-4 text-blue-600" />
          <div>
            <div className="font-medium">Reiniciar Tutoriais</div>
            <div className="text-xs text-muted-foreground">
              Ver todos os tutoriais novamente
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => { skipTutorial(); setIsOpen(false) }} className="cursor-pointer">
          <HelpCircle className="mr-2 h-4 w-4 text-red-600" />
          <div>
            <div className="font-medium">Fechar Tutorial</div>
            <div className="text-xs text-muted-foreground">
              Forçar fechamento do tutorial ativo
            </div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="cursor-pointer" onClick={() => window.open('https://wa.me/5537920001455', '_blank')}>
          <HelpCircle className="mr-2 h-4 w-4 text-gray-600" />
          <div>
            <div className="font-medium">Suporte WhatsApp</div>
            <div className="text-xs text-muted-foreground">
              Fale com nosso time
            </div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}