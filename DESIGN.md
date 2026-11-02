---
name: PawTrail community journal
colors:
  primary: '#F97316'
  primary-dark: '#EA580C'
  teal: '#0F766E'
  green: '#84CC16'
  background: '#FFFBF5'
  surface: '#FFFFFF'
  foreground: '#3B2416'
  muted: '#78716C'
  border: '#EDE5D8'
typography:
  heading:
    fontFamily: 'Nunito, sans-serif'
    fontSize: '2rem'
    fontWeight: 700
    lineHeight: 1.2
  subheading:
    fontFamily: 'Nunito, sans-serif'
    fontSize: '1.25rem'
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: 'Inter, sans-serif'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.6
rounded:
  control: '0.75rem'
spacing:
  field: '0.5rem'
  form: '1.25rem'
  section: '2rem'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.control}'
    height: '2.75rem'
---

# Overview

The approved code-first community journal puts animal stories and useful actions first. Authentication is an Operate surface: readable labels, one clear task, honest demo feedback, and calm space. This early F4 contract covers forms and their required canonical controls only. F6 owns complete navigation, fonts, and system audit.

# Colors

Cream ground, white controls, brown text, orange primary actions and teal focus/link states. Do not use white text on the orange primary action.

# Typography

Nunito headings and Inter body are the pinned font direction. F6 supplies licensed self-hosted assets; current CSS uses the declared families with sans-serif fallback.

# Components

Shadcn-style Button and Input live in src/components/ui, using the Slot/CVA and class merge conventions. Form errors stay beside labeled fields and summaries announce failures. Demo persona controls are absent in real mode.

# Layout

One readable form column, maximum 30rem, with 1.25rem mobile gutters. No decorative imagery is required for authentication. Rendered visual quality has not been verified; only automated checks are authorized.
