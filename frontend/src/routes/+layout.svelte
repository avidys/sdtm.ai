<script lang="ts">
  import type { PageData } from './$types';
  import { getTheme } from '$lib/stores/theme.svelte';
  import { page } from '$app/stores';
  import '../app.css';
  
  const favicon = '/AV-green.png';
  const theme = getTheme();
  
  // Reactive logo based on theme
  let logo = $derived(
    theme.resolvedTheme === 'dark' ? '/AV-green.png' : '/AV-light.png'
  );

  let { data, children }: { data: PageData; children: import('svelte').Snippet<[]> } = $props();
  
  // Helper function to check if a link is active
  function isActive(href: string): boolean {
    const pathname = $page.url.pathname;
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  }
  
  // Mobile menu state
  let mobileMenuOpen = $state(false);
  // User menu dropdown state (desktop)
  let userMenuOpen = $state(false);
  
  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }
  
  function closeMobileMenu() {
    mobileMenuOpen = false;
  }
  
  function toggleUserMenu() {
    userMenuOpen = !userMenuOpen;
  }
  
  function closeUserMenu() {
    userMenuOpen = false;
  }
  
  // Close menus when clicking outside
  $effect(() => {
    if (typeof window !== 'undefined') {
      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.user-menu-container') && !target.closest('.mobile-menu-toggle')) {
          userMenuOpen = false;
          if (!target.closest('.mobile-nav')) {
            mobileMenuOpen = false;
          }
        }
      };
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  });
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
  <title>Avidys SDTM Compliance Portal</title>
</svelte:head>

