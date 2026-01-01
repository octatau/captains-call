<script lang="ts">
	import type { Puzzle, Results } from '$lib/types';
	import { shareResults, calculateTimeUntilNextPuzzle, formatDate } from '$lib/utils';
	import { onMount } from 'svelte';

	interface Props {
		puzzle: Puzzle;
		results: Results;
	}

	let { puzzle, results }: Props = $props();

	let revealLayer = $state(0);
	let nextPuzzleTime = $state('');
	let interval: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		// Layer 1: Score summary (immediate)
		revealLayer = 1;

		// Layer 2: True rankings (after 300ms)
		setTimeout(() => {
			revealLayer = 2;
		}, 300);

		// Layer 3: Crowd stats and sources (after 1800ms total)
		setTimeout(() => {
			revealLayer = 3;
		}, 1800);

		// Update countdown timer
		nextPuzzleTime = calculateTimeUntilNextPuzzle();
		interval = setInterval(() => {
			nextPuzzleTime = calculateTimeUntilNextPuzzle();
		}, 1000);

		return () => {
			if (interval) clearInterval(interval);
		};
	});

	const trueTop5 = $derived(
		Object.entries(results.puzzle.true_rankings)
			.filter(([_, rank]) => rank <= 5)
			.sort((a, b) => a[1] - b[1])
	);

	const captainCorrect = $derived(results.puzzle.true_rankings[results.submission.captain] === 1);

	function handleShare() {
		shareResults(results.share_text);
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="text-center">
		<h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
			Daily Draft #{puzzle.puzzle_number}
		</h1>
		<p class="text-xl text-gray-700 dark:text-gray-300">{puzzle.prompt}</p>
		<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{formatDate(puzzle.daily_date)}</p>
	</div>

	<!-- Layer 1: Score Summary -->
	{#if revealLayer >= 1}
		<div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 shadow-xl animate-fadeIn">
			<div class="text-center">
				<h2 class="text-5xl font-bold mb-2">{results.submission.total_score}/8</h2>
				<p class="text-xl opacity-90">
					Base: {results.submission.base_score}/5 • Captain:
					{captainCorrect ? '✅ +3' : '❌ +0'}
				</p>
			</div>
		</div>
	{/if}

	<!-- Layer 2: True Rankings -->
	{#if revealLayer >= 2}
		<div class="space-y-3 animate-fadeIn">
			<h3 class="text-xl font-bold text-gray-900 dark:text-white">True Top 5:</h3>

			{#each trueTop5 as [item, rank]}
				{@const isDrafted = results.submission.drafted_items.includes(item)}
				{@const isCaptain = results.submission.captain === item}

				<div
					class="flex items-center gap-3 p-4 rounded-lg border-2 transition-all
					{isDrafted
						? 'border-green-500 bg-green-50 dark:bg-green-900/20'
						: 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'}"
				>
					<div class="text-2xl font-bold text-gray-600 dark:text-gray-400 w-8">
						#{rank}
					</div>
					<div class="flex-1">
						<span class="font-semibold text-gray-900 dark:text-white">{item}</span>
					</div>
					<div class="flex gap-2">
						{#if isDrafted}
							<span class="px-3 py-1 bg-green-600 text-white text-sm rounded-full font-medium">
								🟩 Drafted
							</span>
						{:else}
							<span class="px-3 py-1 bg-gray-400 text-white text-sm rounded-full font-medium">
								⬛ Missed
							</span>
						{/if}
						{#if isCaptain}
							<span class="px-3 py-1 bg-yellow-500 text-black text-sm rounded-full font-bold">
								⭐ Captain
							</span>
						{/if}
					</div>
				</div>
			{/each}

			<!-- Show incorrect drafts -->
			{@const incorrectDrafts = results.submission.drafted_items.filter(
				(item) => !trueTop5.map(([i]) => i).includes(item)
			)}
			{#if incorrectDrafts.length > 0}
				<div class="mt-4">
					<p class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
						Your incorrect picks:
					</p>
					<div class="flex flex-wrap gap-2">
						{#each incorrectDrafts as item}
							{@const isCaptain = results.submission.captain === item}
							<span
								class="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-full text-sm font-medium border border-red-300 dark:border-red-700"
							>
								🟥 {item}
								{#if isCaptain}⭐{/if}
								(#{results.puzzle.true_rankings[item]})
							</span>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Layer 3: Crowd Stats and Sources -->
	{#if revealLayer >= 3}
		<div class="space-y-6 animate-fadeIn">
			<!-- Crowd Statistics -->
			<div>
				<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">How Others Played:</h3>
				<div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
					<table class="w-full">
						<thead class="bg-gray-50 dark:bg-gray-700">
							<tr>
								<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
									Rank
								</th>
								<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
									Item
								</th>
								<th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
									Drafted
								</th>
								<th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
									Captained
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
							{#each results.crowd_stats as stat}
								<tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
									<td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
										#{stat.rank}
									</td>
									<td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
										{stat.item_name}
									</td>
									<td class="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
										{stat.drafted_percentage}%
									</td>
									<td class="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
										{stat.captained_percentage}%
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

			<!-- Sources -->
			<div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
				<h4 class="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
					📚 Data Sources:
				</h4>
				<ul class="space-y-1">
					{#each results.sources as source}
						<li class="text-sm text-amber-800 dark:text-amber-200">
							{#if source.startsWith('http')}
								<a href={source} target="_blank" rel="noopener noreferrer" class="underline hover:text-amber-600">
									{source}
								</a>
							{:else}
								{source}
							{/if}
						</li>
					{/each}
				</ul>
			</div>

			<!-- Share Button -->
			<button
				onclick={handleShare}
				class="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg transition-colors shadow-lg hover:shadow-xl"
			>
				📤 Share Your Results
			</button>

			<!-- Next Puzzle Countdown -->
			<div class="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
				<p class="text-sm text-gray-600 dark:text-gray-400">Next puzzle in:</p>
				<p class="text-2xl font-mono font-bold text-gray-900 dark:text-white">{nextPuzzleTime}</p>
			</div>
		</div>
	{/if}
</div>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fadeIn {
		animation: fadeIn 0.3s ease-out;
	}
</style>
