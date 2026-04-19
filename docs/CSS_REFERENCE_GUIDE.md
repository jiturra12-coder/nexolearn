# 🎨 CSS Reference Guide

## Quick Navigation

- [Color System](#color-system)
- [Typography](#typography)
- [Components](#components)
- [Layouts](#layouts)
- [Responsive Breakpoints](#responsive-breakpoints)
- [Utilities](#utilities)

---

## Color System

### Primary Colors
```css
--primary: #00ff9c;           /* Main neon green */
--primary-dark: #00cc7d;      /* Darker shade */
--primary-light: #33ffb5;     /* Lighter shade */
```

### Backgrounds
```css
--bg-dark: #0a0a0a;           /* Main dark background */
--bg-secondary: #111111;      /* Slightly lighter */
--bg-tertiary: #1a1a1a;       /* Even lighter */
```

### Text
```css
--text-primary: #ffffff;      /* Main text */
--text-secondary: #b0b0b0;    /* Muted text */
```

### Borders
```css
--border-color: rgba(0, 255, 156, 0.12);      /* Normal */
--border-color-hover: rgba(0, 255, 156, 0.3);  /* Hover */
```

### Shadows
```css
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
--shadow-md: 0 8px 24px rgba(0, 0, 0, 0.4);
```

---

## Typography

### Font Families
```css
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Monospace for code/data */
font-family: 'JetBrains Mono', 'Fira Code', monospace;
```

### Headings
| Element | Size | Weight |
|---------|------|--------|
| h1 | 3.2rem | 700 |
| h2 | 1.8rem - 2.2rem | 600 |
| h3 | 1.05rem - 1.1rem | 600 |

---

## Components

### Buttons

#### Primary Button (.btn-glow)
```html
<button class="btn-glow">Click Me</button>
```
**Properties**: Neon green background, hover glow effect, smooth shadow animation

```css
.btn-glow {
  background: var(--primary);
  color: var(--bg-dark);
  padding: 12px 28px;
  border-radius: 6px;
  /* Hover effect with shadow and transform */
}

.btn-glow:hover {
  box-shadow: 0 0 20px rgba(0, 255, 156, 0.6);
  transform: translateY(-2px);
}
```

#### Secondary Button (.btn-outline)
```html
<button class="btn-outline">Secondary</button>
```
**Properties**: Transparent background, green border, border-color changes on hover

```css
.btn-outline {
  border: 1.5px solid var(--border-color);
  background: transparent;
  color: var(--text-primary);
  padding: 11px 24px;
}

.btn-outline:hover {
  border-color: var(--primary);
  color: var(--primary);
  box-shadow: 0 0 12px rgba(0, 255, 156, 0.2);
}
```

#### Full Width Button
```html
<button class="btn-glow full">Full Width</button>
```
```css
.full {
  width: 100%;
}
```

---

### Cards

#### Basic Card (.card)
```html
<div class="card">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>
```

```css
.card {
  border: 1px solid var(--border-color);
  padding: 32px 24px;
  background: var(--bg-secondary);
  border-radius: 8px;
  transition: var(--transition);
}

.card:hover {
  transform: translateY(-8px);
  border-color: var(--border-color-hover);
  box-shadow: 0 12px 32px rgba(0, 255, 156, 0.1);
}
```

#### Profile Card (.profile-section)
```html
<section class="profile-section">
  <h2>👤 Your Profile</h2>
  <div class="profile-field">
    <label>Email</label>
    <p>user@example.com</p>
  </div>
</section>
```

#### Chat Card (.chat-section)
```html
<section class="chat-section">
  <h2>💬 Live Chat</h2>
  <div class="chat-messages" id="chat">
    <div class="message">Message content</div>
  </div>
  <div class="chat-input-group">
    <input type="text" class="chat-input" />
    <button class="btn-glow">Send</button>
  </div>
</section>
```

#### Match Card (.match-card)
```html
<div class="match-card">
  <h3>User Email</h3>
  <p>
    <span class="status-badge">pending</span>
  </p>
  <a href="https://wa.me/...">📱 Contact</a>
</div>
```

---

### Forms

#### Input Field
```html
<input type="email" placeholder="your@email.com" class="auth-input" />
```

```css
.auth-input {
  width: 100%;
  padding: 14px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: 6px;
}

.auth-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 16px rgba(0, 255, 156, 0.2);
}
```

#### Chat Input
```html
<input type="text" placeholder="Type message..." class="chat-input" />
```

```css
.chat-input {
  flex: 1;
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: 6px;
}

.chat-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 12px rgba(0, 255, 156, 0.2);
}
```

---

### Messages

#### Message Bubble (.message)
```html
<div class="message">
  <div class="message-sender">User</div>
  <div class="message-content">Message text</div>
</div>
```

**Own Message** (add `.own` class):
```html
<div class="message own">...</div>
```

```css
.message {
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border-left: 3px solid var(--border-color);
  border-radius: 6px;
  max-width: 85%;
}

.message.own {
  align-self: flex-end;
  background: rgba(0, 255, 156, 0.1);
  border-left-color: var(--primary);
}
```

---

### Statistics Box (.stat-item)

```html
<div class="stat-item">
  <div class="stat-label">Messages Sent</div>
  <div class="stat-value"><span>42</span></div>
</div>
```

```css
.stat-item {
  background: var(--bg-tertiary);
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid var(--border-color);
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.8rem;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 1.8rem;
  color: var(--primary);
  font-weight: 700;
}
```

---

### Compatibility Bits (.bit)

```html
<div class="bit active" title="Shared Interests">1</div>
<div class="bit inactive">0</div>
```

```css
.bit {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 2px solid var(--border-color);
  font-weight: 600;
  transition: var(--transition);
}

.bit.active {
  background: rgba(0, 255, 156, 0.2);
  color: var(--primary);
  border-color: var(--primary);
  box-shadow: 0 0 12px rgba(0, 255, 156, 0.3);
}

.bit.inactive {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.bit:hover {
  transform: scale(1.1);
}
```

---

## Layouts

### Dashboard Container
```html
<div class="dashboard-container">
  <!-- All content here -->
</div>
```

```css
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 48px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}
```

### Grid Layout (2 columns)
```html
<div class="dashboard-grid">
  <section class="profile-section"><!-- Profile --></section>
  <section class="chat-section"><!-- Chat --></section>
</div>
```

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 1000px) {
  .dashboard-grid {
    grid-template-columns: 1fr;  /* Stack on smaller screens */
  }
}
```

### Matches Grid (Auto-fill)
```html
<div class="matches-grid">
  <div class="match-card"><!-- Match 1 --></div>
  <div class="match-card"><!-- Match 2 --></div>
  <!-- More matches... -->
</div>
```

```css
.matches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
```

### Stats Grid
```html
<div class="messaging-stats">
  <div class="stat-item"><!-- Stat 1 --></div>
  <div class="stat-item"><!-- Stat 2 --></div>
  <!-- More stats... -->
</div>
```

```css
.messaging-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}
```

---

## Responsive Breakpoints

### Large Screens (Default)
```css
/* No media query needed - these are the base styles */
.dashboard-grid {
  grid-template-columns: 1fr 1fr;
}

.messaging-stats {
  grid-template-columns: repeat(4, 1fr);
}
```

### Tablets (≤ 1000px)
```css
@media (max-width: 1000px) {
  .dashboard-grid {
    grid-template-columns: 1fr;  /* Stack vertically */
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 24px;
  }

  .messaging-stats {
    grid-template-columns: repeat(2, 1fr);  /* 2 columns */
  }

  .algorithm-line {
    grid-template-columns: 1fr;  /* Stack all columns */
  }
}
```

### Mobile (≤ 480px)
```css
@media (max-width: 480px) {
  .dashboard-container {
    padding: 16px;
  }

  .messaging-stats {
    grid-template-columns: 1fr;  /* Single column */
  }

  .matches-grid {
    grid-template-columns: 1fr;
  }

  .chat-input-group {
    flex-direction: column;
  }
}
```

---

## Utilities

### Transitions
```css
--transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Use in components: */
.element {
  transition: var(--transition);
}
```

### Flex Container
```css
display: flex;
justify-content: space-between;  /* Spread items apart */
align-items: center;              /* Center vertically */
gap: 24px;                        /* Space between items */
```

### CSS Grid
```css
display: grid;
grid-template-columns: 1fr 1fr;  /* 2 equal columns */
grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));  /* Auto-responsive */
gap: 24px;                       /* Space between items */
```

### Scrollable Container
```css
overflow-y: auto;                /* Enable vertical scroll */
max-height: 500px;               /* Set height limit */

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-thumb {
  background: var(--primary);
  border-radius: 4px;
}
```

### Text Truncation
```css
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
```

### Gradient Text
```css
background: linear-gradient(135deg, #fff 0%, var(--primary) 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
```

### Loading/Empty States
```css
.loading {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  border: 1px dashed var(--border-color);
}
```

---

## Animation Classes

### Fade In Up
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card {
  animation: fadeInUp 0.6s ease-out;
}
```

### Hover Effects
```css
/* Scale on hover */
.element:hover {
  transform: scale(1.05);
}

/* Lift on hover */
.element:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 255, 156, 0.1);
}

/* Glow effect */
.element:hover {
  box-shadow: 0 0 20px rgba(0, 255, 156, 0.6);
}
```

---

## Color Quick Reference

| Color | Usage |
|-------|-------|
| `#00ff9c` | Primary buttons, borders on hover, text highlights |
| `#00cc7d` | Darker shade for active states |
| `#33ffb5` | Lighter shade for text gradients |
| `#0a0a0a` | Main page background |
| `#111111` | Card backgrounds |
| `#1a1a1a` | Input backgrounds, muted cards |
| `#ffffff` | Primary text |
| `#b0b0b0` | Secondary text (labels, placeholders) |

---

## Common Patterns

### Card with Content
```html
<section class="profile-section">
  <h2>📊 Section Title</h2>
  <div class="profile-field">
    <label>Field Label</label>
    <p>Field content</p>
  </div>
</section>
```

### Button Group
```html
<div style="display: flex; gap: 12px;">
  <button class="btn-glow">Primary</button>
  <button class="btn-outline">Secondary</button>
</div>
```

### Stat Display
```html
<div class="stat-item">
  <div class="stat-label">Metric Name</div>
  <div class="stat-value"><span>123</span><span class="stat-unit">%</span></div>
</div>
```

### Message Thread
```html
<div class="chat-messages">
  <div class="message">
    <div class="message-sender">Other User</div>
    <div class="message-content">Message text</div>
  </div>
  <div class="message own">
    <div class="message-sender">You</div>
    <div class="message-content">Your message</div>
  </div>
</div>
```

---

## Debugging Tips

### Check Computed Styles
```javascript
// In browser console:
getComputedStyle(document.querySelector('.stat-item'))
// Shows actual applied styles
```

### Verify CSS Variables
```javascript
getComputedStyle(document.documentElement).getPropertyValue('--primary')
// Shows: ' #00ff9c'
```

### Find Unused Styles
```javascript
// In DevTools: More Tools > Coverage
// Shows which CSS is unused on current page
```

### Test Responsive Design
```
DevTools > Ctrl+Shift+M (or Cmd+Shift+M)
// Toggle device toolbar
// Test at different breakpoints
```

---

**Last Updated**: Today
**Version**: 1.0
**Compatibility**: Modern browsers (Chrome, Firefox, Safari, Edge)
