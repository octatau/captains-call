<script lang="ts">
	import type { Results } from '$lib/types';
	import { Icon, Star, Check, XMark } from 'svelte-hero-icons';
	import {
		TOP_RANK,
		TOP_N,
		MAX_TOTAL_SCORE,
		CAPTAIN_BONUS,
		SHARE_CARD_ITEM_TRUNCATE_LENGTH
	} from '$lib/config/constants';

	interface Props {
		results: Results;
		puzzleNumber: number;
	}

	let { results, puzzleNumber }: Props = $props();

	const captainCorrect = $derived(results.puzzle.true_rankings[results.submission.captain] === TOP_RANK);

	// Get true top 5 for display
	const trueTop5 = $derived(
		Object.entries(results.puzzle.true_rankings)
			.filter(([_, rank]) => rank <= TOP_N)
			.sort((a, b) => a[1] - b[1])
	);
</script>

<!-- Share Card - Designed to be captured as image -->
<div class="share-card" style="width: 600px; background: linear-gradient(135deg, #47b8ab 0%, #399388 100%); padding: 40px; border-radius: 16px; font-family: system-ui, -apple-system, sans-serif;">
	<!-- Header -->
	<div style="text-align: center; margin-bottom: 32px;">
		<h1 style="font-size: 48px; font-weight: 800; color: white; margin: 0 0 8px 0; letter-spacing: -0.5px;">
			Topick
		</h1>
		<p style="font-size: 16px; color: rgba(255, 255, 255, 0.9); margin: 0;">
			Guess the Rankings
		</p>
		<p style="font-size: 14px; color: rgba(255, 255, 255, 0.75); margin: 8px 0 0 0;">
			Puzzle #{puzzleNumber}
		</p>
	</div>

	<!-- Score Box -->
	<div style="background: white; border-radius: 12px; padding: 32px; margin-bottom: 24px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);">
		<div style="text-align: center; margin-bottom: 24px;">
			<div style="font-size: 72px; font-weight: 800; color: #399388; line-height: 1; margin-bottom: 8px;">
				{results.submission.total_score}/{MAX_TOTAL_SCORE}
			</div>
			<div style="font-size: 18px; color: #64748b; font-weight: 500;">
				Top {TOP_N}: {results.submission.base_score}/{TOP_N}
				{#if captainCorrect}
					• Nailed the #1! (+{CAPTAIN_BONUS})
				{:else}
					• Missed #1
				{/if}
			</div>
		</div>

		<!-- Results Grid -->
		<div style="margin-top: 24px;">
			{#each trueTop5.slice(0, 5) as [item, rank], i}
				{@const isDrafted = results.submission.drafted_items.includes(item)}
				{@const isCaptain = results.submission.captain === item}

				<div style="display: table; width: 100%; padding: 12px; box-sizing: border-box; background: {isDrafted ? '#edf8f7' : '#f8fafc'}; border-radius: 8px; border: 2px solid {isDrafted ? '#47b8ab' : '#e2e8f0'};{i < 4 ? ' margin-bottom: 12px;' : ''}">
					<div style="display: table-cell; vertical-align: middle; font-size: 20px; font-weight: 700; color: #64748b; width: 44px; text-align: center; padding-right: 12px;">
						#{rank}
					</div>
					<div style="display: table-cell; vertical-align: middle; font-size: 16px; font-weight: 600; color: #0f172a; padding-right: 12px;">
						{item.length > SHARE_CARD_ITEM_TRUNCATE_LENGTH ? item.slice(0, SHARE_CARD_ITEM_TRUNCATE_LENGTH) + '...' : item}
					</div>
					<div style="display: table-cell; vertical-align: middle; text-align: right; white-space: nowrap;">
						{#if isDrafted}
							<span style="display: inline-block; vertical-align: middle; background: #47b8ab; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
								✓
							</span>
						{:else}
							<span style="display: inline-block; vertical-align: middle; background: #94a3b8; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
								✗
							</span>
						{/if}
						{#if isCaptain}
							<span style="display: inline-block; vertical-align: middle; background: #edb312; color: #0f172a; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; margin-left: 6px;">
								★ #1
							</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Footer -->
	<div style="text-align: center; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500;">
		{#if typeof window !== 'undefined'}
			Play daily at {window.location.hostname}
		{:else}
			Play Topick daily
		{/if}
	</div>
</div>

<style>
	.share-card {
		/* Ensure consistent rendering for canvas capture */
		box-sizing: border-box;
	}
</style>
