export interface PasswordStrengthState {
  score: number
  label: string
  hint: string
  progress: number
  barClass: string
  textClass: string
  evaluated: boolean
}

export function evaluatePasswordStrength(value: string): PasswordStrengthState {
  if (!value) {
    return {
      score: 0,
      label: 'Waiting for input',
      hint: 'Start typing a password to see strength guidance.',
      progress: 0,
      barClass: 'bg-slate-300 dark:bg-slate-700',
      textClass: 'text-slate-500 dark:text-slate-400',
      evaluated: false,
    }
  }

  let score = 0

  if (value.length >= 8) {
    score += 1
  }

  if (value.length >= 12) {
    score += 1
  }

  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) {
    score += 1
  }

  if (/\d/.test(value)) {
    score += 1
  }

  if (/[^A-Za-z0-9]/.test(value)) {
    score += 1
  }

  const bounded = Math.min(score, 4)

  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
  const hints = [
    'Use at least 12 characters and mix numbers and symbols.',
    'Add more unique characters to improve security.',
    'Try including uppercase letters, numbers, and symbols.',
    'Looks solid — consider a longer phrase for extra safety.',
    'Great job! Keep this password unique to this account.',
  ]
  const barClasses = [
    'bg-red-500 dark:bg-red-600',
    'bg-orange-500 dark:bg-orange-600',
    'bg-amber-500 dark:bg-amber-600',
    'bg-emerald-500 dark:bg-emerald-600',
    'bg-green-600 dark:bg-green-500',
  ]
  const textClasses = [
    'text-red-600 dark:text-red-400',
    'text-orange-600 dark:text-orange-400',
    'text-amber-600 dark:text-amber-400',
    'text-emerald-600 dark:text-emerald-400',
    'text-green-600 dark:text-green-400',
  ]

  const progress = Math.max(25, bounded * 25)

  return {
    score: bounded,
    label: labels[bounded],
    hint: hints[bounded],
    progress,
    barClass: barClasses[bounded],
    textClass: textClasses[bounded],
    evaluated: true,
  }
}
