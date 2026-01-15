<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { Icon, Moon, Sun } from 'svelte-hero-icons';

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

<!-- Theme Toggle Button (Fixed Position) -->
<button
	onclick={toggleDarkMode}
	class="fixed top-4 right-4 z-50 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform"
	aria-label="Toggle dark mode"
>
	{#if darkMode}
		<Icon src={Sun} size="20" class="text-yellow-500" />
	{:else}
		<Icon src={Moon} size="20" class="text-gray-700" />
	{/if}
</button>

{@render children()}
