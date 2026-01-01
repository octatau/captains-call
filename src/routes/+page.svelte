<script lang="ts">
	import { onMount } from 'svelte';
	import type { Puzzle, Results, ArchivePuzzle } from '$lib/types';
	import { getOrCreateUserId, getTimezoneOffset } from '$lib/utils';
	import DraftInterface from '$lib/components/DraftInterface.svelte';
	import ResultsDisplay from '$lib/components/ResultsDisplay.svelte';
	import Archive from '$lib/components/Archive.svelte';

	let loading = $state(true);
	let error = $state<string | null>(null);
	let puzzle = $state<Puzzle | null>(null);
	let results = $state<Results | null>(null);
	let userId = $state('');
	let activeTab = $state<'today' | 'archive'>('today');

	// Archive state
	let archivePuzzles = $state<ArchivePuzzle[]>([]);
	let archiveLoading = $state(false);

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

	async function loadArchive() {
		try {
			archiveLoading = true;
			const response = await fetch(`/api/puzzles/archive?user_id=${userId}`);
			const data = await response.json();

			if (data.success) {
				archivePuzzles = data.data.puzzles;
			} else {
				error = data.error;
			}
		} catch (err) {
			error = 'Failed to load archive. Please try again.';
			console.error(err);
		} finally {
			archiveLoading = false;
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

	async function handleArchiveSelect(event: CustomEvent<{ puzzleId: string; date: string }>) {
		try {
			loading = true;
			error = null;
			const response = await fetch(
				`/api/puzzle?user_id=${userId}&puzzle_id=${event.detail.puzzleId}`
			);
			const data = await response.json();

			if (data.success) {
				puzzle = data.data;
				if (puzzle?.has_submitted) {
					await loadResults(puzzle.id);
				} else {
					results = null;
				}
				activeTab = 'today'; // Switch to today tab to show the puzzle
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

	function switchTab(tab: 'today' | 'archive') {
		activeTab = tab;
		if (tab === 'archive' && archivePuzzles.length === 0) {
			loadArchive();
		} else if (tab === 'today' && !puzzle) {
			loadTodaysPuzzle();
		}
	}
</script>

<svelte:head>
	<title>Captain's Call - Daily Draft Game</title>
	<meta
		name="description"
		content="Draft the best 5 out of 10 — choose a Captain — and see how everyone else picked."
	/>
</svelte:head>

<div class="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
	<div class="container mx-auto px-4 py-8 max-w-4xl">
		<!-- Tab Navigation -->
		<div class="flex gap-2 mb-6">
			<button
				onclick={() => switchTab('today')}
				class="flex-1 py-3 px-6 font-semibold rounded-lg transition-colors
					{activeTab === 'today'
						? 'bg-blue-600 text-white'
						: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
			>
				🎯 Today's Puzzle
			</button>
			<button
				onclick={() => switchTab('archive')}
				class="flex-1 py-3 px-6 font-semibold rounded-lg transition-colors
					{activeTab === 'archive'
						? 'bg-blue-600 text-white'
						: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
			>
				📚 Archive
			</button>
		</div>

		<!-- Content Area -->
		{#if loading && !puzzle && activeTab === 'today'}
			<div class="flex justify-center items-center min-h-[400px]">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		{:else if error && activeTab === 'today'}
			<div
				class="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-100 px-4 py-3 rounded"
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
		{:else if activeTab === 'today' && puzzle}
			{#if results}
				<ResultsDisplay {puzzle} {results} />
			{:else}
				<DraftInterface {puzzle} {loading} on:submit={handleSubmit} />
			{/if}
		{:else if activeTab === 'archive'}
			<Archive puzzles={archivePuzzles} loading={archiveLoading} on:select={handleArchiveSelect} />
		{/if}
	</div>
</div>