/**
 * Theme store with Avidys green color scheme
 * Supports light/dark mode with browser preference detection
 */

export type Theme = 'light' | 'dark' | 'auto';

let current = $state<Theme>('auto');
let resolvedTheme = $state<'light' | 'dark'>('dark');

function updateResolvedTheme() {
	if (typeof window === 'undefined') return;
	
	if (current === 'auto') {
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		resolvedTheme = prefersDark ? 'dark' : 'light';
	} else {
		resolvedTheme = current;
	}
	
	// Apply to document
	document.documentElement.setAttribute('data-theme', resolvedTheme);
}

export function setTheme(theme: Theme) {
	current = theme;
	if (typeof window !== 'undefined') {
		localStorage.setItem('theme', theme);
	}
	updateResolvedTheme();
}

export function toggleTheme() {
	if (current === 'light') {
		setTheme('dark');
	} else if (current === 'dark') {
		setTheme('auto');
	} else {
		setTheme('light');
	}
}

export function getTheme() {
	return {
		get current() {
			return current;
		},
		get resolvedTheme() {
			return resolvedTheme;
		}
	};
}

// Initialize theme on client side
if (typeof window !== 'undefined') {
	const saved = localStorage.getItem('theme') as Theme;
	if (saved && ['light', 'dark', 'auto'].includes(saved)) {
		current = saved;
	}
	
	// Initialize resolved theme
	updateResolvedTheme();
	
	// Listen for system theme changes
	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
	mediaQuery.addEventListener('change', () => {
		updateResolvedTheme();
	});
}

