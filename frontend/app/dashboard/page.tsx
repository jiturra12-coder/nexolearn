'use client'

import Link from 'next/link'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  fetchLearnGoals,
  fetchTeachSkills,
} from '@/lib/api/skills-client'
import type { LearnGoalItem, TeachSkillItem } from '@/lib/skills-types'
import { SkillChip } from '@/components/skills/SkillChip'
import { UserAvatar } from '@/components/profile/UserAvatar'
import { getGreetingLine } from '@/lib/profile-display'
import {
  fetchUserProfile,
  getFirstName,
  getProfileDisplayName,
  hasProfileName,
  type ProfileBasics,
} from '@/lib/profile'

interface DashboardStats {
  matches: number
  sessions: number
  reviews: number
}

type JourneyStep = 'match' | 'session' | 'review'

function calcProfileCompletion(
  profile: ProfileBasics | null,
  hasAccount: boolean,
  teachCount: number,
  learnCount: number,
): { percent: number; readyToMatch: boolean; missing: string[] } {
  let percent = 0
  const missing: string[] = []

  if (hasAccount) percent += 15
  else missing.push('Cuenta activa')

  if (hasProfileName(profile)) percent += 15
  else missing.push('Nombre en tu perfil')

  if (teachCount > 0) percent += 25
  else missing.push('Al menos una habilidad para enseñar')

  if (learnCount > 0) percent += 25
  else missing.push('Al menos un objetivo de aprendizaje')

  if (profile?.bio?.trim() && profile.bio.trim().length >= 20) percent += 10
  else missing.push('Biografía breve (opcional)')

  percent += 10

  const readyToMatch = hasAccount && teachCount > 0 && learnCount > 0

  return { percent: Math.min(percent, 100), readyToMatch, missing }
}

