<script lang="ts">
	import { onMount } from 'svelte';
	import { Icon, Moon, Sun } from 'svelte-hero-icons';

	let isDark = $state(false);

	onMount(() => {
		// Check for saved preference or system preference
		isDark =
			localStorage.theme === 'dark' ||
			(!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

		// Apply the theme
		if (isDark) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	});

	function toggleTheme() {
		isDark = !isDark;
		if (isDark) {
			document.documentElement.classList.add('dark');
			localStorage.theme = 'dark';
		} else {
			document.documentElement.classList.remove('dark');
			localStorage.theme = 'light';
		}
	}
</script>

<button
	onclick={toggleTheme}
	class="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
	aria-label="Toggle dark mode"
>
	{#if isDark}
		<Icon src={Sun} size="20" class="text-yellow-500" />
	{:else}
		<Icon src={Moon} size="20" class="text-gray-700" />
	{/if}
</button>
