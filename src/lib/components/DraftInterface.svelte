<script lang="ts">
	import type { Puzzle } from '$lib/types';
	import { createEventDispatcher } from 'svelte';
	import { Icon, Star, XMark } from 'svelte-hero-icons';

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

	const canSubmit = $derived(draftedItems.length === 5 && captain !== null);

	function handleItemClick(item: string) {
		const isDrafted = draftedItems.includes(item);

		if (!isDrafted && draftedItems.length < 5) {
			// Draft the item
			draftedItems = [...draftedItems, item];
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

<div class="fade-in">
	<header class="text-center mb-8">
		<p class="text-sm text-gray-500 dark:text-gray-400 font-medium mb-2">Topick #{puzzle.puzzle_number}</p>
		<h1 class="text-3xl font-bold mb-4 text-gray-900 dark:text-white">{puzzle.prompt}</h1>
	</header>

	<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
		<div class="text-gray-600 dark:text-gray-400 mb-4 space-y-1">
			<p class="font-semibold">Which of these are in the top 5?</p>
			<p class="text-sm">Then: Which one is #1?</p>
		</div>

		<div class="grid gap-3">
			{#each puzzle.items as item}
				{@const isDrafted = draftedItems.includes(item)}
				{@const isCaptain = captain === item}
				{@const isDisabled = !isDrafted && draftedItems.length >= 5}

				<div
					class="relative w-full px-4 py-3 rounded-lg border-2 transition-all {isDrafted
						? 'border-pearl-aqua-600 dark:border-pearl-aqua-500 bg-pearl-aqua-50 dark:bg-pearl-aqua-900/50'
						: isDisabled
							? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 opacity-50 cursor-not-allowed'
							: 'border-gray-300 dark:border-gray-600 hover:border-pearl-aqua-400 dark:hover:border-pearl-aqua-500 bg-white dark:bg-gray-700 cursor-pointer'}"
					onclick={() => !isDrafted && handleItemClick(item)}
				>
					<div class="flex items-center justify-between gap-3">
						<span class="font-medium text-gray-900 dark:text-white">{item}</span>
						{#if isDrafted}
							<div class="flex items-center gap-2">
								<button
									onclick={(e) => {
										e.stopPropagation();
										handleToggleCaptain(item);
									}}
									class="p-1.5 rounded transition-colors {isCaptain
										? 'bg-jasmine-500 text-gray-900 hover:bg-jasmine-600'
										: 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-400 dark:hover:bg-gray-500'}"
									title={isCaptain ? 'Remove as #1' : 'Make #1'}
								>
									<Icon src={Star} mini size="16" />
								</button>
								<button
									onclick={(e) => {
										e.stopPropagation();
										handleRemoveItem(item);
									}}
									class="p-1 rounded text-gray-500 dark:text-gray-400 hover:bg-pearl-aqua-100 dark:hover:bg-pearl-aqua-900/30 hover:text-pearl-aqua-600 dark:hover:text-pearl-aqua-400 transition-colors"
									title="Remove selection"
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
				<div class="flex items-center gap-2 text-sm text-jasmine-700 dark:text-jasmine-400 bg-jasmine-50 dark:bg-jasmine-900/20 px-4 py-2 rounded-lg">
					<Icon src={Star} mini size="16" />
					<span>Click the <strong>star</strong> on your top choice to mark it as #1</span>
				</div>
			{/if}
			<div class="flex flex-col sm:flex-row items-center justify-between gap-3">
				<div class="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
					Selected: {draftedItems.length}/5
					{#if captain}
						| Your #1: {captain}
					{/if}
				</div>
				<button
					onclick={handleSubmit}
					disabled={!canSubmit}
					class="w-full sm:w-auto px-6 py-3 font-semibold rounded-lg transition-colors {canSubmit
						? 'bg-pearl-aqua-600 text-white hover:bg-pearl-aqua-700 dark:bg-pearl-aqua-500 dark:hover:bg-pearl-aqua-600'
						: 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'}"
				>
					Submit Guesses
				</button>
			</div>
		</div>
	</div>

	<div class="text-center text-sm text-gray-600 dark:text-gray-400">
		<p class="mb-1"><strong>Scoring:</strong> +1 for each correct top 5 guess (max 5)</p>
		<p>+3 bonus if you correctly guess the #1 (max 8 total)</p>
	</div>
</div>

<style>
	.fade-in {
		animation: fadeIn 0.3s ease-out;
	}

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
</style>
