import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import clsx from 'clsx'
import { Fragment, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface AppDialogProps {
  children: ReactNode
  className?: string
  description?: ReactNode
  isOpen: boolean
  onClose: () => void
  title: ReactNode
}

function AppDialog({ children, className, description, isOpen, onClose, title }: AppDialogProps) {
  return (
    <Transition appear as={Fragment} show={isOpen}>
      <Dialog as="div" className="relative z-[90]" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto px-3 py-6 sm:px-4">
          <div className="grid min-h-full place-items-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="translate-y-4 scale-95 opacity-0"
              enterTo="translate-y-0 scale-100 opacity-100"
              leave="ease-in duration-150"
              leaveFrom="translate-y-0 scale-100 opacity-100"
              leaveTo="translate-y-4 scale-95 opacity-0"
            >
              <DialogPanel
                className={clsx(
                  'grid max-h-[min(88vh,820px)] w-full max-w-3xl gap-4 overflow-y-auto rounded-md border border-lineStrong/70 bg-white/95 p-4 shadow-panel ring-1 ring-white/80 backdrop-blur sm:p-5',
                  className,
                )}
              >
                <header className="sticky top-0 z-10 -mx-4 -mt-4 flex items-start justify-between gap-4 border-b border-line bg-white/95 px-4 pb-3 pt-4 backdrop-blur sm:-mx-5 sm:-mt-5 sm:px-5 sm:pt-5">
                  <div className="grid gap-1">
                    <DialogTitle className="text-xl font-black text-ink">{title}</DialogTitle>
                    {description && <p className="text-sm font-semibold leading-6 text-muted">{description}</p>}
                  </div>
                  <button
                    type="button"
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-line bg-white p-0 text-muted shadow-soft hover:border-primary hover:text-primaryDark"
                    onClick={onClose}
                    aria-label="Close dialog"
                  >
                    <X size={18} />
                  </button>
                </header>
                {children}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default AppDialog
