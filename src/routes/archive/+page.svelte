<script lang="ts">
	import { onMount } from 'svelte';
	import type { ArchivePuzzle } from '$lib/types';
	import { getOrCreateUserId, formatDate } from '$lib/utils';
	import { goto } from '$app/navigation';
	import { theme } from '$lib/theme';
	import { MAX_TOTAL_SCORE } from '$lib/config/constants';
	import { Icon, Check } from 'svelte-hero-icons';

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
	<title>Archive - Topick</title>
	<meta name="description" content="View past Topick puzzles" />
</svelte:head>

<div class="min-h-screen {theme.page.bg} transition-colors">
	<div class="container mx-auto px-4 py-8 max-w-4xl">
		<div class="space-y-6">
			<!-- Header -->
			<div class="text-center">
				<h1 class="text-3xl font-bold {theme.neutral.textStrong} mb-2">Puzzle Archive</h1>
				<p class="{theme.neutral.text}">
					Play past puzzles you missed or revisit your results
				</p>
			</div>

			<!-- Loading State -->
			{#if loading}
				<div class="flex justify-center items-center min-h-[400px]" role="status" aria-label="Loading archive">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-pearl-aqua-600"></div>
				</div>
			{:else if error}
				<div
					class="{theme.error.bgLight} border {theme.error.border} {theme.error.text} px-4 py-3 rounded"
				>
					<p class="font-bold">Error</p>
					<p>{error}</p>
					<button
						onclick={loadArchive}
						class="mt-3 px-4 py-2 {theme.error.bg} text-white rounded font-medium hover:bg-red-700"
					>
						Try Again
					</button>
				</div>
			{:else if archivePuzzles.length === 0}
				<!-- Empty State -->
				<div class="text-center py-12">
					<p class="{theme.neutral.text} text-lg">No past puzzles available yet.</p>
					<p class="text-gray-500 dark:text-gray-500 text-sm mt-2">Check back soon!</p>
				</div>
			{:else}
				<!-- Puzzles List -->
				<div class="space-y-3">
					{#each archivePuzzles as puzzle}
						<button
							onclick={() => handlePuzzleClick(puzzle)}
							class="w-full text-left p-4 rounded-lg border-2 transition-shadow hover:shadow-lg focus-visible:ring-2 focus-visible:ring-pearl-aqua-300 focus-visible:ring-offset-2
								{puzzle.has_submitted
									? `${theme.success.border} ${theme.success.bgLight}`
									: `${theme.neutral.border} ${theme.card.bg} ${theme.primary.borderHover}`}"
						>
							<div class="flex items-start justify-between gap-4">
								<!-- Left: Puzzle Info -->
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 mb-1">
										<span class="text-sm font-semibold {theme.neutral.text}">
											#{puzzle.puzzle_number}
										</span>
										{#if puzzle.has_submitted}
											<span
												class="px-2 py-0.5 {theme.success.bg} text-white text-xs rounded-full font-medium flex items-center gap-1"
											>
												<Icon src={Check} mini size="14" class="inline" />
												Completed
											</span>
										{/if}
									</div>

									<h3 class="font-semibold {theme.neutral.textStrong} mb-1 truncate">
										{puzzle.prompt}
									</h3>

									<p class="text-sm {theme.neutral.text}">
										{formatDate(puzzle.daily_date)}
									</p>
								</div>

								<!-- Right: Score or Play Button -->
								<div class="flex-shrink-0 text-right">
									{#if puzzle.has_submitted && puzzle.total_score !== undefined}
										<div class="text-center">
											<div class="text-2xl font-bold {theme.success.text}">
												{puzzle.total_score}/{MAX_TOTAL_SCORE}
											</div>
											<div class="text-xs {theme.neutral.text}">View Results</div>
										</div>
									{:else}
										<div class="px-4 py-2 {theme.primary.bg} text-white rounded-lg font-medium text-sm">
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

				<div class="{theme.neutral.bgLight} rounded-lg p-4 text-center">
					<p class="text-sm {theme.neutral.text}">
						Completion: <span class="font-bold {theme.neutral.textStrong}">
							{completedCount}/{totalCount}
						</span>
						({completionRate}%)
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>
