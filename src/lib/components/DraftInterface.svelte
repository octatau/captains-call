<script lang="ts">
	import type { Puzzle } from '$lib/types';
	import { createEventDispatcher } from 'svelte';
	import { Icon, Star } from 'svelte-hero-icons';

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
		const isCaptain = captain === item;

		if (isCaptain) {
			// Clicking captain cycles back to undrafted
			captain = null;
			draftedItems = draftedItems.filter((i) => i !== item);
		} else if (isDrafted) {
			// Clicking drafted item makes it captain
			captain = item;
		} else if (draftedItems.length < 5) {
			// Draft the item
			draftedItems = [...draftedItems, item];
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
		<h1 class="text-4xl font-bold mb-2 text-gray-900 dark:text-white">Topick</h1>
		<p class="text-sm text-gray-500 dark:text-gray-500 font-medium">Guess the Rankings</p>
		<p class="text-gray-600 dark:text-gray-400">Puzzle #{puzzle.puzzle_number}</p>
	</header>

	<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
		<h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{puzzle.prompt}</h2>
		<div class="text-gray-600 dark:text-gray-400 mb-4 space-y-1">
			<p class="font-semibold">Which of these are in the top 5?</p>
			<p class="text-sm">Then: Which one is #1?</p>
		</div>

		<div class="grid gap-3">
			{#each puzzle.items as item}
				{@const isDrafted = draftedItems.includes(item)}
				{@const isCaptain = captain === item}
				{@const draftIndex = draftedItems.indexOf(item)}
				{@const isDisabled = !isDrafted && draftedItems.length >= 5}

				<button
					onclick={() => handleItemClick(item)}
					disabled={isDisabled}
					class="relative w-full text-left px-4 py-3 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed {isDrafted
						? 'border-pearl-aqua-600 dark:border-pearl-aqua-500 bg-pearl-aqua-50 dark:bg-pearl-aqua-900/50'
						: 'border-gray-300 dark:border-gray-600 hover:border-pearl-aqua-400 dark:hover:border-pearl-aqua-500 bg-white dark:bg-gray-700'}"
				>
					<div class="flex items-center justify-between">
						<span class="font-medium text-gray-900 dark:text-white">{item}</span>
						<div class="flex items-center gap-2">
							{#if isDrafted && !isCaptain}
								<span class="text-pearl-aqua-600 dark:text-pearl-aqua-400 text-sm font-semibold">Selected</span>
							{/if}
							{#if isCaptain}
								<span class="px-2 py-0.5 text-xs font-bold bg-jasmine-500 text-gray-900 rounded flex items-center gap-1">
									<Icon src={Star} mini size="14" class="inline" />
									YOUR #1
								</span>
							{/if}
						</div>
					</div>
				</button>
			{/each}
		</div>

		<div class="mt-6 flex items-center justify-between">
			<div class="text-sm text-gray-600 dark:text-gray-400">
				Selected: {draftedItems.length}/5
				{#if captain}
					| Your #1: {captain}
				{/if}
			</div>
			<button
				onclick={handleSubmit}
				disabled={!canSubmit}
				class="px-6 py-3 font-semibold rounded-lg transition-colors {canSubmit
					? 'bg-pearl-aqua-600 text-white hover:bg-pearl-aqua-700 dark:bg-pearl-aqua-500 dark:hover:bg-pearl-aqua-600'
					: 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'}"
			>
				Submit Guesses
			</button>
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
