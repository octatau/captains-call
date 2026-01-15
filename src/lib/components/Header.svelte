<script lang="ts">
	import { Icon, Moon, Sun } from 'svelte-hero-icons';
	import { theme } from '$lib/theme';
	import { page } from '$app/stores';

	interface Props {
		darkMode: boolean;
		onToggleDarkMode: () => void;
	}

	let { darkMode, onToggleDarkMode }: Props = $props();

	const isArchivePage = $derived($page.url.pathname.includes('/archive'));
	const isHomePage = $derived($page.url.pathname === '/');
</script>

<header class="sticky top-0 z-40 w-full border-b {theme.card.border} {theme.card.bg} backdrop-blur-sm bg-opacity-95">
	<div class="container mx-auto px-4 py-3 max-w-4xl">
		<div class="flex items-center justify-between gap-4">
			<!-- Left: Logo/Title -->
			<a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
				<h1 class="text-xl font-bold {theme.neutral.textStrong}">Topick</h1>
				<span class="hidden sm:inline text-xs {theme.neutral.text} font-medium">Guess the Rankings</span>
			</a>

			<!-- Right: Navigation & Dark Mode Toggle -->
			<div class="flex items-center gap-3">
				<!-- Archive Link (only show on non-archive pages) -->
				{#if !isArchivePage}
					<a
						href="/archive"
						class="{theme.primary.text} hover:text-pearl-aqua-700 dark:hover:text-pearl-aqua-300 text-sm font-medium transition-colors"
					>
						<span class="hidden sm:inline">View Archive</span>
						<span class="sm:hidden">Archive</span>
					</a>
				{/if}

				<!-- Back to Today (only show on archive page) -->
				{#if isArchivePage}
					<a
						href="/"
						class="{theme.primary.text} hover:text-pearl-aqua-700 dark:hover:text-pearl-aqua-300 text-sm font-medium transition-colors"
					>
						<span class="hidden sm:inline">Today's Puzzle</span>
						<span class="sm:hidden">Today</span>
					</a>
				{/if}

				<!-- Divider -->
				<div class="h-6 w-px {theme.neutral.border}"></div>

				<!-- Dark Mode Toggle -->
				<button
					onclick={onToggleDarkMode}
					class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
					aria-label="Toggle dark mode"
				>
					{#if darkMode}
						<Icon src={Sun} size="20" class="text-yellow-500" />
					{:else}
						<Icon src={Moon} size="20" class="text-gray-700 dark:text-gray-300" />
					{/if}
				</button>
			</div>
		</div>
	</div>
</header>
