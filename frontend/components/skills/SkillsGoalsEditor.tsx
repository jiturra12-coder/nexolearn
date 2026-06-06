'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthNotice } from '@/components/auth/AuthNotice'
import {
  addLearnGoal,
  addTeachSkill,
  fetchLearnGoals,
  fetchSkillCatalog,
  fetchTeachSkills,
  removeLearnGoal,
  removeTeachSkill,
} from '@/lib/api/skills-client'
import {
  LEARN_LEVELS,
  LEARN_LEVEL_LABELS,
  MAX_SKILLS,
  MIN_SKILLS,
  TEACH_LEVELS,
  TEACH_LEVEL_LABELS,
  type LearnGoalItem,
  type LearnLevel,
  type SkillCatalogItem,
  type TeachLevel,
  type TeachSkillItem,
} from '@/lib/skills-types'
import { SkillChip } from './SkillChip'

interface SkillsGoalsEditorProps {
  onComplete?: () => void
  showContinueButton?: boolean
  continueLabel?: string
}

export function SkillsGoalsEditor({
  onComplete,
  showContinueButton = true,
  continueLabel = 'Guardar y continuar',
}: SkillsGoalsEditorProps) {
  const [catalog, setCatalog] = useState<SkillCatalogItem[]>([])
  const [teachSkills, setTeachSkills] = useState<TeachSkillItem[]>([])
  const [learnGoals, setLearnGoals] = useState<LearnGoalItem[]>([])
  const [loading, setLoading] = useState(true)

  const [teachQuery, setTeachQuery] = useState('')
  const [learnQuery, setLearnQuery] = useState('')
  const [teachLevel, setTeachLevel] = useState<TeachLevel>('intermedio')
  const [learnLevel, setLearnLevel] = useState<LearnLevel>('principiante')
  const [selectedTeachSkillId, setSelectedTeachSkillId] = useState('')
  const [selectedLearnSkillId, setSelectedLearnSkillId] = useState('')

  const [busyTeach, setBusyTeach] = useState(false)
  const [busyLearn, setBusyLearn] = useState(false)
  const [busyContinue, setBusyContinue] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const [teachError, setTeachError] = useState('')
  const [learnError, setLearnError] = useState('')
  const [continueError, setContinueError] = useState('')
  const [continueSuccess, setContinueSuccess] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [catalogData, teachData, goalsData] = await Promise.all([
        fetchSkillCatalog(),
        fetchTeachSkills(),
        fetchLearnGoals(),
      ])
      setCatalog(catalogData)
      setTeachSkills(teachData)
      setLearnGoals(goalsData)
    } catch (err) {
      setContinueError(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar tus habilidades.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const teachSkillIds = useMemo(
    () => new Set(teachSkills.map((s) => s.skill_id)),
    [teachSkills],
  )
  const learnSkillIds = useMemo(
    () => new Set(learnGoals.map((g) => g.skill_id)),
    [learnGoals],
  )

  function filterCatalog(query: string, excludeIds: Set<string>) {
    const q = query.trim().toLowerCase()
    return catalog.filter((s) => {
      if (excludeIds.has(s.id)) return false
      if (!q) return true
      return s.name.toLowerCase().includes(q)
    })
  }

  const teachOptions = useMemo(
    () => filterCatalog(teachQuery, teachSkillIds),
    [catalog, teachQuery, teachSkillIds],
  )
  const learnOptions = useMemo(
    () => filterCatalog(learnQuery, learnSkillIds),
    [catalog, learnQuery, learnSkillIds],
  )

  async function handleAddTeach() {
    setTeachError('')
    if (teachSkills.length >= MAX_SKILLS) {
      setTeachError(`Máximo ${MAX_SKILLS} habilidades para enseñar.`)
      return
    }

    const skillId = selectedTeachSkillId
    const skillName = teachQuery.trim()

    if (!skillId && !skillName) {
      setTeachError('Selecciona o escribe una habilidad.')
      return
    }

    setBusyTeach(true)
    try {
      const created = await addTeachSkill({
        skill_id: skillId || undefined,
        skill_name: skillId ? undefined : skillName,
        level: teachLevel,
      })
      setTeachSkills((prev) => [...prev, created])
      setTeachQuery('')
      setSelectedTeachSkillId('')
    } catch (err) {
      setTeachError(
        err instanceof Error ? err.message : 'No se pudo agregar la habilidad.',
      )
    } finally {
      setBusyTeach(false)
    }
  }

  async function handleAddLearn() {
    setLearnError('')
    if (learnGoals.length >= MAX_SKILLS) {
      setLearnError(`Máximo ${MAX_SKILLS} objetivos de aprendizaje.`)
      return
    }

    const skillId = selectedLearnSkillId
    const skillName = learnQuery.trim()

    if (!skillId && !skillName) {
      setLearnError('Selecciona o escribe un objetivo.')
      return
    }

    setBusyLearn(true)
    try {
      const created = await addLearnGoal({
        skill_id: skillId || undefined,
        skill_name: skillId ? undefined : skillName,
        level: learnLevel,
      })
      setLearnGoals((prev) => [...prev, created])
      setLearnQuery('')
      setSelectedLearnSkillId('')
    } catch (err) {
      setLearnError(
        err instanceof Error ? err.message : 'No se pudo agregar el objetivo.',
      )
    } finally {
      setBusyLearn(false)
    }
  }

  async function handleRemoveTeach(id: string) {
    setTeachError('')
    setRemovingId(id)
    try {
      await removeTeachSkill(id)
      setTeachSkills((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      setTeachError(
        err instanceof Error ? err.message : 'No se pudo eliminar la habilidad.',
      )
    } finally {
      setRemovingId(null)
    }
  }

  async function handleRemoveLearn(id: string) {
    setLearnError('')
    setRemovingId(id)
    try {
      await removeLearnGoal(id)
      setLearnGoals((prev) => prev.filter((g) => g.id !== id))
    } catch (err) {
      setLearnError(
        err instanceof Error ? err.message : 'No se pudo eliminar el objetivo.',
      )
    } finally {
      setRemovingId(null)
    }
  }

  async function handleContinue() {
    setContinueError('')
    setContinueSuccess('')

    if (teachSkills.length < MIN_SKILLS) {
      setContinueError('Agrega al menos una habilidad para enseñar.')
      return
    }
    if (learnGoals.length < MIN_SKILLS) {
      setContinueError('Agrega al menos un objetivo de aprendizaje.')
      return
    }

    setBusyContinue(true)
    setContinueSuccess('Perfil de habilidades guardado correctamente.')
    setBusyContinue(false)
    onComplete?.()
  }

  if (loading) {
    return (
      <div className="skills-editor-loading">
        <p>Cargando habilidades…</p>
      </div>
    )
  }

  return (
    <div className="skills-editor">
      <section className="skills-section">
        <div className="skills-section-header">
          <h3>¿Qué puedes enseñar?</h3>
          <span className="skills-counter" aria-live="polite">
            {teachSkills.length}/{MAX_SKILLS}
          </span>
        </div>

        <div className="skills-chips">
          {teachSkills.length === 0 ? (
            <p className="skills-empty">
              Agrega al menos una habilidad para comenzar.
            </p>
          ) : (
            teachSkills.map((item) => (
              <SkillChip
                key={item.id}
                name={item.skill.name}
                level={item.level}
                variant="teach"
                onRemove={() => handleRemoveTeach(item.id)}
                removing={removingId === item.id}
              />
            ))
          )}
        </div>

        {teachSkills.length < MAX_SKILLS ? (
          <div className="skills-add-form">
            <label className="field-label" htmlFor="teach-skill-select">
              Habilidad
            </label>
            <div className="skills-input-row">
              <input
                id="teach-skill-select"
                list="teach-skill-catalog"
                className="skills-text-input"
                placeholder="Buscar en el catálogo…"
                value={teachQuery}
                onChange={(e) => {
                  setTeachQuery(e.target.value)
                  const match = catalog.find(
                    (s) =>
                      s.name.toLowerCase() === e.target.value.trim().toLowerCase(),
                  )
                  setSelectedTeachSkillId(match?.id ?? '')
                }}
                disabled={busyTeach}
              />
              <datalist id="teach-skill-catalog">
                {teachOptions.map((skill) => (
                  <option key={skill.id} value={skill.name} />
                ))}
              </datalist>
            </div>

            <label className="field-label" htmlFor="teach-level">
              Nivel
            </label>
            <select
              id="teach-level"
              className="skills-level-select"
              value={teachLevel}
              onChange={(e) => setTeachLevel(e.target.value as TeachLevel)}
              disabled={busyTeach}
            >
              {TEACH_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {TEACH_LEVEL_LABELS[level]}
                </option>
              ))}
            </select>

            <AuthNotice variant="error" message={teachError} />

            <button
              type="button"
              className="skills-add-btn"
              onClick={handleAddTeach}
              disabled={busyTeach}
            >
              {busyTeach ? 'Agregando…' : 'Agregar habilidad'}
            </button>
          </div>
        ) : null}
      </section>

      <section className="skills-section">
        <div className="skills-section-header">
          <h3>¿Qué quieres aprender?</h3>
          <span className="skills-counter" aria-live="polite">
            {learnGoals.length}/{MAX_SKILLS}
          </span>
        </div>

        <div className="skills-chips">
          {learnGoals.length === 0 ? (
            <p className="skills-empty">
              Agrega al menos un objetivo de aprendizaje.
            </p>
          ) : (
            learnGoals.map((item) => (
              <SkillChip
                key={item.id}
                name={item.skill.name}
                level={item.level}
                variant="learn"
                onRemove={() => handleRemoveLearn(item.id)}
                removing={removingId === item.id}
              />
            ))
          )}
        </div>

        {learnGoals.length < MAX_SKILLS ? (
          <div className="skills-add-form">
            <label className="field-label" htmlFor="learn-skill-select">
              Objetivo
            </label>
            <div className="skills-input-row">
              <input
                id="learn-skill-select"
                list="learn-skill-catalog"
                className="skills-text-input"
                placeholder="Buscar en el catálogo…"
                value={learnQuery}
                onChange={(e) => {
                  setLearnQuery(e.target.value)
                  const match = catalog.find(
                    (s) =>
                      s.name.toLowerCase() === e.target.value.trim().toLowerCase(),
                  )
                  setSelectedLearnSkillId(match?.id ?? '')
                }}
                disabled={busyLearn}
              />
              <datalist id="learn-skill-catalog">
                {learnOptions.map((skill) => (
                  <option key={skill.id} value={skill.name} />
                ))}
              </datalist>
            </div>

            <label className="field-label" htmlFor="learn-level">
              Nivel
            </label>
            <select
              id="learn-level"
              className="skills-level-select"
              value={learnLevel}
              onChange={(e) => setLearnLevel(e.target.value as LearnLevel)}
              disabled={busyLearn}
            >
              {LEARN_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {LEARN_LEVEL_LABELS[level]}
                </option>
              ))}
            </select>

            <AuthNotice variant="error" message={learnError} />

            <button
              type="button"
              className="skills-add-btn skills-add-btn--learn"
              onClick={handleAddLearn}
              disabled={busyLearn}
            >
              {busyLearn ? 'Agregando…' : 'Agregar objetivo'}
            </button>
          </div>
        ) : null}
      </section>

      {showContinueButton ? (
        <div className="skills-continue">
          <AuthNotice variant="success" message={continueSuccess} />
          <AuthNotice variant="error" message={continueError} />
          <button
            type="button"
            className="primary"
            onClick={handleContinue}
            disabled={busyContinue}
          >
            {busyContinue ? 'Guardando…' : continueLabel}
          </button>
        </div>
      ) : null}
    </div>
  )
}
