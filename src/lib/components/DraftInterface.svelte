<script lang="ts">
	import type { Puzzle } from '$lib/types';
	import { createEventDispatcher } from 'svelte';

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
			// Clicking captain removes captain status
			captain = null;
		} else if (isDrafted) {
			// Clicking drafted item makes it captain
			captain = item;
		} else if (draftedItems.length < 5) {
			// Draft the item
			draftedItems = [...draftedItems, item];
		}
	}

	function handleUndraft(item: string) {
		if (captain === item) {
			captain = null;
		}
		draftedItems = draftedItems.filter((i) => i !== item);
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

<div class="space-y-6">
	<!-- Header -->
	<div class="text-center">
		<h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
			Daily Draft #{puzzle.puzzle_number}
		</h1>
		<p class="text-xl text-gray-700 dark:text-gray-300">{puzzle.prompt}</p>
	</div>

	<!-- Instructions -->
	<div class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
		<p class="text-sm text-blue-900 dark:text-blue-100">
			<strong>How to play:</strong> Click to draft (max 5), click again to make Captain ⭐, click once more to undraft.
		</p>
	</div>

	<!-- Draft Progress -->
	<div class="text-center">
		<p class="text-lg font-semibold text-gray-700 dark:text-gray-300">
			Drafted: {draftedItems.length}/5
			{#if captain}
				• Captain: {captain}
			{/if}
		</p>
	</div>

	<!-- Drafted Items Display -->
	{#if draftedItems.length > 0}
		<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
			<h3 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Your Draft:</h3>
			<div class="flex flex-wrap gap-2">
				{#each draftedItems as item}
					<button
						onclick={() => handleUndraft(item)}
						class="px-3 py-1.5 rounded-full text-sm font-medium transition-all
							{captain === item
								? 'bg-yellow-400 text-black border-2 border-yellow-600'
								: 'bg-blue-500 text-white hover:bg-blue-600'}
							hover:scale-105"
					>
						{#if captain === item}⭐{/if}
						{item}
						<span class="ml-1 text-xs opacity-75">✕</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Items Grid -->
	<div class="grid grid-cols-2 gap-3">
		{#each puzzle.items as item}
			{@const isDrafted = draftedItems.includes(item)}
			{@const isCaptain = captain === item}
			{@const isDisabled = !isDrafted && draftedItems.length >= 5}

			<button
				onclick={() => handleItemClick(item)}
				disabled={isDisabled}
				class="p-4 rounded-lg border-2 transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
					{isCaptain
						? 'border-yellow-500 bg-yellow-500/10 dark:bg-yellow-500/20'
						: isDrafted
							? 'border-blue-500 bg-blue-500/10 dark:bg-blue-500/20'
							: 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-400'}"
			>
				<div class="flex flex-col gap-2">
					<span class="font-semibold text-gray-900 dark:text-white">{item}</span>
					<div class="flex gap-2 text-xs">
						{#if isDrafted}
							<span class="bg-blue-600 text-white px-2 py-1 rounded">Drafted</span>
						{/if}
						{#if isCaptain}
							<span class="bg-yellow-500 text-black px-2 py-1 rounded font-bold">⭐ Captain</span>
						{/if}
					</div>
				</div>
			</button>
		{/each}
	</div>

	<!-- Submit Button -->
	<button
		onclick={handleSubmit}
		disabled={!canSubmit || loading}
		class="w-full py-4 px-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed
			text-white font-bold text-lg rounded-lg transition-colors shadow-lg hover:shadow-xl
			disabled:hover:shadow-lg"
	>
		{#if loading}
			<span class="flex items-center justify-center gap-2">
				<span class="animate-spin">⏳</span>
				Submitting...
			</span>
		{:else if !canSubmit}
			Select 5 items and a Captain to submit
		{:else}
			Submit Your Draft
		{/if}
	</button>
</div>
