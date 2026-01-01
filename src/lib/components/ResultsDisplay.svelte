<script lang="ts">
	import type { Puzzle, Results } from '$lib/types';
	import { shareResults, calculateTimeUntilNextPuzzle, formatDate } from '$lib/utils';
	import { onMount } from 'svelte';
	import { Icon, Check, XMark, Star, BookOpen, Share } from 'svelte-hero-icons';
	import { theme } from '$lib/theme';

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
		<h1 class="text-3xl font-bold {theme.neutral.textStrong} mb-2">
			Daily Draft #{puzzle.puzzle_number}
		</h1>
		<p class="text-xl {theme.neutral.textStrong}">{puzzle.prompt}</p>
		<p class="text-sm {theme.neutral.text} mt-1">{formatDate(puzzle.daily_date)}</p>
	</div>

	<!-- Layer 1: Score Summary -->
	{#if revealLayer >= 1}
		<div class="bg-pearl-aqua-600 dark:bg-pearl-aqua-500 text-white rounded-lg p-6 shadow-xl animate-fadeIn">
			<div class="text-center">
				<h2 class="text-5xl font-bold mb-2">{results.submission.total_score}/8</h2>
				<p class="text-xl opacity-90 flex items-center justify-center gap-2">
					Base: {results.submission.base_score}/5 • Captain:
					{#if captainCorrect}
						<span class="flex items-center gap-1">
							<Icon src={Check} mini size="20" class="inline" />
							+3
						</span>
					{:else}
						<span class="flex items-center gap-1">
							<Icon src={XMark} mini size="20" class="inline" />
							+0
						</span>
					{/if}
				</p>
			</div>
		</div>
	{/if}

	<!-- Layer 2: True Rankings -->
	{#if revealLayer >= 2}
		<div class="space-y-3 animate-fadeIn">
			<h3 class="text-xl font-bold {theme.neutral.textStrong}">True Top 5:</h3>

			{#each trueTop5 as [item, rank]}
				{@const isDrafted = results.submission.drafted_items.includes(item)}
				{@const isCaptain = results.submission.captain === item}

				<div
					class="flex items-center gap-3 p-4 rounded-lg border-2 transition-all
					{isDrafted
						? `${theme.success.border} ${theme.success.bgLight}`
						: `${theme.neutral.border} ${theme.neutral.bgLight}`}"
				>
					<div class="text-2xl font-bold {theme.neutral.text} w-8">
						#{rank}
					</div>
					<div class="flex-1">
						<span class="font-semibold {theme.neutral.textStrong}">{item}</span>
					</div>
					<div class="flex gap-2">
						{#if isDrafted}
							<span class="px-3 py-1 {theme.success.bg} text-white text-sm rounded-full font-medium flex items-center gap-1">
								<Icon src={Check} mini size="14" class="inline" />
								Drafted
							</span>
						{:else}
							<span class="px-3 py-1 {theme.neutral.bg} text-white text-sm rounded-full font-medium flex items-center gap-1">
								<Icon src={XMark} mini size="14" class="inline" />
								Missed
							</span>
						{/if}
						{#if isCaptain}
							<span class="px-3 py-1 {theme.accent.bg} {theme.accent.text} text-sm rounded-full font-bold flex items-center gap-1">
								<Icon src={Star} mini size="14" class="inline" />
								Captain
							</span>
						{/if}
					</div>
				</div>
			{/each}

			<!-- Show incorrect drafts -->
			{#if results.submission.drafted_items.filter((item) => !trueTop5.map(([i]) => i).includes(item)).length > 0}
				{@const incorrectDrafts = results.submission.drafted_items.filter(
					(item) => !trueTop5.map(([i]) => i).includes(item)
				)}
				<div class="mt-4">
					<p class="text-sm font-semibold {theme.neutral.text} mb-2">
						Your incorrect picks:
					</p>
					<div class="flex flex-wrap gap-2">
						{#each incorrectDrafts as item}
							{@const isCaptain = results.submission.captain === item}
							<span
								class="px-3 py-1 {theme.error.bgLight} {theme.error.text} rounded-full text-sm font-medium border {theme.error.border} flex items-center gap-1"
							>
								<Icon src={XMark} mini size="14" class="inline" />
								{item}
								{#if isCaptain}
									<Icon src={Star} mini size="14" class="inline" />
								{/if}
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
				<h3 class="text-xl font-bold {theme.neutral.textStrong} mb-3">How Others Played:</h3>
				<div class="{theme.card.bg} rounded-lg border {theme.card.border} overflow-hidden">
					<table class="w-full">
						<thead class="{theme.neutral.bgLight}">
							<tr>
								<th class="px-4 py-3 text-left text-xs font-semibold {theme.neutral.text} uppercase">
									Rank
								</th>
								<th class="px-4 py-3 text-left text-xs font-semibold {theme.neutral.text} uppercase">
									Item
								</th>
								<th class="px-4 py-3 text-center text-xs font-semibold {theme.neutral.text} uppercase">
									Drafted
								</th>
								<th class="px-4 py-3 text-center text-xs font-semibold {theme.neutral.text} uppercase">
									Captained
								</th>
							</tr>
						</thead>
						<tbody class="divide-y {theme.card.border}">
							{#each results.crowd_stats as stat}
								<tr class="{theme.neutral.borderHover}">
									<td class="px-4 py-3 text-sm font-medium {theme.neutral.textStrong}">
										#{stat.rank}
									</td>
									<td class="px-4 py-3 text-sm {theme.neutral.textStrong}">
										{stat.item_name}
									</td>
									<td class="px-4 py-3 text-center text-sm {theme.neutral.text}">
										{stat.drafted_percentage}%
									</td>
									<td class="px-4 py-3 text-center text-sm {theme.neutral.text}">
										{stat.captained_percentage}%
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

			<!-- Sources -->
			<div class="{theme.info.bg} border {theme.info.border} rounded-lg p-4">
				<h4 class="text-sm font-semibold {theme.info.text} mb-2 flex items-center gap-2">
					<Icon src={BookOpen} mini size="16" class="inline" />
					Data Sources:
				</h4>
				<ul class="space-y-1">
					{#each results.sources as source}
						<li class="text-sm {theme.info.linkText}">
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
				class="w-full py-4 px-6 {theme.primary.bg} {theme.primary.bgHover} text-white font-bold text-lg rounded-lg transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
			>
				<Icon src={Share} mini size="20" class="inline" />
				Share Your Results
			</button>

			<!-- Next Puzzle Countdown -->
			<div class="text-center p-4 {theme.neutral.bgLight} rounded-lg">
				<p class="text-sm {theme.neutral.text}">Next puzzle in:</p>
				<p class="text-2xl font-mono font-bold {theme.neutral.textStrong}">{nextPuzzleTime}</p>
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
