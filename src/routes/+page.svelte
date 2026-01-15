<script lang="ts">
	import { onMount } from 'svelte';
	import type { Puzzle, Results } from '$lib/types';
	import { getOrCreateUserId, getTimezoneOffset } from '$lib/utils';
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
	<title>Topick - Daily Ranking Game</title>
	<meta
		name="description"
		content="Guess the top 5 rankings from real-world data. Can you guess the #1?"
	/>
</svelte:head>

<div class="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
	<div class="container mx-auto px-4 py-8 max-w-4xl">
		<!-- Header with archive link -->
		<div class="flex justify-end mb-6">
			<a
				href="/archive"
				class="text-pearl-aqua-600 hover:text-pearl-aqua-700 dark:text-pearl-aqua-400 dark:hover:text-pearl-aqua-300 text-sm font-medium"
			>
				View Archive
			</a>
		</div>

		<!-- Content Area -->
		{#if loading && !puzzle}
			<div class="flex justify-center items-center min-h-[400px]">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-pearl-aqua-600"></div>
			</div>
		{:else if error}
			<div
				class="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-100 px-4 py-3 rounded"
			>
				<p class="font-bold">Error</p>
				<p>{error}</p>
				<button
					onclick={loadTodaysPuzzle}
					class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium"
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