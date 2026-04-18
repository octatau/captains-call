<script lang="ts">
	import type { Puzzle } from '$lib/types';
	import { createEventDispatcher } from 'svelte';
	import { Icon, Star, XMark, QuestionMarkCircle } from 'svelte-hero-icons';
	import HowToPlayModal from './HowToPlayModal.svelte';
	import { theme } from '$lib/theme';
	import { DRAFT_SIZE, MAX_BASE_SCORE, CAPTAIN_BONUS, MAX_TOTAL_SCORE } from '$lib/config/constants';

	interface Props {
		puzzle: Puzzle;
		loading?: boolean;
	}

	let { puzzle, loading = false }: Props = $props();

	const dispatch = createEventDispatcher<{
		submit: { draftedItems: string[]; captain: string };
	}>();

	let draftedItems = $state<string[]>([]);
	let captain = $state<string | null>(null);
	let showHowToPlay = $state(false);

	const canSubmit = $derived(draftedItems.length === DRAFT_SIZE && captain !== null);

	function handleItemClick(item: string) {
		const isDrafted = draftedItems.includes(item);

		if (!isDrafted && draftedItems.length < DRAFT_SIZE) {
			// Draft the item
			draftedItems = [...draftedItems, item];
		}
	}

	function handleItemKeydown(event: KeyboardEvent, item: string) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleItemClick(item);
		}
	}

	function handleRemoveItem(item: string) {
		draftedItems = draftedItems.filter((i) => i !== item);
		if (captain === item) {
			captain = null;
		}
	}

	function handleToggleCaptain(item: string) {
		if (captain === item) {
			captain = null;
		} else {
			captain = item;
		}
	}

	function handleSubmit() {
		if (canSubmit && captain) {
			dispatch('submit', {
				draftedItems,
				captain
			});
		}
	}
</script>

<div class="animate-fadeInUp">
	<div class="text-center mb-8">
		<div class="flex justify-center items-center mb-2 relative">
			<p class="text-sm {theme.neutral.text} font-medium">Topick #{puzzle.puzzle_number}</p>
			<button
				type="button"
				onclick={() => showHowToPlay = true}
				class="absolute right-0 flex items-center gap-1 px-2 py-1 text-xs sm:text-sm {theme.primary.text} hover:bg-pearl-aqua-50 dark:hover:bg-pearl-aqua-900/20 rounded-lg transition-colors"
			>
				<Icon src={QuestionMarkCircle} mini size="16" class="sm:w-[18px] sm:h-[18px]" />
				<span class="hidden sm:inline">How to Play</span>
			</button>
		</div>
		<h1 class="text-2xl sm:text-3xl font-bold mb-4 {theme.neutral.textStrong} px-8 sm:px-0">{puzzle.prompt}</h1>
	</div>

	<div class="{theme.card.bg} rounded-lg shadow-lg p-6 mb-6">
		<div class="{theme.neutral.text} mb-4 space-y-1">
			<p class="font-semibold">Which of these are in the top 5?</p>
			<p class="text-sm">Then: Which one is #1?</p>
		</div>

		<div class="grid gap-3">
			{#each puzzle.items as item}
				{@const isDrafted = draftedItems.includes(item)}
				{@const isCaptain = captain === item}
				{@const isDisabled = !isDrafted && draftedItems.length >= DRAFT_SIZE}

				<div
					role="button"
					tabindex={isDisabled && !isDrafted ? -1 : 0}
					aria-pressed={isDrafted}
					aria-disabled={isDisabled && !isDrafted}
					aria-label={isDrafted && isCaptain ? `${item} - selected, marked as #1` : isDrafted ? `${item} - selected` : isDisabled ? `${item} - unavailable, selection full` : `${item} - click to select`}
					class="relative w-full px-4 py-3 rounded-lg border-2 transition-all text-left focus-visible:ring-2 focus-visible:ring-pearl-aqua-300 focus-visible:ring-offset-2 {isDrafted
						? `${theme.primary.border} ${theme.primary.bgLight}`
						: isDisabled
							? `${theme.neutral.border} ${theme.card.bg} opacity-50 cursor-not-allowed`
							: `${theme.neutral.border} ${theme.primary.borderHover} ${theme.card.bg} cursor-pointer`}"
					onclick={() => !isDrafted && !isDisabled && handleItemClick(item)}
					onkeydown={(e) => !isDrafted && !isDisabled && handleItemKeydown(e, item)}
				>
					<div class="flex items-center justify-between gap-3">
						<span class="font-medium {theme.neutral.textStrong}">{item}</span>
						{#if isDrafted}
							<div class="flex items-center gap-2">
								<button
									type="button"
									onclick={(e) => {
										e.stopPropagation();
										handleToggleCaptain(item);
									}}
									class="min-w-[44px] min-h-[44px] flex items-center justify-center rounded transition-colors {isCaptain
										? `${theme.accent.bg} ${theme.accent.text} ${theme.accent.bgHover}`
										: `${theme.disabled.bg} ${theme.disabled.text} hover:bg-gray-400 dark:hover:bg-gray-500`}"
									aria-label={isCaptain ? `Remove ${item} as #1` : `Make ${item} #1`}
								>
									<Icon src={Star} mini size="16" />
								</button>
								<button
									type="button"
									onclick={(e) => {
										e.stopPropagation();
										handleRemoveItem(item);
									}}
									class="min-w-[44px] min-h-[44px] flex items-center justify-center rounded {theme.disabled.text} hover:bg-pearl-aqua-100 dark:hover:bg-pearl-aqua-900/30 hover:text-pearl-aqua-600 dark:hover:text-pearl-aqua-400 transition-colors"
									aria-label="Remove {item} from selection"
								>
									<Icon src={XMark} mini size="18" />
								</button>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<div class="mt-6 space-y-3">
			{#if draftedItems.length > 0 && !captain}
				<div class="flex items-center gap-2 text-sm {theme.accent.hint} {theme.accent.hintBg} px-4 py-2 rounded-lg">
					<Icon src={Star} mini size="16" />
					<span>Click the <strong>star</strong> on your top choice to mark it as #1</span>
				</div>
			{/if}
			<div class="flex flex-col sm:flex-row items-center justify-between gap-3">
				<div class="text-sm {theme.neutral.text} text-center sm:text-left" aria-live="polite" aria-atomic="true">
					Selected: {draftedItems.length}/{DRAFT_SIZE}
					{#if captain}
						| Your #1: {captain}
					{/if}
				</div>
				<button
					type="button"
					onclick={handleSubmit}
					disabled={!canSubmit}
					class="w-full sm:w-auto px-6 py-3 font-semibold rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-pearl-aqua-300 focus-visible:ring-offset-2 {canSubmit
						? `${theme.primary.bg} text-white ${theme.primary.bgHover}`
						: `${theme.disabled.bg} ${theme.disabled.text} cursor-not-allowed`}"
				>
					Submit Guesses
				</button>
			</div>
		</div>
	</div>

	<div class="text-center text-sm {theme.neutral.text}">
		<p class="mb-1"><strong>Scoring:</strong> +1 for each correct top {DRAFT_SIZE} guess (max {MAX_BASE_SCORE})</p>
		<p>+{CAPTAIN_BONUS} bonus if you correctly guess the #1 (max {MAX_TOTAL_SCORE} total)</p>
	</div>
</div>

{#if showHowToPlay}
	<HowToPlayModal onClose={() => showHowToPlay = false} />
{/if}

