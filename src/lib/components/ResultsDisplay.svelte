<script lang="ts">
	import type { Puzzle, Results } from '$lib/types';
	import { calculateTimeUntilNextPuzzle, formatDate } from '$lib/utils';
	import { onMount } from 'svelte';
	import { Icon, Check, XMark, Star, BookOpen, Share } from 'svelte-hero-icons';
	import { theme } from '$lib/theme';
	import ShareModal from './ShareModal.svelte';
	import {
		TOP_N,
		TOP_RANK,
		MAX_TOTAL_SCORE,
		CAPTAIN_BONUS,
		REVEAL_DELAY_RANKINGS,
		REVEAL_DELAY_STATS,
		COUNTDOWN_INTERVAL
	} from '$lib/config/constants';

	interface Props {
		puzzle: Puzzle;
		results: Results;
	}

	let { puzzle, results }: Props = $props();

	let revealLayer = $state(0);
	let nextPuzzleTime = $state('');
	let interval: ReturnType<typeof setInterval> | null = null;
	let showShareModal = $state(false);

	onMount(() => {
		// Layer 1: Score summary (immediate)
		revealLayer = 1;

		// Layer 2: True rankings
		setTimeout(() => {
			revealLayer = 2;
		}, REVEAL_DELAY_RANKINGS);

		// Layer 3: Crowd stats and sources
		setTimeout(() => {
			revealLayer = 3;
		}, REVEAL_DELAY_STATS);

		// Update countdown timer
		nextPuzzleTime = calculateTimeUntilNextPuzzle();
		interval = setInterval(() => {
			nextPuzzleTime = calculateTimeUntilNextPuzzle();
		}, COUNTDOWN_INTERVAL);

		return () => {
			if (interval) clearInterval(interval);
		};
	});

	const trueTop5 = $derived(
		Object.entries(results.puzzle.true_rankings)
			.filter(([_, rank]) => rank <= TOP_N)
			.sort((a, b) => a[1] - b[1])
	);

	const captainCorrect = $derived(results.puzzle.true_rankings[results.submission.captain] === TOP_RANK);

	function handleShare() {
		showShareModal = true;
	}

	function closeShareModal() {
		showShareModal = false;
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="text-center mb-6">
		<p class="text-sm {theme.neutral.text} mb-2">Topick #{puzzle.puzzle_number}</p>
		<h1 class="text-2xl font-bold {theme.neutral.textStrong} mb-1">{puzzle.prompt}</h1>
		<p class="text-sm {theme.neutral.text}">{formatDate(puzzle.daily_date)}</p>
	</div>

	<!-- Layer 1: Score Summary -->
	{#if revealLayer >= 1}
		<div class="bg-pearl-aqua-600 dark:bg-pearl-aqua-500 text-white rounded-lg p-8 shadow-xl animate-fadeInUp mb-6">
			<div class="text-center">
				<p class="text-sm uppercase tracking-wide opacity-80 mb-2">Your Score</p>
				<h2 class="text-6xl font-bold mb-4">{results.submission.total_score}/{MAX_TOTAL_SCORE}</h2>
				<div class="flex items-center justify-center gap-6 text-lg">
					<div class="flex items-center gap-2">
						<Icon src={Check} mini size="20" />
						<span>{results.submission.base_score}/{TOP_N} in top {TOP_N}</span>
					</div>
					<div class="opacity-50">•</div>
					<div class="flex items-center gap-2">
						{#if captainCorrect}
							<Icon src={Star} mini size="20" />
							<span>Nailed #1! (+{CAPTAIN_BONUS})</span>
						{:else}
							<Icon src={XMark} mini size="20" />
							<span>Missed #1</span>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Layer 2: Your Guesses vs Reality -->
	{#if revealLayer >= 2}
		<div class="animate-fadeInUp space-y-6">
			<!-- Section Header -->
			<div class="text-center">
				<h3 class="text-2xl font-bold {theme.neutral.textStrong} mb-2">Your Guesses vs Reality</h3>
				<p class="text-sm {theme.neutral.text}">Here's how you did</p>
			</div>

			<!-- The Actual Top 5 -->
			<div class="{theme.card.bg} rounded-lg border {theme.card.border} p-6">
				<h4 class="text-lg font-bold {theme.neutral.textStrong} mb-4 flex items-center gap-2">
					<Icon src={Check} mini size="20" class={theme.primary.text} />
					The Actual Top 5
				</h4>
				<div class="space-y-2">
					{#each trueTop5 as [item, rank]}
						{@const youPicked = results.submission.drafted_items.includes(item)}
						{@const yourTopPick = results.submission.captain === item}

						<div class="flex items-center gap-3 p-3 rounded-lg {youPicked ? theme.success.bgLight : theme.neutral.bgLight}">
							<div class="flex items-center justify-center w-10 h-10 rounded-full {youPicked ? `${theme.success.bg} text-white` : `${theme.disabled.bg} ${theme.disabled.text}`} font-bold text-lg">
								{rank}
							</div>
							<div class="flex-1">
								<p class="font-semibold {theme.neutral.textStrong}">{item}</p>
							</div>
							<div class="flex items-center gap-2">
								{#if youPicked}
									<div class="flex items-center gap-1 px-3 py-1 {theme.success.bg} text-white rounded-full text-sm font-medium">
										<Icon src={Check} mini size="14" />
										You got this!
									</div>
								{:else}
									<div class="flex items-center gap-1 px-3 py-1 {theme.neutral.bg} dark:bg-gray-600 text-white rounded-full text-sm">
										<Icon src={XMark} mini size="14" />
										Missed
									</div>
								{/if}
								{#if yourTopPick}
									<div class="flex items-center gap-1 px-3 py-1 {theme.accent.bg} {theme.accent.text} rounded-full text-sm font-bold">
										<Icon src={Star} mini size="14" />
										Your #1
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Your Incorrect Guesses (if any) -->
			{#if results.submission.drafted_items.filter((item) => !trueTop5.map(([i]) => i).includes(item)).length > 0}
				{@const incorrectGuesses = results.submission.drafted_items.filter(
					(item) => !trueTop5.map(([i]) => i).includes(item)
				)}
				<div class="{theme.error.bgLight} rounded-lg border {theme.error.border} p-6">
					<h4 class="text-lg font-bold {theme.error.text} mb-4 flex items-center gap-2">
						<Icon src={XMark} mini size="20" />
						Items You Picked (But Weren't in Top 5)
					</h4>
					<div class="space-y-2">
						{#each incorrectGuesses as item}
							{@const yourTopPick = results.submission.captain === item}
							{@const actualRank = results.puzzle.true_rankings[item]}

							<div class="flex items-center gap-3 p-3 rounded-lg {theme.card.bg}">
								<div class="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold">
									{actualRank}
								</div>
								<div class="flex-1">
									<p class="font-semibold {theme.neutral.textStrong}">{item}</p>
									<p class="text-sm {theme.neutral.text}">Actually ranked #{actualRank}</p>
								</div>
								{#if yourTopPick}
									<div class="flex items-center gap-1 px-3 py-1 {theme.accent.bg} {theme.accent.text} rounded-full text-sm font-bold">
										<Icon src={Star} mini size="14" />
										Your #1 pick
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Layer 3: Crowd Stats and Sources -->
	{#if revealLayer >= 3}
		<div class="space-y-6 animate-fadeInUp">
			<!-- Crowd Statistics -->
			<div class="{theme.card.bg} rounded-lg border {theme.card.border} p-6">
				<h3 class="text-xl font-bold {theme.neutral.textStrong} mb-2">How Everyone Else Guessed</h3>
				<p class="text-sm {theme.neutral.text} mb-4">See what percentage of players selected each item</p>
				<!-- Mobile: stacked cards -->
				<div class="sm:hidden space-y-3">
					{#each results.crowd_stats as stat}
						{@const youPicked = results.submission.drafted_items.includes(stat.item_name)}
						<div class="p-3 rounded-lg {youPicked ? theme.success.bgLight : theme.neutral.bgLight}">
							<div class="flex items-center gap-2 mb-2">
								<span class="text-sm font-bold {theme.neutral.textStrong}">#{stat.rank}</span>
								<span class="text-sm font-medium {theme.neutral.textStrong} flex-1 min-w-0 truncate">{stat.item_name}</span>
								{#if youPicked}
									<span class="text-xs {theme.primary.text} flex-shrink-0">You</span>
								{/if}
							</div>
							<div class="space-y-1.5">
								<div class="flex items-center gap-2">
									<span class="text-xs {theme.neutral.text} w-16 flex-shrink-0">Picked</span>
									<div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2" role="progressbar" aria-valuenow={stat.drafted_percentage} aria-valuemin={0} aria-valuemax={100} aria-label="{stat.item_name} drafted percentage">
										<div class="bg-pearl-aqua-600 h-2 rounded-full" style="width: {stat.drafted_percentage}%"></div>
									</div>
									<span class="text-sm font-medium {theme.neutral.textStrong} w-10 text-right">{stat.drafted_percentage}%</span>
								</div>
								<div class="flex items-center gap-2">
									<span class="text-xs {theme.neutral.text} w-16 flex-shrink-0">Made #1</span>
									<div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2" role="progressbar" aria-valuenow={stat.captained_percentage} aria-valuemin={0} aria-valuemax={100} aria-label="{stat.item_name} captained percentage">
										<div class="bg-jasmine-500 h-2 rounded-full" style="width: {stat.captained_percentage}%"></div>
									</div>
									<span class="text-sm font-medium {theme.neutral.textStrong} w-10 text-right">{stat.captained_percentage}%</span>
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Desktop: table -->
				<div class="hidden sm:block overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="border-b-2 {theme.card.border}">
								<th class="px-4 py-3 text-left text-xs font-bold {theme.neutral.textStrong} uppercase">
									Rank
								</th>
								<th class="px-4 py-3 text-left text-xs font-bold {theme.neutral.textStrong} uppercase">
									Item
								</th>
								<th class="px-4 py-3 text-center text-xs font-bold {theme.neutral.textStrong} uppercase">
									% Who Picked It
								</th>
								<th class="px-4 py-3 text-center text-xs font-bold {theme.neutral.textStrong} uppercase">
									% Who Made It #1
								</th>
							</tr>
						</thead>
						<tbody class="divide-y {theme.card.border}">
							{#each results.crowd_stats as stat}
								{@const youPicked = results.submission.drafted_items.includes(stat.item_name)}
								<tr class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors {youPicked ? 'bg-pearl-aqua-50 dark:bg-pearl-aqua-900/10' : ''}">
									<td class="px-4 py-3 text-sm font-bold {theme.neutral.textStrong}">
										#{stat.rank}
									</td>
									<td class="px-4 py-3 text-sm font-medium {theme.neutral.textStrong}">
										{stat.item_name}
										{#if youPicked}
											<span class="text-xs {theme.primary.text} ml-2">(You picked this)</span>
										{/if}
									</td>
									<td class="px-4 py-3 text-center">
										<div class="flex items-center justify-center gap-2">
											<div class="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2" role="progressbar" aria-valuenow={stat.drafted_percentage} aria-valuemin={0} aria-valuemax={100} aria-label="{stat.item_name} drafted percentage">
												<div class="bg-pearl-aqua-600 h-2 rounded-full" style="width: {stat.drafted_percentage}%"></div>
											</div>
											<span class="text-sm font-medium {theme.neutral.textStrong} w-12 text-right">{stat.drafted_percentage}%</span>
										</div>
									</td>
									<td class="px-4 py-3 text-center">
										<div class="flex items-center justify-center gap-2">
											<div class="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2" role="progressbar" aria-valuenow={stat.captained_percentage} aria-valuemin={0} aria-valuemax={100} aria-label="{stat.item_name} captained percentage">
												<div class="bg-jasmine-500 h-2 rounded-full" style="width: {stat.captained_percentage}%"></div>
											</div>
											<span class="text-sm font-medium {theme.neutral.textStrong} w-12 text-right">{stat.captained_percentage}%</span>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

			<!-- Sources -->
			<div class="{theme.info.bg} border {theme.info.border} rounded-lg p-4 overflow-hidden">
				<h4 class="text-sm font-semibold {theme.info.text} mb-2 flex items-center gap-2">
					<Icon src={BookOpen} mini size="16" class="inline" />
					Data Sources:
				</h4>
				<ul class="space-y-1 min-w-0">
					{#each results.sources as source}
						<li class="text-sm {theme.info.linkText} min-w-0">
							{#if source.startsWith('http')}
								<a href={source} target="_blank" rel="noopener noreferrer" class="underline hover:text-amber-600 break-all">
									{source}
								</a>
							{:else}
								<span class="break-all">{source}</span>
							{/if}
						</li>
					{/each}
				</ul>
			</div>

			<!-- Share Button -->
			<button
				onclick={handleShare}
				class="w-full py-4 px-6 {theme.primary.bg} {theme.primary.bgHover} text-white font-bold text-lg rounded-lg transition-colors shadow-lg hover:shadow-xl focus-visible:ring-2 focus-visible:ring-pearl-aqua-300 focus-visible:ring-offset-2 flex items-center justify-center gap-2"
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

<!-- Share Modal -->
{#if showShareModal}
	<ShareModal
		shareText={results.share_text}
		shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
		{results}
		puzzleNumber={puzzle.puzzle_number}
		onClose={closeShareModal}
	/>
{/if}

