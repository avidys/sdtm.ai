/**
 * Theme store with Avidys green color scheme
 * Supports light/dark mode with browser preference detection
 */

export type Theme = 'light' | 'dark' | 'auto';

let current = $state<Theme>('auto');
let resolvedTheme = $state<'light' | 'dark'>('dark');
let mediaQuery: MediaQueryList | null = null;
let mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;

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
	
	// Listen for system theme changes - this will update when system preference changes
	mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
	mediaQueryListener = () => {
		if (current === 'auto') {
			updateResolvedTheme();
		}
	};
	mediaQuery.addEventListener('change', mediaQueryListener);
	
	// Also listen for storage changes (in case theme is changed in another tab)
	window.addEventListener('storage', (e) => {
		if (e.key === 'theme') {
			const newTheme = e.newValue as Theme;
			if (newTheme && ['light', 'dark', 'auto'].includes(newTheme)) {
				current = newTheme;
				updateResolvedTheme();
			}
		}
	});
}

