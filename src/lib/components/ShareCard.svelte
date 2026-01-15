<script lang="ts">
	import type { Results } from '$lib/types';
	import { Icon, Star, Check, XMark } from 'svelte-hero-icons';

	interface Props {
		results: Results;
		puzzleNumber: number;
	}

	let { results, puzzleNumber }: Props = $props();

	const captainCorrect = $derived(results.puzzle.true_rankings[results.submission.captain] === 1);

	// Get true top 5 for display
	const trueTop5 = $derived(
		Object.entries(results.puzzle.true_rankings)
			.filter(([_, rank]) => rank <= 5)
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
				{results.submission.total_score}/8
			</div>
			<div style="font-size: 18px; color: #64748b; font-weight: 500;">
				Top 5: {results.submission.base_score}/5
				{#if captainCorrect}
					• Nailed the #1! (+3)
				{:else}
					• Missed #1
				{/if}
			</div>
		</div>

		<!-- Results Grid -->
		<div style="display: grid; gap: 12px; margin-top: 24px;">
			{#each trueTop5.slice(0, 5) as [item, rank]}
				{@const isDrafted = results.submission.drafted_items.includes(item)}
				{@const isCaptain = results.submission.captain === item}

				<div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: {isDrafted ? '#edf8f7' : '#f8fafc'}; border-radius: 8px; border: 2px solid {isDrafted ? '#47b8ab' : '#e2e8f0'};">
					<div style="font-size: 20px; font-weight: 700; color: #64748b; width: 32px; text-align: center;">
						#{rank}
					</div>
					<div style="flex: 1; font-size: 16px; font-weight: 600; color: #0f172a;">
						{item.length > 30 ? item.slice(0, 30) + '...' : item}
					</div>
					<div style="display: flex; gap: 6px; align-items: center;">
						{#if isDrafted}
							<div style="background: #47b8ab; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
								✓
							</div>
						{:else}
							<div style="background: #94a3b8; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
								✗
							</div>
						{/if}
						{#if isCaptain}
							<div style="background: #edb312; color: #0f172a; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 700;">
								★ #1
							</div>
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
