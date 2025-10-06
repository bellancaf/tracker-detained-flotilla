// Centralized color configuration for the Flotilla Tracker
// Deep black & neutral tones, removing bluish-gray hues

export const colors = {
  // Background colors
  background: {
    primary: 'bg-neutral-900',        // dark gray instead of pitch black
    secondary: 'bg-neutral-800',
    tertiary: 'bg-neutral-700',
    card: 'bg-neutral-800/90',
    cardSecondary: 'bg-neutral-700/50',
    overlay: 'bg-neutral-900/60',
    transparent: 'bg-transparent'
  },

  // Border colors
  border: {
    primary: 'border-neutral-700',
    secondary: 'border-neutral-600',
    accent: 'border-neutral-700/50',
    subtle: 'border-neutral-700/30'
  },

  // Text colors
  text: {
    primary: 'text-white',
    secondary: 'text-neutral-200',
    tertiary: 'text-neutral-400',
    muted: 'text-neutral-500',
    accent: 'text-green-400'
  },

  // Button colors
  button: {
    primary: 'bg-green-500 hover:bg-green-600 text-white',
    secondary: 'bg-neutral-700 hover:bg-neutral-600 text-white',
    secondaryOutline: 'border border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    outline: 'border border-neutral-700 text-neutral-300 hover:bg-neutral-800'
  },

  // Input colors
  input: {
    background: 'bg-neutral-800',
    border: 'border-neutral-600',
    focus: 'focus:ring-green-500 focus:border-transparent',
    placeholder: 'placeholder-neutral-500'
  },

  // Status colors (Palestine flag colors)
  status: {
    detained: 'bg-red-500 text-white',
    released: 'bg-green-500 text-white',
    missing: 'bg-red-600 text-white',
    safe: 'bg-green-600 text-white',
    default: 'bg-neutral-700 text-white'
  },

  // Table colors
  table: {
    header: 'bg-neutral-800/50',
    row: 'bg-neutral-900/50',
    hover: 'hover:bg-neutral-800/50',
    divider: 'divide-neutral-700',
    border: 'border-neutral-700'
  },

  // Link colors
  link: {
    primary: 'text-green-400 hover:text-green-300',
    secondary: 'text-neutral-400 hover:text-green-400'
  }
}

// Helper function to combine classes
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ')
}
