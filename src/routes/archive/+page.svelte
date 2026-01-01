<script lang="ts">
	import { onMount } from 'svelte';
	import type { ArchivePuzzle } from '$lib/types';
	import { getOrCreateUserId, formatDate } from '$lib/utils';
	import { goto } from '$app/navigation';

	let loading = $state(true);
	let error = $state<string | null>(null);
	let archivePuzzles = $state<ArchivePuzzle[]>([]);
	let userId = $state('');

	onMount(() => {
		userId = getOrCreateUserId();
		loadArchive();
	});

	async function loadArchive() {
		try {
			loading = true;
			const response = await fetch(`/api/puzzles/archive?user_id=${userId}`);
			const data = await response.json();

			if (data.success) {
				// Filter out future puzzles
				const now = new Date();
				now.setHours(0, 0, 0, 0);
				archivePuzzles = data.data.puzzles.filter((puzzle: ArchivePuzzle) => {
					const puzzleDate = new Date(puzzle.daily_date + 'T00:00:00');
					return puzzleDate <= now;
				});
			} else {
				error = data.error;
			}
		} catch (err) {
			error = 'Failed to load archive. Please try again.';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	function handlePuzzleClick(puzzle: ArchivePuzzle) {
		goto(`/${puzzle.puzzle_number}`);
	}
</script>

<svelte:head>
	<title>Past Drafts - Captain's Call</title>
	<meta name="description" content="View past Captain's Call puzzles" />
</svelte:head>

<div class="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
	<div class="container mx-auto px-4 py-8 max-w-4xl">
		<!-- Header with back link -->
		<div class="mb-6">
			<a
				href="/"
				class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
			>
				← Back to Today's Puzzle
			</a>
		</div>

		<div class="space-y-6">
			<!-- Header -->
			<div class="text-center">
				<h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Past Drafts</h1>
				<p class="text-gray-600 dark:text-gray-400">
					Play past puzzles you missed or revisit your results
				</p>
			</div>

			<!-- Loading State -->
			{#if loading}
				<div class="flex justify-center items-center min-h-[400px]">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
				</div>
			{:else if error}
				<div
					class="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-100 px-4 py-3 rounded"
				>
					<p class="font-bold">Error</p>
					<p>{error}</p>
					<button
						onclick={loadArchive}
						class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium"
					>
						Try Again
					</button>
				</div>
			{:else if archivePuzzles.length === 0}
				<!-- Empty State -->
				<div class="text-center py-12">
					<p class="text-gray-600 dark:text-gray-400 text-lg">No past puzzles available yet.</p>
					<p class="text-gray-500 dark:text-gray-500 text-sm mt-2">Check back soon!</p>
				</div>
			{:else}
				<!-- Puzzles List -->
				<div class="space-y-3">
					{#each archivePuzzles as puzzle}
						<button
							onclick={() => handlePuzzleClick(puzzle)}
							class="w-full text-left p-4 rounded-lg border-2 transition-all hover:scale-[1.02] hover:shadow-lg
								{puzzle.has_submitted
									? 'border-green-500 bg-green-50 dark:bg-green-900/20'
									: 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-400'}"
						>
							<div class="flex items-start justify-between gap-4">
								<!-- Left: Puzzle Info -->
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 mb-1">
										<span class="text-sm font-semibold text-gray-500 dark:text-gray-400">
											#{puzzle.puzzle_number}
										</span>
										{#if puzzle.has_submitted}
											<span
												class="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-medium"
											>
												Completed
											</span>
										{/if}
									</div>

									<h3 class="font-semibold text-gray-900 dark:text-white mb-1 truncate">
										{puzzle.prompt}
									</h3>

									<p class="text-sm text-gray-600 dark:text-gray-400">
										{formatDate(puzzle.daily_date)}
									</p>
								</div>

								<!-- Right: Score or Play Button -->
								<div class="flex-shrink-0 text-right">
									{#if puzzle.has_submitted && puzzle.total_score !== undefined}
										<div class="text-center">
											<div class="text-2xl font-bold text-green-600 dark:text-green-400">
												{puzzle.total_score}/8
											</div>
											<div class="text-xs text-gray-500 dark:text-gray-400">View Results</div>
										</div>
									{:else}
										<div class="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm">
											Play
										</div>
									{/if}
								</div>
							</div>
						</button>
					{/each}
				</div>

				<!-- Stats Summary -->
				{@const completedCount = archivePuzzles.filter((p) => p.has_submitted).length}
				{@const totalCount = archivePuzzles.length}
				{@const completionRate =
					totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}

				<div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center">
					<p class="text-sm text-gray-600 dark:text-gray-400">
						Completion: <span class="font-bold text-gray-900 dark:text-white">
							{completedCount}/{totalCount}
						</span>
						({completionRate}%)
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>
