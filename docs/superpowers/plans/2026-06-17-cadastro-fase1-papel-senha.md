# Cadastro Fase 1 — Seleção de papel + UX de senha (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No `/cadastro`, o usuário escolhe o papel (babá / estabelecimento / usuário comum), confirma a senha e vê um medidor de força que força um nível mínimo; a conta é criada com o papel correto.

**Architecture:** Função pura de força de senha (testável) + schema Zod estendido + Server Action de registro ajustada + UI client com seletor de papel, confirmação de senha e medidor. Sem mudança de banco (o enum `Role` e `User.role` já existem).

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, Zod v4, next-auth v5 (credentials), bcryptjs, vitest. Gerenciador: **npm**.

## Global Constraints

- Todo texto de UI em **português (PT-BR)**.
- Testes com **vitest**; rodar com `npm run test`.
- Valores do enum `Role` (Prisma) exatos: `CUSTOMER`, `BABA`, `ESTABLISHMENT_OWNER`, `ADMIN`.
- Senha: mínimo de 8 caracteres (regra já existente) **e** força mínima de score `>= 3` (ver Task 1).
- Seguir o padrão existente: Server Action em `actions.ts` + `useActionState` na página (ver `src/app/cadastro/`).
- Após cadastro, este plano redireciona **todos** os papéis para `/`. O redirecionamento de babá/estabelecimento para o painel é introduzido no plano da Fase 2/3.

---

### Task 1: Função pura de força de senha

**Files:**
- Create: `src/lib/password.ts`
- Test: `src/lib/password.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `type PasswordScore = 0 | 1 | 2 | 3 | 4`
  - `type PasswordStrength = { score: PasswordScore; label: string }`
  - `function passwordStrength(pw: string): PasswordStrength`
  - `const MIN_PASSWORD_SCORE = 3`
  - Labels por score: `0` "muito fraca", `1` "fraca", `2` "média", `3` "forte", `4` "muito forte".
  - Critérios (cada um soma 1, máx 4): comprimento `>= 8`; tem minúscula **e** maiúscula; tem dígito; tem símbolo (`/[^A-Za-z0-9]/`).

- [ ] **Step 1: Escrever os testes que falham**

```ts
// src/lib/password.test.ts
import { describe, expect, it } from 'vitest'
import { passwordStrength, MIN_PASSWORD_SCORE } from './password'