function getActiveJourneyStep(stats: DashboardStats): JourneyStep {
  if (stats.matches === 0) return 'match'
  if (stats.sessions === 0) return 'session'
  return 'review'
}

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState<ProfileBasics | null>(null)
  const [teachSkills, setTeachSkills] = useState<TeachSkillItem[]>([])
  const [learnGoals, setLearnGoals] = useState<LearnGoalItem[]>([])
  const [stats, setStats] = useState<DashboardStats>({ matches: 0, sessions: 0, reviews: 0 })
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    loadDashboard()

    function onVisible() {
      if (document.visibilityState === 'visible') loadDashboard()
    }

    function onProfileUpdated() {
      loadDashboard()
    }

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('nexolearn:profile-updated', onProfileUpdated)
    window.addEventListener('focus', onProfileUpdated)

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('nexolearn:profile-updated', onProfileUpdated)
      window.removeEventListener('focus', onProfileUpdated)
    }
  }, [])

  async function loadDashboard() {
    const { data: authData } = await supabase.auth.getUser()

    if (!authData.user) {
      router.replace('/login')
      return
    }

    const userId = authData.user.id
    setEmail(authData.user.email ?? '')

    const profileData = await fetchUserProfile(userId)
    setProfile(profileData)

    try {
      const [teachData, goalsData] = await Promise.all([
        fetchTeachSkills(),
        fetchLearnGoals(),
      ])
      setTeachSkills(teachData)
      setLearnGoals(goalsData)
    } catch {
      setTeachSkills([])
      setLearnGoals([])
    }

    let matchCount = 0
    const { count } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

    if (count !== null) matchCount = count

    setStats({
      matches: matchCount,
      sessions: 0,
      reviews: 0,
    })

    setLoading(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const completion = useMemo(
    () =>
      calcProfileCompletion(
        profile,
        !!email,
        teachSkills.length,
        learnGoals.length,
      ),
    [profile, email, teachSkills.length, learnGoals.length],
  )
  const displayName = getProfileDisplayName(profile)
  const greetingLine = getGreetingLine(
    displayName ? getFirstName(displayName) : null,
  )
  const journeyStep = getActiveJourneyStep(stats)

  const nextAction = useMemo(() => {
    if (!completion.readyToMatch) {
      return {
        title: 'Completa tu perfil',
        body: 'Necesitamos saber qué puedes enseñar y qué quieres aprender para conectarte con la persona adecuada.',
        cta: 'Completar perfil',
        href: '/onboarding',
        secondary: null as string | null,
        secondaryHref: null as string | null,
      }
    }
    if (stats.matches === 0) {
      return {
        title: 'Busca tu primera conexión',
        body: 'Ya declaraste tus habilidades. El siguiente paso es encontrar un par con intereses complementarios.',
        cta: 'Ver conexiones',
        href: '/matches',
        secondary: 'Editar perfil',
        secondaryHref: '/onboarding',
      }
    }
    if (stats.sessions === 0) {
      return {
        title: 'Agenda tu primer intercambio',
        body: 'Tienes una conexión. Programa una sesión breve para enseñar y aprender en reciprocidad.',
        cta: 'Ver sesiones',
        href: '/sessions',
        secondary: 'Ver conexiones',
        secondaryHref: '/matches',
      }
    }
    return {
      title: 'Sigue construyendo reputación',
      body: 'Completa tus sesiones y deja reseñas honestas para fortalecer tu perfil de confianza.',
      cta: 'Ver sesiones',
      href: '/sessions',
      secondary: null,
      secondaryHref: null,
    }
  }, [completion.readyToMatch, stats])

  if (loading) {
    return (
      <div className="dash-v2 dash-v2--loading">
        <p>Cargando tu panel...</p>
      </div>
    )
  }

  return (
    <div className="dash-v2">
      <header className="dash-topbar">
        <Link href="/dashboard" className="dash-brand">
          NexoLearn
        </Link>
        <button
          type="button"
          className="dash-menu-btn"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-label="Menú"
        >
          ☰
        </button>
        {menuOpen && (
          <div className="dash-menu">
            <div className="dash-menu-user">
              <UserAvatar
                size="sm"
                name={displayName}
                email={email}
                imageUrl={profile?.avatar_url}
              />
              <div>
                <p className="dash-menu-name">{displayName ?? 'Tu perfil'}</p>
                <p className="dash-menu-email">{email}</p>
              </div>
            </div>
            <Link href="/onboarding" className="dash-menu-link" onClick={() => setMenuOpen(false)}>
              Editar perfil
            </Link>
            <button type="button" className="dash-menu-link dash-menu-signout" onClick={signOut}>
              Cerrar sesión
            </button>
          </div>
        )}
      </header>

      <main className="dash-main">
        <section className="dash-intro card">
          <p className="dash-eyebrow">Tu espacio de intercambio</p>
          <div className="dash-profile-hero">
            <UserAvatar
              size="lg"
              name={displayName}
              email={email}
              imageUrl={profile?.avatar_url}
            />
            <div className="dash-profile-identity">
              <h1>{displayName ?? 'Bienvenido 👋'}</h1>
              {displayName ? (
                <>
                  <p className="dash-profile-greeting">{greetingLine}</p>
                  <p className="dash-profile-email">{email}</p>
                </>
              ) : (
                <p className="dash-profile-hint">
                  <Link href="/onboarding" className="dash-link">
                    Agrega tu nombre y foto
                  </Link>
                </p>
              )}
            </div>
            <span
              className="dash-greeting-pct"
              aria-label={`Perfil ${completion.percent}% completo`}
            >
              {completion.percent}%
            </span>
          </div>
          <div className="dash-intro-profile">
            <div className="dash-intro-skill-group">
              <p className="dash-intro-label">Enseño</p>
              {teachSkills.length > 0 ? (
                <div className="skills-chips dash-intro-chips">
                  {teachSkills.map((item) => (
                    <SkillChip
                      key={item.id}
                      name={item.skill.name}
                      level={item.level}
                      variant="teach"
                    />
                  ))}
                </div>
              ) : (
                <p className="dash-intro-empty">
                  Agrega al menos una habilidad para comenzar.
                </p>
              )}
            </div>
            <div className="dash-intro-skill-group">
              <p className="dash-intro-label">Aprendo</p>
              {learnGoals.length > 0 ? (
                <div className="skills-chips dash-intro-chips">
                  {learnGoals.map((item) => (
                    <SkillChip
                      key={item.id}
                      name={item.skill.name}
                      level={item.level}
                      variant="learn"
                    />
                  ))}
                </div>
              ) : (
                <p className="dash-intro-empty">
                  Agrega al menos un objetivo de aprendizaje.
                </p>
              )}
            </div>
          </div>
          <p className="dash-lead">
            <strong>NexoLearn</strong> conecta personas que quieren{' '}
            <strong>enseñar</strong> y <strong>aprender</strong> en sesiones
            recíprocas. Aquí construyes <strong>reputación</strong> con intercambios
            reales y <strong>conexiones</strong> con pares afines.
          </p>
          <p className="dash-status">
            {stats.matches === 0 && stats.sessions === 0 && stats.reviews === 0 ? (
              <>
                Aún no tienes conexiones, sesiones ni reseñas. Es normal al
                empezar.
              </>
            ) : (
              <>
                {stats.matches} conexión{stats.matches !== 1 ? 'es' : ''} ·{' '}
                {stats.sessions} sesión{stats.sessions !== 1 ? 'es' : ''} ·{' '}
                {stats.reviews} reseña{stats.reviews !== 1 ? 's' : ''}
              </>
            )}
          </p>
        </section>

        <section className="dash-mission card main-card">
          <h2>Tu primera misión</h2>
          <p>
            Completa un ciclo completo: <strong>conectar</strong> con alguien
            compatible, realizar una <strong>sesión</strong> de intercambio y
            dejar una <strong>reseña</strong> que sume a tu reputación.
          </p>
          <ul className="dash-mission-list">
            <li>1. Encuentra un par que complemente lo que enseñas y aprendes.</li>
            <li>2. Acuerda una sesión corta (30–60 min) por videollamada.</li>
            <li>3. Evalúa la experiencia: tu confianza en la plataforma crece con cada intercambio verificado.</li>
          </ul>
        </section>

        <section className="dash-next card">
          <p className="dash-section-label">Próximo paso recomendado</p>
          <h2>{nextAction.title}</h2>
          <p>{nextAction.body}</p>
          <Link href={nextAction.href} className="dash-cta-primary">
            {nextAction.cta}
          </Link>
          {nextAction.secondary && nextAction.secondaryHref && (
            <Link href={nextAction.secondaryHref} className="dash-cta-secondary">
              {nextAction.secondary}
            </Link>
          )}
        </section>

        <section className="dash-path card">
          <h2>Tu camino en NexoLearn</h2>
          <ol className="dash-journey">
            <li className={journeyStep === 'match' ? 'is-active' : stats.matches > 0 ? 'is-done' : ''}>
              <span className="dash-journey-icon" aria-hidden="true">
                {stats.matches > 0 ? '✓' : '1'}
              </span>
              <div>
                <strong>Conexión</strong>
                <p>
                  {stats.matches > 0
                    ? `Tienes ${stats.matches} conexión${stats.matches !== 1 ? 'es' : ''}.`
                    : 'Encuentra a alguien con habilidades complementarias.'}
                </p>
              </div>
            </li>
            <li
              className={
                journeyStep === 'session'
                  ? 'is-active'
                  : stats.sessions > 0
                    ? 'is-done'
                    : 'is-locked'
              }
            >
              <span className="dash-journey-icon" aria-hidden="true">
                {stats.sessions > 0 ? '✓' : '2'}
              </span>
              <div>
                <strong>Sesión</strong>
                <p>
                  {stats.sessions > 0
                    ? `${stats.sessions} sesión${stats.sessions !== 1 ? 'es' : ''} registrada${stats.sessions !== 1 ? 's' : ''}.`
                    : 'Programa y realiza tu primer intercambio.'}
                </p>
              </div>
            </li>
            <li
              className={
                journeyStep === 'review'
                  ? 'is-active'
                  : stats.reviews > 0
                    ? 'is-done'
                    : 'is-locked'
              }
            >
              <span className="dash-journey-icon" aria-hidden="true">
                {stats.reviews > 0 ? '✓' : '3'}
              </span>
              <div>
                <strong>Reputación</strong>
                <p>
                  {stats.reviews > 0
                    ? `${stats.reviews} reseña${stats.reviews !== 1 ? 's' : ''} publicada${stats.reviews !== 1 ? 's' : ''}.`
                    : 'Deja feedback después de completar una sesión.'}
                </p>
              </div>
            </li>
          </ol>
        </section>

        <div className="dash-dual">
          <section className="card dash-teach">
            <h2>Enseñar</h2>
            <p className="dash-section-desc">Lo que puedes ofrecer a otros.</p>
            {teachSkills.length > 0 ? (
              <div className="skills-chips">
                {teachSkills.map((item) => (
                  <SkillChip
                    key={item.id}
                    name={item.skill.name}
                    level={item.level}
                    variant="teach"
                  />
                ))}
              </div>
            ) : (
              <p className="dash-empty">
                Agrega al menos una habilidad para comenzar.
              </p>
            )}
            <p className="dash-meta">0 sesiones como anfitrión</p>
            <Link href="/onboarding" className="dash-link">
              {teachSkills.length > 0 ? 'Editar habilidades' : 'Agregar habilidades'}
            </Link>
          </section>

          <section className="card dash-learn">
            <h2>Aprender</h2>
            <p className="dash-section-desc">Lo que quieres desarrollar.</p>
            {learnGoals.length > 0 ? (
              <div className="skills-chips">
                {learnGoals.map((item) => (
                  <SkillChip
                    key={item.id}
                    name={item.skill.name}
                    level={item.level}
                    variant="learn"
                  />
                ))}
              </div>
            ) : (
              <p className="dash-empty">
                Agrega al menos un objetivo de aprendizaje.
              </p>
            )}
            <p className="dash-meta">0 sesiones como aprendiz</p>
            <Link href="/onboarding" className="dash-link">
              {learnGoals.length > 0 ? 'Editar objetivos' : 'Agregar objetivos'}
            </Link>
          </section>
        </div>

        <div className="dash-trust-row">
          <section className="card dash-reputation">
            <h2>Reputación</h2>
            <p className="dash-trust-value">Miembro nuevo</p>
            <p className="dash-trust-detail">
              {stats.reviews === 0
                ? 'Sin reseñas aún. Tu puntuación aparecerá después de tu primer intercambio.'
                : `${stats.reviews} reseña${stats.reviews !== 1 ? 's' : ''} recibida${stats.reviews !== 1 ? 's' : ''}`}
            </p>
          </section>

          <section className="card dash-connections">
            <h2>Conexiones</h2>
            <p className="dash-trust-value">{stats.matches}</p>
            <p className="dash-trust-detail">
              {stats.matches === 0
                ? 'Ninguna conexión activa. Empieza buscando pares compatibles.'
                : `Tienes ${stats.matches} conexión${stats.matches !== 1 ? 'es' : ''} en la red.`}
            </p>
            <Link href="/matches" className="dash-link">
              Ver conexiones
            </Link>
          </section>
        </div>

        {completion.percent < 100 && (
          <section className="card dash-profile-progress">
            <div className="dash-progress-header">
              <h2>Perfil {completion.percent}% completo</h2>
              {!completion.readyToMatch && (
                <span className="dash-badge">Pendiente</span>
              )}
            </div>
            <div className="dash-progress-bar" role="progressbar" aria-valuenow={completion.percent} aria-valuemin={0} aria-valuemax={100}>
              <div className="dash-progress-fill" style={{ width: `${completion.percent}%` }} />
            </div>
            {completion.missing.length > 0 && (
              <ul className="dash-checklist">
                {completion.missing.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            <Link href="/onboarding" className="dash-cta-secondary">
              Terminar perfil
            </Link>
          </section>
        )}

        <div className="dash-quick">
          <Link href="/matches" className="card dash-quick-card">
            <h3>Conexiones</h3>
            <p>{stats.matches === 0 ? 'Sin conexiones todavía' : `${stats.matches} activa${stats.matches !== 1 ? 's' : ''}`}</p>
          </Link>
          <Link href="/sessions" className="card dash-quick-card">
            <h3>Sesiones</h3>
            <p>{stats.sessions === 0 ? 'Nada programado aún' : `${stats.sessions} programada${stats.sessions !== 1 ? 's' : ''}`}</p>
          </Link>
        </div>
      </main>

      <nav className="dash-bottom-nav" aria-label="Navegación principal">
        <Link href="/dashboard" className="is-active">
          Inicio
        </Link>
        <Link href="/matches">Conexiones</Link>
        <Link href="/sessions">Sesiones</Link>
      </nav>

      <aside className="dash-sidebar" aria-label="Navegación lateral">
        <p className="dash-sidebar-brand">NexoLearn</p>
        <div className="dash-sidebar-user">
          <UserAvatar
            size="md"
            name={displayName}
            email={email}
            imageUrl={profile?.avatar_url}
          />
          <div>
            <p className="dash-sidebar-name">{displayName ?? 'Tu perfil'}</p>
            <p className="dash-sidebar-email">{email}</p>
          </div>
        </div>
        <nav>
          <Link href="/dashboard" className="is-active">
            Inicio
          </Link>
          <Link href="/matches">Conexiones</Link>
          <Link href="/sessions">Sesiones</Link>
          <Link href="/onboarding">Perfil</Link>
        </nav>
        <button type="button" className="dash-sidebar-signout" onClick={signOut}>
          Cerrar sesión
        </button>
      </aside>
    </div>
  )
}
