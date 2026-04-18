<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import Header from '$lib/components/Header.svelte';

	let { children } = $props();
	let darkMode = $state(false);

	onMount(() => {
		// Check localStorage for saved preference
		const saved = localStorage.getItem('theme');
		if (saved) {
			darkMode = saved === 'dark';
		} else {
			// Check system preference
			darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
		}
		updateTheme();
	});

	function toggleDarkMode() {
		darkMode = !darkMode;
		updateTheme();
		localStorage.setItem('theme', darkMode ? 'dark' : 'light');
	}

	function updateTheme() {
		if (darkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}
</script>

<svelte:head>
	<title>Topick</title>
	<!-- Default OG tags (overridden per-page) -->
	<meta property="og:site_name" content="Topick" />
	<meta property="og:type" content="website" />
	<meta property="og:image" content="https://www.playtopick.com/og-image.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content="https://www.playtopick.com/og-image.png" />
</svelte:head>

<a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-pearl-aqua-600 focus:text-white focus:rounded-lg focus:font-semibold">
	Skip to content
</a>

<Header {darkMode} onToggleDarkMode={toggleDarkMode} />

<main id="main-content">
	{@render children()}
</main>
