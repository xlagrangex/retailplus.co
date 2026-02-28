import { useState, useEffect } from 'react'
import { Store, Columns, Users, MapPin, Camera, ChevronRight, ChevronLeft, X } from 'lucide-react'
import { UserRole } from '../types'

interface OnboardingSlide {
  title: string
  description: string
  icon?: React.ComponentType<{ size?: number; className?: string }>
  isLogo?: boolean
}

const adminSlides: OnboardingSlide[] = [
  {
    title: 'Benvenuto su Retail+ Pharma',
    description: 'La tua piattaforma per il merchandising in farmacia',
    isLogo: true,
  },
  {
    title: 'Gestisci le farmacie',
    description: '555 farmacie da coordinare, assegna i merchandiser e monitora ogni punto vendita',
    icon: Store,
  },
  {
    title: "Monitora l'avanzamento",
    description: 'Kanban board e mappa interattiva per vedere tutto in tempo reale',
    icon: Columns,
  },
  {
    title: 'Approva le registrazioni',
    description: 'I merchandiser si registrano autonomamente, tu approvi e assegni le farmacie',
    icon: Users,
  },
]

const merchandiserSlides: OnboardingSlide[] = [
  {
    title: 'Benvenuto su Retail+ Pharma',
    description: 'Il tuo strumento per gli allestimenti in farmacia',
    isLogo: true,
  },
  {
    title: 'Le tue farmacie',
    description: 'Trovi qui le farmacie assegnate, con le 3 fasi da completare per ciascuna',
    icon: MapPin,
  },
  {
    title: 'Completa le fasi',
    description: 'Rileva misure, monta il materiale, carica i prodotti e documenta tutto con foto',
    icon: Camera,
  },
]

function getStorageKey(userId: string) {
  return `retail_onboarding_seen_${userId}`
}

export function shouldShowOnboarding(userId: string): boolean {
  return !localStorage.getItem(getStorageKey(userId))
}

export function resetOnboarding(userId: string) {
  localStorage.removeItem(getStorageKey(userId))
  window.dispatchEvent(new CustomEvent('retail-onboarding-reset'))
}

export function useOnboardingTrigger(userId: string | undefined) {
  const [show, setShow] = useState(() => userId ? shouldShowOnboarding(userId) : false)

  useEffect(() => {
    function handler() { setShow(true) }
    window.addEventListener('retail-onboarding-reset', handler)
    return () => window.removeEventListener('retail-onboarding-reset', handler)
  }, [])

  return [show, setShow] as const
}

function markOnboardingSeen(userId: string) {
  localStorage.setItem(getStorageKey(userId), 'true')
}

export default function OnboardingModal({
  userId,
  ruolo,
  onClose,
}: {
  userId: string
  ruolo: UserRole
  onClose: () => void
}) {
  const slides = ruolo === 'admin' ? adminSlides : merchandiserSlides
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [animating, setAnimating] = useState(false)

  const isLast = step === slides.length - 1

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function goNext() {
    if (animating) return
    if (isLast) {
      handleClose()
      return
    }
    setDirection('next')
    setAnimating(true)
    setTimeout(() => {
      setStep(s => s + 1)
      setAnimating(false)
    }, 200)
  }

  function goPrev() {
    if (animating || step === 0) return
    setDirection('prev')
    setAnimating(true)
    setTimeout(() => {
      setStep(s => s - 1)
      setAnimating(false)
    }, 200)
  }

  function handleClose() {
    markOnboardingSeen(userId)
    onClose()
  }

  const slide = slides[step]
  const Icon = slide.icon

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-brand-900/60 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative w-full max-w-lg mx-4">
        {/* Skip button */}
        <button
          onClick={handleClose}
          className="absolute -top-10 right-0 text-white/60 hover:text-white text-xs flex items-center gap-1 transition-colors"
        >
          Salta <X size={14} />
        </button>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Content */}
          <div
            className="px-8 pt-10 pb-6 text-center min-h-[280px] flex flex-col items-center justify-center transition-opacity duration-200"
            style={{ opacity: animating ? 0 : 1 }}
          >
            {slide.isLogo ? (
              <img
                src="/Retaillogo.png"
                alt="Retail+"
                className="h-16 mb-6"
              />
            ) : Icon ? (
              <div className="w-16 h-16 rounded-2xl bg-accent-50 flex items-center justify-center mb-6">
                <Icon size={32} className="text-accent-600" />
              </div>
            ) : null}

            <h2 className="text-xl font-heading font-bold text-brand-900 mb-3">
              {slide.title}
            </h2>
            <p className="text-sm text-brand-500 leading-relaxed max-w-sm">
              {slide.description}
            </p>
          </div>

          {/* Footer */}
          <div className="px-8 pb-8 flex items-center justify-between">
            {/* Dots */}
            <div className="flex items-center gap-2">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step
                      ? 'w-6 bg-accent-500'
                      : 'w-1.5 bg-brand-200'
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={goPrev}
                  className="p-2 rounded-lg text-brand-400 hover:text-brand-700 hover:bg-brand-50 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              <button
                onClick={goNext}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition-colors"
              >
                {isLast ? 'Inizia' : 'Avanti'}
                {!isLast && <ChevronRight size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
