const STEPS = [
  'Crear cuenta',
  'Confirmar correo',
  'Completar perfil',
  'Encontrar conexiones',
] as const

interface ActivationProgressProps {
  currentStep: 1 | 2 | 3 | 4
}

export function ActivationProgress({ currentStep }: ActivationProgressProps) {
  const percent = (currentStep / STEPS.length) * 100

  return (
    <div
      className="activation-progress"
      aria-label={`Paso ${currentStep} de ${STEPS.length}: ${STEPS[currentStep - 1]}`}
    >
      <div className="activation-progress-header">
        <span className="activation-progress-count">
          Paso {currentStep} de {STEPS.length}
        </span>
        <span className="activation-progress-name">{STEPS[currentStep - 1]}</span>
      </div>
      <div className="activation-progress-track" aria-hidden="true">
        <div className="activation-progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <ol className="activation-progress-steps" aria-hidden="true">
        {STEPS.map((label, index) => {
          const step = index + 1
          const state =
            step < currentStep ? 'done' : step === currentStep ? 'current' : 'upcoming'
          return (
            <li key={label} className={`activation-step activation-step--${state}`}>
              <span className="activation-step-dot">{step}</span>
              <span className="activation-step-label">{label}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
