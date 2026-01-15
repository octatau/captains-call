<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
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
	<link rel="icon" href={favicon} />
	<title>Topick</title>
</svelte:head>

<Header {darkMode} onToggleDarkMode={toggleDarkMode} />

{@render children()}
