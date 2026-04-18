<script lang="ts">
	import { Icon, Moon, Sun } from 'svelte-hero-icons';
	import { theme } from '$lib/theme';
	import { page } from '$app/stores';
	import Logo from './Logo.svelte';

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
			<a href="/" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
				<Logo size={32} />
				<div class="flex flex-col">
					<span class="text-xl font-bold {theme.neutral.textStrong} leading-tight">Topick</span>
					<span class="hidden sm:block text-xs {theme.neutral.text} font-medium leading-tight">Guess the Rankings</span>
				</div>
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
					class="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
					aria-label="Toggle dark mode"
					aria-pressed={darkMode}
				>
					{#if darkMode}
						<Icon src={Sun} size="20" class="text-jasmine-500" />
					{:else}
						<Icon src={Moon} size="20" class={theme.neutral.textStrong} />
					{/if}
				</button>
			</div>
		</div>
	</div>
</header>
