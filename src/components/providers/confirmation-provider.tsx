'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

interface ConfirmationOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'danger' | 'primary'
}

interface ConfirmationContextType {
  confirm: (options: ConfirmationOptions) => Promise<boolean>
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(
  undefined
)

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean
    options: ConfirmationOptions
    resolve: ((value: boolean) => void) | null
  }>({
    isOpen: false,
    options: {
      title: '',
      message: '',
    },
    resolve: null,
  })

  const confirm = (options: ConfirmationOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setDialogState({
        isOpen: true,
        options,
        resolve,
      })
    })
  }

  const handleConfirm = () => {
    if (dialogState.resolve) {
      dialogState.resolve(true)
    }
    setDialogState({
      isOpen: false,
      options: { title: '', message: '' },
      resolve: null,
    })
  }

  const handleCancel = () => {
    if (dialogState.resolve) {
      dialogState.resolve(false)
    }
    setDialogState({
      isOpen: false,
      options: { title: '', message: '' },
      resolve: null,
    })
  }

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      <ConfirmationDialog
        isOpen={dialogState.isOpen}
        title={dialogState.options.title}
        message={dialogState.options.message}
        confirmLabel={dialogState.options.confirmLabel}
        cancelLabel={dialogState.options.cancelLabel}
        confirmVariant={dialogState.options.confirmVariant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmationContext.Provider>
  )
}

export function useConfirmation() {
  const context = useContext(ConfirmationContext)
  if (!context) {
    throw new Error(
      'useConfirmation must be used within a ConfirmationProvider'
    )
  }
  return context
}
