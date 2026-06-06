import {
  LEARN_LEVEL_LABELS,
  TEACH_LEVEL_LABELS,
  type LearnLevel,
  type TeachLevel,
} from '@/lib/skills-types'

interface SkillChipProps {
  name: string
  level: TeachLevel | LearnLevel
  variant: 'teach' | 'learn'
  onRemove?: () => void
  removing?: boolean
}

export function SkillChip({
  name,
  level,
  variant,
  onRemove,
  removing,
}: SkillChipProps) {
  const levelLabel =
    variant === 'teach'
      ? TEACH_LEVEL_LABELS[level as TeachLevel]
      : LEARN_LEVEL_LABELS[level as LearnLevel]

  return (
    <span className="skill-chip">
      <span className="skill-chip-name">{name}</span>
      <span className="skill-chip-level">{levelLabel}</span>
      {onRemove ? (
        <button
          type="button"
          className="skill-chip-remove"
          onClick={onRemove}
          disabled={removing}
          aria-label={`Eliminar ${name}`}
        >
          ×
        </button>
      ) : null}
    </span>
  )
}
