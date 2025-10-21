"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, Download, X } from "lucide-react"

interface PDFConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  customerName: string
  loanId: string
}

export function PDFConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  customerName,
  loanId
}: PDFConfirmationModalProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleConfirm = async () => {
    setIsGenerating(true)
    try {
      await onConfirm()
    } finally {
      setIsGenerating(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Empréstimo Cadastrado com Sucesso!
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                Deseja gerar um PDF com os dados do empréstimo?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Cliente:</span>
              <span className="text-sm text-gray-900">{customerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Contrato:</span>
              <span className="text-sm text-gray-900 font-mono">#{loanId.slice(-8)}</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Download className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">O PDF incluirá:</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• Dados completos do cliente</li>
                  <li>• Informações do empréstimo e parcelas</li>
                  <li>• Resumo financeiro detalhado</li>
                  <li>• Comissões (se aplicável)</li>
                  <li>• Observações e termos</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isGenerating}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Não, obrigado
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isGenerating}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Gerando PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Sim, gerar PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}