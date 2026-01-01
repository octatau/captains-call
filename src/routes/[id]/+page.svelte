<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { Puzzle, Results } from '$lib/types';
	import { getOrCreateUserId, getTimezoneOffset } from '$lib/utils';
	import DraftInterface from '$lib/components/DraftInterface.svelte';
	import ResultsDisplay from '$lib/components/ResultsDisplay.svelte';
	import { theme } from '$lib/theme';

	let loading = $state(true);
	let error = $state<string | null>(null);
	let puzzle = $state<Puzzle | null>(null);
	let results = $state<Results | null>(null);
	let userId = $state('');
	let puzzleId = $derived($page.params.id);

	onMount(() => {
		userId = getOrCreateUserId();
		loadPuzzle();
	});

	async function loadPuzzle() {
		try {
			loading = true;
			error = null;

			// Try to load puzzle by puzzle number
			const response = await fetch(`/api/puzzle?user_id=${userId}&puzzle_number=${puzzleId}`);
			const data = await response.json();

			if (data.success) {
				puzzle = data.data;

				// Check if puzzle is available (not in the future)
				const now = new Date();
				now.setHours(0, 0, 0, 0);
				const puzzleDate = new Date(puzzle.daily_date + 'T00:00:00');

				if (puzzleDate > now) {
					error = 'This puzzle is not available yet.';
					puzzle = null;
					return;
				}

				if (puzzle?.has_submitted) {
					await loadResults(puzzle.id);
				}
			} else {
				error = data.error || 'Puzzle not found.';
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
	<title>Puzzle #{puzzleId} - Captain's Call</title>
	<meta name="description" content="Captain's Call puzzle #{puzzleId}" />
</svelte:head>

<div class="min-h-screen {theme.page.bg} transition-colors">
	<div class="container mx-auto px-4 py-8 max-w-4xl">
		<!-- Header with navigation -->
		<div class="flex justify-between items-center mb-6">
			<a
				href="/"
				class="{theme.primary.text} hover:text-pearl-aqua-700 dark:hover:text-pearl-aqua-300 text-sm font-medium"
			>
				← Today's Puzzle
			</a>
			<a
				href="/archive"
				class="{theme.primary.text} hover:text-pearl-aqua-700 dark:hover:text-pearl-aqua-300 text-sm font-medium"
			>
				View Past Drafts
			</a>
		</div>

		<!-- Content Area -->
		{#if loading}
			<div class="flex justify-center items-center min-h-[400px]">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-pearl-aqua-600"></div>
			</div>
		{:else if error}
			<div
				class="{theme.error.bgLight} border {theme.error.border} {theme.error.text} px-4 py-3 rounded"
			>
				<p class="font-bold">Error</p>
				<p>{error}</p>
				<button
					onclick={loadPuzzle}
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