<div class="app-shell">
  <header>
    <!-- Mobile menu toggle (always visible on mobile, hidden on desktop) -->
    <button 
      class="mobile-menu-toggle"
      onclick={toggleMobileMenu}
      aria-label="Toggle menu"
      aria-expanded={mobileMenuOpen}
    >
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    </button>
    
    <!-- Mobile dropdown menu -->
    <nav class="mobile-nav" class:mobile-open={mobileMenuOpen}>
      <a href="/" onclick={closeMobileMenu}>Home</a>
      {#if data.session}
        <a href="/dashboard" onclick={closeMobileMenu}>Dashboard</a>
        <a href="/profile" onclick={closeMobileMenu}>Profile</a>
      {/if}
      <a href="/viewer" onclick={closeMobileMenu}>Viewer</a>
      <a href="/standards" onclick={closeMobileMenu}>Standards</a>
      {#if data.session}
        <a href="/settings" onclick={closeMobileMenu}>Settings</a>
        <form method="post" action="/logout" class="nav-form">
          <button type="submit" class="btn-nav-signout" onclick={closeMobileMenu}>Sign out</button>
        </form>
      {:else}
        <a class="btn-nav-signin" href="/login" onclick={closeMobileMenu}>Sign in</a>
      {/if}
    </nav>
    
    <div class="brand">
      <img src={logo} alt="Avidys" class="logo" />
      <span class="brand-text">SDTM Compliance</span>
    </div>
    
    <!-- Desktop navigation -->
    <nav class="desktop-nav">
      <a href="/" class:active={isActive('/')}>Home</a>
      {#if data.session}
        <a href="/dashboard" class:active={isActive('/dashboard')}>Dashboard</a>
      {/if}
      <a href="/viewer" class:active={isActive('/viewer')}>Viewer</a>
      <a href="/standards" class:active={isActive('/standards')}>Standards</a>
    </nav>
    
    <div class="actions">
      {#if data.session}
        <div class="user-menu-container">
          <button 
            class="user-menu-toggle"
            onclick={toggleUserMenu}
            aria-label="User menu"
            aria-expanded={userMenuOpen}
          >
            <span class="user-email">{data.profile?.email}</span>
            <span class="dropdown-arrow">▼</span>
          </button>
          {#if userMenuOpen}
            <div class="user-menu-dropdown">
              <a href="/profile" onclick={closeUserMenu}>Profile</a>
              <a href="/settings" onclick={closeUserMenu}>Settings</a>
              <form method="post" action="/logout">
                <button type="submit" class="btn-menu-signout">Sign out</button>
              </form>
            </div>
          {/if}
        </div>
      {:else}
        <a class="btn-primary" href="/login">Sign in</a>
      {/if}
    </div>
  </header>
  <main>
    {@render children()}
  </main>
  <footer>
    <p>Deployed from {data.deploymentGitBranch} - Avidys AI</p>
  </footer>
</div>

<style>
  .app-shell {
    min-height: 100vh;
    display: grid;
    grid-template-rows: auto 1fr auto;
    background: var(--color-bg);
    color: var(--color-text);
  }
  
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 2rem;
    background: var(--color-surface);
    border-bottom: 2px solid var(--color-border);
    box-shadow: var(--shadow-sm);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  
  .brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .logo {
    height: 32px;
    width: auto;
  }
  
  .brand-text {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-primary);
    letter-spacing: -0.02em;
  }
  
  .desktop-nav {
    display: flex;
    gap: 1.5rem;
    flex: 1;
    justify-content: center;
  }
  
  .desktop-nav a {
    color: var(--color-text-secondary);
    text-decoration: none;
    font-weight: 500;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    transition: all 0.2s;
    position: relative;
  }
  
  .desktop-nav a:hover {
    color: var(--color-primary);
    background: var(--color-surface-hover);
  }
  
  .desktop-nav a.active {
    color: var(--color-primary);
    font-weight: 600;
  }
  
  .desktop-nav a.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    height: 2px;
    background: var(--color-primary);
    border-radius: 1px;
  }
  
  .mobile-menu-toggle {
    display: none;
    flex-direction: column;
    justify-content: space-around;
    width: 2rem;
    height: 2rem;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    z-index: 101;
  }
  
  .hamburger-line {
    width: 100%;
    height: 3px;
    background: var(--color-text);
    border-radius: 2px;
    transition: all 0.3s;
  }
  
  .mobile-menu-toggle[aria-expanded="true"] .hamburger-line:nth-child(1) {
    transform: rotate(45deg) translate(5px, 5px);
  }
  
  .mobile-menu-toggle[aria-expanded="true"] .hamburger-line:nth-child(2) {
    opacity: 0;
  }
  
  .mobile-menu-toggle[aria-expanded="true"] .hamburger-line:nth-child(3) {
    transform: rotate(-45deg) translate(7px, -6px);
  }
  
  .mobile-nav {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--color-surface);
    border-top: 2px solid var(--color-border);
    border-bottom: 2px solid var(--color-border);
    box-shadow: var(--shadow-md);
    flex-direction: column;
    gap: 0;
    padding: 0;
    z-index: 100;
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease-out;
  }
  
  .mobile-nav.mobile-open {
    display: flex;
    max-height: 600px;
  }
  
  .mobile-nav a {
    padding: 1rem 1.5rem;
    font-size: 0.875rem;
    border-bottom: 1px solid var(--color-border);
    min-height: 44px;
    display: flex;
    align-items: center;
    width: 100%;
    color: var(--color-text-secondary);
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s;
  }
  
  .mobile-nav a:last-child {
    border-bottom: none;
  }
  
  .mobile-nav a:hover {
    background: var(--color-surface-hover);
    color: var(--color-primary);
  }
  
  .nav-form {
    margin: 0;
    padding: 0;
    display: contents;
  }
  
  .btn-nav-signout,
  .btn-nav-signin {
    width: 100%;
    padding: 1rem 1.5rem;
    font-size: 0.875rem;
    border-bottom: 1px solid var(--color-border);
    min-height: 44px;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 0;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
    text-align: left;
    display: flex;
    align-items: center;
  }
  
  .btn-nav-signout:hover,
  .btn-nav-signin:hover {
    background: var(--color-primary-hover);
  }
  
  .user-menu-container {
    position: relative;
  }
  
  .user-menu-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.5rem;
    transition: all 0.2s;
  }
  
  .user-menu-toggle:hover {
    background: var(--color-surface-hover);
  }
  
  .user-email {
    font-size: 0.875rem;
    color: var(--color-primary-hover);
    font-weight: 500;
  }
  
  .dropdown-arrow {
    font-size: 0.6rem;
    color: var(--color-text-muted);
    transition: transform 0.2s;
  }
  
  .user-menu-toggle[aria-expanded="true"] .dropdown-arrow {
    transform: rotate(180deg);
  }
  
  .user-menu-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    box-shadow: var(--shadow-lg);
    min-width: 160px;
    z-index: 1000;
    overflow: hidden;
  }
  
  .user-menu-dropdown a {
    display: block;
    padding: 0.75rem 1rem;
    color: var(--color-text);
    text-decoration: none;
    font-size: 0.875rem;
    transition: all 0.2s;
    border-bottom: 1px solid var(--color-border);
  }
  
  .user-menu-dropdown a:last-child {
    border-bottom: none;
  }
  
  .user-menu-dropdown a:hover {
    background: var(--color-surface-hover);
    color: var(--color-primary);
  }
  
  .btn-menu-signout {
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    color: var(--color-text);
    text-align: left;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s;
  }
  
  .btn-menu-signout:hover {
    background: var(--color-surface-hover);
    color: var(--color-primary);
  }
  
  .mobile-menu-toggle {
    display: none;
    flex-direction: column;
    justify-content: space-around;
    width: 2rem;
    height: 2rem;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    z-index: 101;
  }
  
  .hamburger-line {
    width: 100%;
    height: 3px;
    background: var(--color-text);
    border-radius: 2px;
    transition: all 0.3s;
  }
  
  .mobile-menu-toggle[aria-expanded="true"] .hamburger-line:nth-child(1) {
    transform: rotate(45deg) translate(5px, 5px);
  }
  
  .mobile-menu-toggle[aria-expanded="true"] .hamburger-line:nth-child(2) {
    opacity: 0;
  }
  
  .mobile-menu-toggle[aria-expanded="true"] .hamburger-line:nth-child(3) {
    transform: rotate(-45deg) translate(7px, -6px);
  }
  
  .actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  .user-email {
    font-size: 0.875rem;
    color: var(--color-primary-hover);
    font-weight: 500;
  }
  
  .btn-primary {
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 9999px;
    padding: 0.5rem 1.25rem;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.875rem;
    transition: all 0.2s;
    text-decoration: none;
    display: inline-block;
  }
  
  .btn-primary:hover {
    background: var(--color-primary-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  main {
    padding: 2rem;
    width: min(1400px, 100%);
    margin: 0 auto;
  }
  
  footer {
    padding: 0.75rem 2rem;
    font-size: 0.875rem;
    color: var(--color-primary-hover);
    background: var(--color-bg-secondary);
    border-top: 1px solid var(--color-border);
    text-align: center;
    font-weight: 500;
  }
  
  @media (max-width: 768px) {
    header {
      flex-wrap: nowrap;
      gap: 0.75rem;
      padding: 1rem;
      position: relative;
    }
    
    .brand {
      order: 2;
      flex: 1;
      min-width: 0;
    }
    
    .brand-text {
      font-size: 1rem;
    }
    
    .mobile-menu-toggle {
      display: flex;
      order: 1;
      margin-right: 0.5rem;
    }
    
    .desktop-nav {
      display: none;
    }
    
    .actions {
      order: 3;
      gap: 0.5rem;
    }
    
    .user-menu-container {
      display: none;
    }
    
    .btn-primary {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      min-height: 44px;
      min-width: 80px;
    }
    
    main {
      padding: 1rem;
    }
    
    footer {
      padding: 0.75rem 1rem;
      font-size: 0.8rem;
    }
  }
  
  @media (max-width: 480px) {
    .brand {
      gap: 0.5rem;
    }
    
    .logo {
      height: 28px;
    }
    
    .brand-text {
      font-size: 0.9rem;
    }
    
    nav a {
      padding: 0.4rem 0.6rem;
      font-size: 0.8rem;
    }
  }
</style>
