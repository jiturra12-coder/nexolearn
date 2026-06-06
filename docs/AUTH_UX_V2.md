# NexoLearn — Autenticación UX V2

**Fecha:** 2026-06-05  
**Estado:** Implementado  
**Alcance:** Flujos de registro, inicio de sesión, confirmación de correo y recuperación de contraseña en `frontend/`

---

## 1. Resumen de cambios

Se mejoró la experiencia de autenticación para aumentar confianza, reducir abandono y mejorar la activación de usuarios nuevos. Todos los textos están en español. El diseño mantiene la identidad visual de NexoLearn (azul/morado, dark mode, mobile-first) alineada con Dashboard V2.

### Cambios principales

| Área | Cambio |
|------|--------|
| Contraseña | Toggle mostrar/ocultar con ícono de ojo, accesible en móvil y escritorio |
| Recuperación | Enlace «¿Olvidaste tu contraseña?», `/forgot-password` y `/reset-password` (callback Supabase) |
| Confirmación | Tras registro, pantalla `/confirm-email` en lugar de redirigir al dashboard |
| Notificaciones | Componente visual `AuthNotice` (éxito/error) — sin `alert()` |
| Activación | Indicador de progreso en 4 pasos en registro, confirmación y onboarding |
| Idioma | Interfaz de auth completamente en español |

---

## 2. Archivos modificados y creados

### Nuevos componentes

| Archivo | Descripción |
|---------|-------------|
| `frontend/components/auth/PasswordInput.tsx` | Campo contraseña con botón de ojo (`aria-label`, `aria-pressed`) |
| `frontend/components/auth/AuthNotice.tsx` | Mensajes de éxito, error e info con `role="alert"` / `role="status"` |
| `frontend/components/auth/ActivationProgress.tsx` | Indicador «Paso X de 4» con barra y pasos |
| `frontend/lib/auth-messages.ts` | Traducción de errores Supabase y URL de webmail para «Abrir correo» |

### Páginas

| Archivo | Descripción |
|---------|-------------|
| `frontend/app/login/page.tsx` | Español, toggle contraseña, enlace olvidé contraseña, notificaciones |
| `frontend/app/signup/page.tsx` | Español, toggle, progreso paso 1, redirección a confirmación |
| `frontend/app/forgot-password/page.tsx` | Recuperación con Supabase |
| `frontend/app/reset-password/page.tsx` | **Nuevo** — callback y formulario de nueva contraseña |
| `frontend/app/confirm-email/page.tsx` | **Nuevo** — pantalla post-registro con reenvío |
| `frontend/app/onboarding/page.tsx` | Progreso paso 3, guardia de correo no confirmado |
| `frontend/app/page.tsx` | Texto de carga en español |
| `frontend/app/layout.tsx` | `lang="es"`, metadata NexoLearn |

### Estilos

| Archivo | Descripción |
|---------|-------------|
| `frontend/app/globals.css` | Estilos para notificaciones, toggle contraseña, progreso, confirm-email |

### Documentación

| Archivo | Descripción |
|---------|-------------|
| `docs/AUTH_UX_V2.md` | Este documento |

---

## 3. Flujo de usuario

```mermaid
flowchart TD
    A[Landing /] --> B{¿Sesión activa?}
    B -->|Sí, confirmada| C[Dashboard]
    B -->|No| D[/login]

    D --> E[Iniciar sesión]
    E --> F{¿Credenciales OK?}
    F -->|No confirmado| G[/confirm-email]
    F -->|Error| D
    F -->|OK| C

    D --> H[/signup]
    H --> I[Crear cuenta — Paso 1/4]
    I --> J[/confirm-email — Paso 2/4]
    J --> K[Usuario abre enlace en correo]
    K --> L[/login]
    L --> E
    E --> M[/onboarding — Paso 3/4]
    M --> C

    D --> N[/forgot-password]
    N --> O[Enviar enlace Supabase]
    O --> P[Correo con enlace de reset]
    P --> R[/reset-password]
    R --> S[Guardar nueva contraseña]
    S --> L

    C --> Q[Encontrar conexiones — Paso 4/4]
```

### Paso a paso

1. **Registro (`/signup`)**  
   Usuario ingresa correo y contraseña (con toggle). Al enviar, Supabase crea la cuenta y se redirige a `/confirm-email?email=...`. No se va al dashboard.

2. **Confirmación (`/confirm-email`)**  
   Muestra título «Revisa tu correo electrónico», mensaje de activación y acciones:
   - **Abrir correo** — abre Gmail, Outlook, Yahoo, iCloud, Proton o `mailto:` según dominio
   - **Reenviar correo** — `supabase.auth.resend({ type: 'signup', email })`
   - **Volver al inicio de sesión**

3. **Inicio de sesión (`/login`)**  
   Tras confirmar el correo, el usuario inicia sesión. Si el correo no está confirmado, se redirige a `/confirm-email`. Enlace «¿Olvidaste tu contraseña?» debajo del campo contraseña.

