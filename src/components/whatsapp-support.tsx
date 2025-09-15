'use client'

import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function WhatsAppSupport() {
  const handleWhatsAppClick = () => {
    const phoneNumber = '551231974950' // Número com código do país (55) + DDD (12) + número
    const message = encodeURIComponent('Olá! Preciso de suporte com o sistema Tapago.')
    const url = `https://wa.me/${phoneNumber}?text=${message}`
    window.open(url, '_blank')
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleWhatsAppClick}
              className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 shadow-lg hover:shadow-xl transition-all duration-200 p-0"
              aria-label="Suporte via WhatsApp"
            >
              <MessageCircle className="h-7 w-7 text-white" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Suporte via WhatsApp</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}