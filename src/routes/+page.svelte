<script lang="ts">
	import { onMount } from 'svelte';
	import type { Puzzle, Results } from '$lib/types';
	import { getOrCreateUserId, getTimezoneOffset } from '$lib/utils';
	import { theme } from '$lib/theme';
	import DraftInterface from '$lib/components/DraftInterface.svelte';
	import ResultsDisplay from '$lib/components/ResultsDisplay.svelte';

	let loading = $state(true);
	let error = $state<string | null>(null);
	let puzzle = $state<Puzzle | null>(null);
	let results = $state<Results | null>(null);
	let userId = $state('');

	// Get or create user ID
	onMount(() => {
		userId = getOrCreateUserId();
		loadTodaysPuzzle();
	});

	async function loadTodaysPuzzle() {
		try {
			loading = true;
			error = null;
			const timezone = getTimezoneOffset();
			const response = await fetch(`/api/puzzle?user_id=${userId}&timezone=${timezone}`);
			const data = await response.json();

			if (data.success) {
				puzzle = data.data;
				if (puzzle?.has_submitted) {
					await loadResults(puzzle.id);
				}
			} else {
				error = data.error;
			}
		} catch (err) {
			error = 'Failed to load puzzle. Please try again.';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	async function loadResults(puzzleId: string) {
		try {
			const response = await fetch(`/api/results?user_id=${userId}&puzzle_id=${puzzleId}`);
			const data = await response.json();

			if (data.success) {
				results = data.data;
			}
		} catch (err) {
			console.error('Failed to load results:', err);
		}
	}

	async function handleSubmit(event: CustomEvent<{ draftedItems: string[]; captain: string }>) {
		if (!puzzle) return;

		loading = true;
		error = null;
		try {
			const response = await fetch('/api/submit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					user_id: userId,
					puzzle_id: puzzle.id,
					drafted_items: event.detail.draftedItems,
					captain: event.detail.captain
				})
			});

			const data = await response.json();

			if (data.success) {
				results = data.data.results;
				if (puzzle) {
					puzzle.has_submitted = true;
				}
			} else {
				error = data.error;
			}
		} catch (err) {
			error = 'Failed to submit. Please try again.';
			console.error(err);
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Topick - Daily Ranking Game | Guess the Top 5</title>
	<meta
		name="description"
		content="Play Topick, the free daily ranking game. Guess the top 5 from real-world data — movies, sports, music, and more. Can you pick #1? A new puzzle every day."
	/>
	<link rel="canonical" href="https://www.playtopick.com" />
	<meta property="og:title" content="Topick - Daily Ranking Game" />
	<meta property="og:description" content="Guess the top 5 from real-world data. Can you pick #1? A new puzzle every day." />
	<meta property="og:url" content="https://www.playtopick.com" />
	<meta name="twitter:title" content="Topick - Daily Ranking Game" />
	<meta name="twitter:description" content="Guess the top 5 from real-world data. Can you pick #1? A new puzzle every day." />
	{@html `<script type="application/ld+json">${JSON.stringify({
		"@context": "https://schema.org",
		"@type": "WebApplication",
		"name": "Topick",
		"url": "https://www.playtopick.com",
		"description": "A free daily ranking game. Guess the top 5 from real-world data — movies, sports, music, and more.",
		"applicationCategory": "GameApplication",
		"operatingSystem": "Any",
		"offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
		"author": { "@type": "Organization", "name": "Topick" },
		"image": "https://www.playtopick.com/og-image.png"
	})}</script>`}
</svelte:head>

<div class="min-h-screen {theme.page.bg} transition-colors">
	<div class="container mx-auto px-4 py-8 max-w-4xl">
		<!-- Content Area -->
		{#if loading && !puzzle}
			<div class="flex justify-center items-center min-h-[400px]" role="status" aria-label="Loading puzzle">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-pearl-aqua-600"></div>
			</div>
		{:else if error}
			<div
				class="{theme.error.bgLight} border {theme.error.border} {theme.error.text} px-4 py-3 rounded"
			>
				<p class="font-bold">Error</p>
				<p>{error}</p>
				<button
					onclick={loadTodaysPuzzle}
					class="mt-3 px-4 py-2 {theme.error.bg} text-white rounded font-medium hover:bg-red-700"
				>
					Try Again
				</button>
			</div>
		{:else if puzzle}
			{#if results}
				<ResultsDisplay {puzzle} {results} />
			{:else}
				<DraftInterface {puzzle} {loading} on:submit={handleSubmit} />
			{/if}
		{/if}
	</div>
</div>