4. **Recuperación (`/forgot-password`)**  
   Campo correo + botón «Enviar enlace de recuperación». Usa `resetPasswordForEmail` con `redirectTo` hacia `/reset-password`.

5. **Restablecer contraseña (`/reset-password`)**  
   Supabase redirige aquí tras el clic en el correo. La página valida el enlace (`PASSWORD_RECOVERY`, `exchangeCodeForSession` o sesión activa), muestra formulario de nueva contraseña con confirmación y toggle de visibilidad. Tras guardar, cierra sesión y redirige a `/login?reset=success` con notificación de éxito.

6. **Onboarding (`/onboarding`)**  
   Paso 3 de 4. Requiere sesión y correo confirmado. Al completar, va al dashboard (paso 4 implícito: encontrar conexiones).

---

## 4. Integración Supabase

| Acción | Método Supabase |
|--------|-----------------|
| Registro | `auth.signUp({ email, password })` |
| Inicio de sesión | `auth.signInWithPassword({ email, password })` |
| Recuperación | `auth.resetPasswordForEmail(email, { redirectTo: '/reset-password' })` |
| Nueva contraseña | `auth.updateUser({ password })` tras evento `PASSWORD_RECOVERY` |
| Intercambio PKCE | `auth.exchangeCodeForSession(code)` si el enlace trae `?code=` |
| Reenviar confirmación | `auth.resend({ type: 'signup', email })` |
| Verificar confirmación | `user.email_confirmed_at` |

**Configuración requerida en Supabase Dashboard:**

- Authentication → URL Configuration: incluir `http://localhost:3000` (y dominio de producción) en Site URL y Redirect URLs.
- Redirect URLs deben incluir explícitamente `http://localhost:3000/reset-password` (y equivalente en producción).
- Email templates habilitados para confirmación y recuperación de contraseña.

---

## 5. Notificaciones visuales

| Contexto | Variante | Mensaje |
|----------|----------|---------|
| Reenvío exitoso | `success` | «Correo de confirmación enviado correctamente.» |
| Reenvío fallido | `error` | «No pudimos enviar el correo de confirmación. Inténtalo nuevamente.» |
| Recuperación enviada | `success` | «Te hemos enviado un enlace para restablecer tu contraseña.» |
| Contraseña actualizada | `success` | «Tu contraseña se actualizó correctamente. Inicia sesión.» |
| Errores de formulario / API | `error` | Mensaje traducido vía `translateAuthError()` |

Los mensajes usan la clase `auth-notice` con variantes `--success`, `--error` y `--info`. No se utiliza `alert()`.

---

## 6. Accesibilidad

- Toggle de contraseña: `aria-label`, `aria-pressed`, `aria-controls`
- Notificaciones: `role="alert"` (error) o `role="status"` (éxito), `aria-live="polite"`
- Progreso de activación: `aria-label` descriptivo en el contenedor
- Contraste y foco visible en botón de ojo (`:focus-visible`)
- Etiquetas `<label>` asociadas a cada campo con `htmlFor`

---

## 7. Criterios de aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Ícono de ojo dentro del campo contraseña en login y signup | ✅ |
| 2 | Alternar contraseña visible/oculta en móvil y escritorio | ✅ |
| 3 | Enlace «¿Olvidaste tu contraseña?» debajo del campo contraseña | ✅ |
| 4 | Ruta `/forgot-password` con título, campo correo y botón de envío | ✅ |
| 5 | Integración Supabase para recuperación de contraseña | ✅ |
| 6 | Tras registro, pantalla de confirmación (no dashboard) | ✅ |
| 7 | Título y mensaje de confirmación según especificación | ✅ |
| 8 | Acciones: Abrir correo, Volver al login, Reenviar confirmación | ✅ |
| 9 | Notificaciones visuales de éxito y error (sin `alert()`) | ✅ |
| 10 | Indicador de progreso 4 pasos en flujo de activación | ✅ |
| 11 | Todo el copy en español | ✅ |
| 12 | Estilo azul/morado, dark mode, mobile-first, coherente con Dashboard V2 | ✅ |
| 13 | Ruta `/reset-password` con formulario y callback Supabase | ✅ |
| 14 | Build de frontend sin errores | Ver sección 8 |

---

## 8. Verificación

```bash
cd frontend
npm run build
```

Revisar manualmente:

1. `/signup` → crear cuenta → llega a `/confirm-email`
2. Reenviar correo muestra notificación de éxito o error
3. `/login` → toggle contraseña y enlace a `/forgot-password`
4. `/forgot-password` → enviar → mensaje de éxito
5. Clic en enlace del correo → `/reset-password` → guardar nueva contraseña → login con mensaje de éxito
6. Usuario no confirmado en login → redirige a confirmación

---

## 9. Próximos pasos sugeridos

- Reemplazar `alert()` restantes en onboarding por `AuthNotice`
- Mostrar paso 4/4 en dashboard para usuarios sin conexiones
- Tests E2E del flujo completo de activación
