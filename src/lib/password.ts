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
