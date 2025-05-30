'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatExpirationDate, getExpirationMessage } from '@/utils/date-time'
import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

interface DoorCodeDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  doorCode?: string
  expiresAt?: string
  roomName: string
  isLoading?: boolean
}

export function DoorCodeDialog({
  isOpen,
  onOpenChange,
  doorCode = '',
  expiresAt = '',
  roomName,
  isLoading = false,
}: DoorCodeDialogProps) {
  const [copied, setCopied] = useState(false)

  // Função para copiar o código para a área de transferência
  const copyToClipboard = () => {
    if (doorCode) {
      navigator.clipboard.writeText(doorCode)
      setCopied(true)

      // Resetar o estado após 2 segundos
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    }
  }

  // Renderização do conteúdo do código com efeito de loading
  const renderCodeContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center">
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <div
                key={num}
                className="bg-primary/30 flex h-14 w-10 animate-pulse items-center justify-center rounded-md text-5xl"
              ></div>
            ))}
          </div>
        </div>
      )
    }

    return (
      <>
        <p className="text-primary text-5xl font-bold tracking-widest">
          {doorCode}
        </p>
        {!isLoading && (
          <Button
            variant="outline"
            size="icon"
            className="group absolute top-2 right-2"
            onClick={copyToClipboard}
            title="Copiar código"
            disabled={!doorCode}
          >
            {copied ? (
              <Check className="text-primary group-hover:text-accent-foreground h-4 w-4" />
            ) : (
              <Copy className="text-primary group-hover:text-accent-foreground h-4 w-4" />
            )}
          </Button>
        )}
        {copied && (
          <div className="bg-background border-border animate-fade-in absolute top-2 right-14 rounded border p-1.5 text-xs">
            Código copiado!
          </div>
        )}
      </>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Código de Abertura da Porta
          </DialogTitle>
          <DialogDescription className="text-center">
            {isLoading
              ? 'Gerando código para a sala ' + roomName + '...'
              : 'Utilize este código para abrir a porta da sala ' + roomName}
          </DialogDescription>
        </DialogHeader>

        <div className="my-6 flex flex-col items-center justify-center gap-4">
          <div className="bg-primary/10 relative flex min-h-[100px] w-full items-center justify-center gap-2 rounded-lg p-6 text-center">
            {renderCodeContent()}
          </div>
          {!isLoading && (
            <div className="text-center">
              <p className="text-sm font-medium">
                Válido até:{' '}
                <span className="font-semibold">
                  {formatExpirationDate(expiresAt)}
                </span>
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {getExpirationMessage(expiresAt)}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-center">
          <Button onClick={() => onOpenChange(false)} disabled={isLoading}>
            {isLoading ? 'Aguarde...' : 'Entendi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
