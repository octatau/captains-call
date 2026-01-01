<script lang="ts">
	import type { ArchivePuzzle } from '$lib/types';
	import { formatDate, isToday } from '$lib/utils';
	import { createEventDispatcher } from 'svelte';
	import { Icon, Check, ArrowRight } from 'svelte-hero-icons';

	interface Props {
		puzzles: ArchivePuzzle[];
		loading?: boolean;
	}

	let { puzzles, loading = false }: Props = $props();

	const dispatch = createEventDispatcher<{
		select: { puzzleId: string; date: string };
	}>();

	function handlePuzzleClick(puzzle: ArchivePuzzle) {
		dispatch('select', {
			puzzleId: puzzle.id,
			date: puzzle.daily_date
		});
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="text-center">
		<h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Puzzle Archive</h1>
		<p class="text-gray-600 dark:text-gray-400">
			Play past puzzles you missed or revisit your results
		</p>
	</div>

	<!-- Loading State -->
	{#if loading}
		<div class="flex justify-center items-center min-h-[400px]">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
		</div>
	{:else if puzzles.length === 0}
		<!-- Empty State -->
		<div class="text-center py-12">
			<p class="text-gray-600 dark:text-gray-400 text-lg">No puzzles available yet.</p>
			<p class="text-gray-500 dark:text-gray-500 text-sm mt-2">Check back soon!</p>
		</div>
	{:else}
		<!-- Puzzles List -->
		<div class="space-y-3">
			{#each puzzles as puzzle}
				{@const today = isToday(puzzle.daily_date)}

				<button
					onclick={() => handlePuzzleClick(puzzle)}
					class="w-full text-left p-4 rounded-lg border-2 transition-all hover:scale-[1.02] hover:shadow-lg
						{puzzle.has_submitted
							? 'border-pearl-aqua-500 bg-pearl-aqua-50 dark:bg-pearl-aqua-900/20'
							: 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-400'}"
				>
					<div class="flex items-start justify-between gap-4">
						<!-- Left: Puzzle Info -->
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-1">
								<span class="text-sm font-semibold text-gray-500 dark:text-gray-400">
									#{puzzle.puzzle_number}
								</span>
								{#if today}
									<span class="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full font-medium">
										Today
									</span>
								{/if}
								{#if puzzle.has_submitted}
									<span class="px-2 py-0.5 bg-pearl-aqua-600 text-white text-xs rounded-full font-medium flex items-center gap-1">
										<Icon src={Check} mini size="14" class="inline" />
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
									<div class="text-2xl font-bold text-pearl-aqua-600 dark:text-pearl-aqua-400">
										{puzzle.total_score}/8
									</div>
									<div class="text-xs text-gray-500 dark:text-gray-400">View Results</div>
								</div>
							{:else}
								<div class="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm flex items-center gap-1">
									Play
									<Icon src={ArrowRight} mini size="16" class="inline" />
								</div>
							{/if}
						</div>
					</div>
				</button>
			{/each}
		</div>

		<!-- Stats Summary -->
		{@const completedCount = puzzles.filter((p) => p.has_submitted).length}
		{@const totalCount = puzzles.length}
		{@const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}

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