describe('passwordStrength', () => {
  it('senha vazia é muito fraca (score 0)', () => {
    expect(passwordStrength('')).toEqual({ score: 0, label: 'muito fraca' })
  })

  it('só letras minúsculas curtas é fraca', () => {
    expect(passwordStrength('abc')).toEqual({ score: 0, label: 'muito fraca' })
  })

  it('8+ minúsculas soma 1 (fraca)', () => {
    expect(passwordStrength('abcdefgh')).toEqual({ score: 1, label: 'fraca' })
  })

  it('8+ com maiúscula+minúscula soma 2 (média)', () => {
    expect(passwordStrength('abcdEFGH')).toEqual({ score: 2, label: 'média' })
  })

  it('8+ com maiúscula, minúscula e dígito soma 3 (forte)', () => {
    expect(passwordStrength('abcdEF12')).toEqual({ score: 3, label: 'forte' })
  })

  it('8+ com tudo (símbolo) soma 4 (muito forte)', () => {
    expect(passwordStrength('abcEF12!@')).toEqual({ score: 4, label: 'muito forte' })
  })

  it('MIN_PASSWORD_SCORE é 3', () => {
    expect(MIN_PASSWORD_SCORE).toBe(3)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test -- src/lib/password.test.ts`
Expected: FAIL ("Cannot find module './password'" / `passwordStrength is not a function`).

- [ ] **Step 3: Implementar**

```ts
// src/lib/password.ts
export type PasswordScore = 0 | 1 | 2 | 3 | 4
export type PasswordStrength = { score: PasswordScore; label: string }

export const MIN_PASSWORD_SCORE = 3

const LABELS = ['muito fraca', 'fraca', 'média', 'forte', 'muito forte'] as const

export function passwordStrength(pw: string): PasswordStrength {
  let score = 0
  if (pw.length >= 8) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const s = score as PasswordScore
  return { score: s, label: LABELS[s] }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm run test -- src/lib/password.test.ts`
Expected: PASS (7 testes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/password.ts src/lib/password.test.ts
git commit -m "feat(cadastro): função pura de força de senha"
```

---

### Task 2: Estender o registerSchema (papel + confirmação + força mínima)

**Files:**
- Modify: `src/lib/validators.ts:3-7` (registerSchema) e exports
- Test: `src/lib/validators.test.ts` (adicionar casos)

**Interfaces:**
- Consumes: `passwordStrength`, `MIN_PASSWORD_SCORE` de Task 1.
- Produces:
  - `const profileRoleValues = ['CUSTOMER', 'BABA', 'ESTABLISHMENT_OWNER'] as const`
  - `registerSchema` agora exige `role` (um de `profileRoleValues`), `confirmPassword`, e valida `password === confirmPassword` + `passwordStrength(password).score >= MIN_PASSWORD_SCORE`.
  - `type RegisterInput = z.infer<typeof registerSchema>` (inclui `role`, `confirmPassword`).

- [ ] **Step 1: Escrever os testes que falham**

```ts
// adicionar em src/lib/validators.test.ts
import { passwordStrength } from './password' // garante import disponível se necessário

describe('registerSchema (papel + senha)', () => {
  const base = {
    name: 'Ana',
    email: 'a@b.com',
    password: 'abcdEF12',      // score 3 (forte)
    confirmPassword: 'abcdEF12',
    role: 'BABA' as const,
  }

  it('aceita payload válido com papel e confirmação', () => {
    expect(registerSchema.safeParse(base).success).toBe(true)
  })

  it('rejeita quando a confirmação não bate', () => {
    const r = registerSchema.safeParse({ ...base, confirmPassword: 'outraCoisa1' })
    expect(r.success).toBe(false)
  })

  it('rejeita senha com força abaixo do mínimo', () => {
    const r = registerSchema.safeParse({
      ...base,
      password: 'abcdefgh',        // score 1
      confirmPassword: 'abcdefgh',
    })
    expect(r.success).toBe(false)
  })

  it('rejeita papel inválido', () => {
    const r = registerSchema.safeParse({ ...base, role: 'ADMIN' })
    expect(r.success).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test -- src/lib/validators.test.ts`
Expected: FAIL (campos `role`/`confirmPassword` ainda não existem; payload com confirmação extra é ignorado e validação de força ausente).

- [ ] **Step 3: Implementar**

```ts
// src/lib/validators.ts
import { z } from 'zod'
import { passwordStrength, MIN_PASSWORD_SCORE } from './password'

export const profileRoleValues = ['CUSTOMER', 'BABA', 'ESTABLISHMENT_OWNER'] as const

export const registerSchema = z
  .object({
    name: z.string().min(1, 'Nome obrigatório').max(100),
    email: z.email('Email inválido'),
    password: z
      .string()
      .min(8, 'Senha deve ter ao menos 8 caracteres')
      .refine((pw) => passwordStrength(pw).score >= MIN_PASSWORD_SCORE, {
        message: 'Senha muito fraca: use maiúsculas, minúsculas e números (ou símbolos).',
      }),
    confirmPassword: z.string(),
    role: z.enum(profileRoleValues),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm run test -- src/lib/validators.test.ts`
Expected: PASS (casos antigos de `loginSchema` continuam; os 4 novos passam). Nota: os testes antigos de `registerSchema` que passavam só com `{name,email,password}` agora falham por faltar `role`/`confirmPassword` — atualize-os no mesmo passo adicionando `role: 'CUSTOMER'` e `confirmPassword` igual à senha, e troque `password: 'secret12'` por `password: 'abcdEF12'` (força >= 3).

- [ ] **Step 5: Commit**

```bash
git add src/lib/validators.ts src/lib/validators.test.ts
git commit -m "feat(cadastro): schema com papel, confirmação e força mínima de senha"
```

---

### Task 3: Server Action de registro com papel

**Files:**
- Modify: `src/app/cadastro/actions.ts`

**Interfaces:**
- Consumes: `registerSchema` (Task 2), `profileRoleValues`.
- Produces: `register(_prev, formData)` lê `name,email,password,confirmPassword,role` do `FormData`, cria o `User` com `role` validado e faz login.

- [ ] **Step 1: Implementar a action**

```ts
// src/app/cadastro/actions.ts
'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signIn } from '@/lib/auth'
import { registerSchema } from '@/lib/validators'

export type RegisterState = { error?: string }

export async function register(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    role: formData.get('role'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }
  const { name, email, password, role } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: 'Email já cadastrado' }

  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: { name, email, passwordHash, role },
  })

  await signIn('credentials', { email, password, redirect: false })
  redirect('/')
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exit 0 (sem erros).

- [ ] **Step 3: Commit**

```bash
git add src/app/cadastro/actions.ts
git commit -m "feat(cadastro): criar usuário com o papel escolhido"
```

---

### Task 4: UI do cadastro (papel, confirmação e medidor de força)

**Files:**
- Modify: `src/app/cadastro/page.tsx`
- Modify: `src/app/cadastro/auth.css` (estilos do medidor e do seletor de papel)

**Interfaces:**
- Consumes: `register`, `RegisterState` (Task 3); `passwordStrength` (Task 1).
- Produces: formulário com `role` (radios), `password`, `confirmPassword`, medidor de força ao vivo.

- [ ] **Step 1: Implementar a página**

```tsx
// src/app/cadastro/page.tsx
'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { register, type RegisterState } from './actions'
import { passwordStrength, MIN_PASSWORD_SCORE } from '@/lib/password'
import './auth.css'

const ROLE_OPTIONS = [
  { value: 'CUSTOMER', label: 'Usuário comum' },
  { value: 'BABA', label: 'Babá' },
  { value: 'ESTABLISHMENT_OWNER', label: 'Estabelecimento' },
] as const

export default function CadastroPage() {
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(register, {})
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState<string>('CUSTOMER')

  const strength = passwordStrength(password)
  const strongEnough = strength.score >= MIN_PASSWORD_SCORE
  const matches = confirm.length === 0 || confirm === password

  return (
    <main className="page auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Cadastre-se</h1>
        <p className="auth-card__lead">Crie sua conta na Pet Stop</p>
        <form className="auth-form" action={formAction}>
          <fieldset className="auth-roles">
            <legend className="auth-label">Tipo de perfil</legend>
            {ROLE_OPTIONS.map((o) => (
              <label key={o.value} className="auth-role">
                <input
                  type="radio"
                  name="role"
                  value={o.value}
                  checked={role === o.value}
                  onChange={() => setRole(o.value)}
                />
                <span>{o.label}</span>
              </label>
            ))}
          </fieldset>

          <label className="auth-label">
            Nome
            <input type="text" name="name" className="auth-input" placeholder="Seu nome" required />
          </label>
          <label className="auth-label">
            E-mail
            <input type="email" name="email" className="auth-input" placeholder="seu@email.com" required />
          </label>
          <label className="auth-label">
            Senha
            <input
              type="password"
              name="password"
              className="auth-input"
              placeholder="••••••••"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {password.length > 0 && (
            <div className="auth-strength" aria-live="polite">
              <div className={`auth-strength__bar auth-strength__bar--${strength.score}`} />
              <span className="auth-strength__label">Força: {strength.label}</span>
            </div>
          )}

          <label className="auth-label">
            Confirmar senha
            <input
              type="password"
              name="confirmPassword"
              className="auth-input"
              placeholder="••••••••"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
          {!matches && <p className="auth-error" role="alert">As senhas não coincidem</p>}

          {state.error && <p className="auth-error" role="alert">{state.error}</p>}
          <button
            type="submit"
            className="btn btn-green auth-submit"
            disabled={pending || !strongEnough || !matches || confirm.length === 0}
          >
            {pending ? 'Criando…' : 'Criar conta'}
          </button>
        </form>
        <p className="auth-footer">
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>
        <Link href="/" className="auth-back">← Voltar ao início</Link>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Adicionar estilos do medidor e do seletor**

```css
/* anexar em src/app/cadastro/auth.css */
.auth-roles { display: flex; flex-direction: column; gap: 0.5rem; border: 0; padding: 0; margin: 0; }
.auth-role { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }

.auth-strength { display: flex; align-items: center; gap: 0.5rem; }
.auth-strength__bar { height: 6px; flex: 1; border-radius: 999px; background: #e5e7eb; transition: background 0.2s, width 0.2s; }
.auth-strength__bar--0 { background: #dc2626; }
.auth-strength__bar--1 { background: #f97316; }
.auth-strength__bar--2 { background: #eab308; }
.auth-strength__bar--3 { background: #22c55e; }
.auth-strength__bar--4 { background: #16a34a; }
.auth-strength__label { font-size: 0.8rem; color: #6b7280; white-space: nowrap; }
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exit 0.

- [ ] **Step 4: Verificação manual no app**

Run: `npm run dev` e abra `/cadastro`.
Expected:
- Há 3 opções de perfil (Usuário comum / Babá / Estabelecimento).
- Ao digitar a senha, o medidor mostra a força; o botão "Criar conta" só habilita com força >= "forte" e confirmação igual.
- Cadastrar como "Babá" cria a conta e loga (vai para `/`). Confirme no banco que `User.role = 'BABA'`:
  `npx prisma studio` ou consulta rápida.

- [ ] **Step 5: Commit**

```bash
git add src/app/cadastro/page.tsx src/app/cadastro/auth.css
git commit -m "feat(cadastro): seletor de papel, confirmação de senha e medidor de força"
```

---

## Self-Review

**Cobertura do spec (Fase 1) + pedido novo:**
- Seleção de papel (babá/estabelecimento/comum) → Tasks 2, 3, 4. ✓
- `User.role` setado conforme escolha → Task 3. ✓
- Confirmação de senha → Tasks 2 (schema) e 4 (UI). ✓
- Medidor de força + nível mínimo forçado → Tasks 1, 2, 4. ✓
- Sem migração de banco (enum/`role` já existem) → confirmado. ✓

**Itens fora deste plano (próximos planos):**
- Redirecionar babá/estabelecimento para o painel após cadastro (Fase 2/3).
- Áreas de edição de perfil, endereço/CEP, geocoding, upload de foto, `types[]` (Fases 0/2/3).

**Consistência de tipos:** `passwordStrength`/`MIN_PASSWORD_SCORE` (Task 1) usados igual em Tasks 2 e 4; `profileRoleValues` e os valores de `Role` batem com o enum do Prisma; `register`/`RegisterState` mantêm a assinatura usada por `useActionState`.
