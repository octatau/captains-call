/**
 * Centralized theme configuration for topick
 * All color classes should reference these theme utilities
 */

export const theme = {
	// Primary color (Pearl Aqua)
	primary: {
		text: 'text-pearl-aqua-600 dark:text-pearl-aqua-400',
		bg: 'bg-pearl-aqua-600 dark:bg-pearl-aqua-500',
		bgHover: 'hover:bg-pearl-aqua-700 dark:hover:bg-pearl-aqua-600',
		border: 'border-pearl-aqua-600 dark:border-pearl-aqua-500',
		borderHover: 'hover:border-pearl-aqua-400 dark:hover:border-pearl-aqua-500',
		bgLight: 'bg-pearl-aqua-50 dark:bg-pearl-aqua-900/50'
	},

	// Accent color (Jasmine - for captain/special highlights)
	accent: {
		text: 'text-gray-900',
		bg: 'bg-jasmine-500',
		bgHover: 'hover:bg-jasmine-600',
		border: 'border-jasmine-500'
	},

	// Success states (correct picks, drafted items)
	success: {
		text: 'text-pearl-aqua-600 dark:text-pearl-aqua-400',
		bg: 'bg-pearl-aqua-600',
		bgLight: 'bg-pearl-aqua-50 dark:bg-pearl-aqua-900/20',
		border: 'border-pearl-aqua-500'
	},

	// Error states (incorrect picks, missed items)
	error: {
		text: 'text-red-800 dark:text-red-200',
		bg: 'bg-red-600 dark:bg-red-700',
		bgLight: 'bg-red-100 dark:bg-red-900/30',
		border: 'border-red-300 dark:border-red-700'
	},

	// Neutral/gray states
	neutral: {
		text: 'text-gray-600 dark:text-gray-400',
		textStrong: 'text-gray-900 dark:text-white',
		bg: 'bg-gray-400',
		bgLight: 'bg-gray-50 dark:bg-gray-800',
		border: 'border-gray-300 dark:border-gray-600',
		borderHover: 'hover:bg-gray-300 dark:hover:bg-gray-700'
	},

	// Card backgrounds
	card: {
		bg: 'bg-white dark:bg-gray-800',
		border: 'border-gray-200 dark:border-gray-700'
	},

	// Page background
	page: {
		bg: 'bg-gray-100 dark:bg-gray-900'
	},

	// Info/warning states
	info: {
		text: 'text-amber-900 dark:text-amber-100',
		bg: 'bg-amber-50 dark:bg-amber-900/20',
		border: 'border-amber-200 dark:border-amber-800',
		linkText: 'text-amber-800 dark:text-amber-200'
	},

	// Disabled states
	disabled: {
		bg: 'bg-gray-300 dark:bg-gray-600',
		text: 'text-gray-500 dark:text-gray-400'
	}
} as const;

/**
 * Helper to combine theme classes
 */
export function cn(...classes: string[]): string {
	return classes.filter(Boolean).join(' ');
}
