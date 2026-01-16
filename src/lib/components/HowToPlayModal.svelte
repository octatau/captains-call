<script lang="ts">
	import { Icon, XMark, Star } from 'svelte-hero-icons';
	import { theme } from '$lib/theme';

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}
</script>

<!-- Modal Backdrop -->
<div
	onclick={handleBackdropClick}
	class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn"
>
	<!-- Modal Content -->
	<div
		class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-lg w-full relative animate-scaleIn my-8 max-h-[90vh] flex flex-col"
	>
		<!-- Close Button -->
		<button
			onclick={onClose}
			class="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
			aria-label="Close"
		>
			<Icon src={XMark} size="24" class="text-gray-500 dark:text-gray-400" />
		</button>

		<!-- Scrollable Content -->
		<div class="overflow-y-auto flex-1 p-4 sm:p-6">
			<!-- Header -->
			<div class="mb-4 sm:mb-6">
				<h2 class="text-xl sm:text-2xl font-bold {theme.neutral.textStrong} mb-2">How to Play</h2>
				<p class="text-sm {theme.neutral.text}">
					Daily ranking game - can you guess the top 5?
				</p>
			</div>

			<!-- Steps -->
			<div class="space-y-4 sm:space-y-6 mb-4 sm:mb-6">
				<!-- Step 1 -->
				<div class="flex gap-3">
					<div class="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-pearl-aqua-600 dark:bg-pearl-aqua-500 text-white flex items-center justify-center font-bold text-sm">
						1
					</div>
					<div class="flex-1">
						<h3 class="font-bold {theme.neutral.textStrong} mb-1 text-sm sm:text-base">Pick Your Top 5</h3>
						<p class="text-xs sm:text-sm {theme.neutral.text}">
							Click on 5 items you think are in the actual top 5 for the given category. Your selections will be highlighted.
						</p>
					</div>
				</div>

				<!-- Step 2 -->
				<div class="flex gap-3">
					<div class="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-pearl-aqua-600 dark:bg-pearl-aqua-500 text-white flex items-center justify-center font-bold text-sm">
						2
					</div>
					<div class="flex-1">
						<h3 class="font-bold {theme.neutral.textStrong} mb-1 flex items-center gap-2 text-sm sm:text-base">
							Mark Your #1 Pick
							<span class="inline-flex items-center justify-center p-1.5 rounded bg-jasmine-500 text-gray-900">
								<Icon src={Star} mini size="14" />
							</span>
						</h3>
						<p class="text-xs sm:text-sm {theme.neutral.text}">
							Click the star button on one of your selected items to mark it as your #1 guess. This is worth bonus points!
						</p>
					</div>
				</div>

				<!-- Step 3 -->
				<div class="flex gap-3">
					<div class="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-pearl-aqua-600 dark:bg-pearl-aqua-500 text-white flex items-center justify-center font-bold text-sm">
						3
					</div>
					<div class="flex-1">
						<h3 class="font-bold {theme.neutral.textStrong} mb-1 text-sm sm:text-base">Submit & See Results</h3>
						<p class="text-xs sm:text-sm {theme.neutral.text}">
							Once you've selected 5 items and marked your #1, submit your guesses to see how you did!
						</p>
					</div>
				</div>
			</div>

			<div class="border-t {theme.neutral.border} my-4 sm:my-6"></div>

			<!-- Scoring -->
			<div class="bg-pearl-aqua-50 dark:bg-pearl-aqua-900/20 rounded-lg p-3 sm:p-4">
				<h3 class="font-bold {theme.neutral.textStrong} mb-2 sm:mb-3 text-sm sm:text-base">Scoring System</h3>
				<div class="space-y-1.5 sm:space-y-2 text-xs sm:text-sm {theme.neutral.text}">
					<div class="flex items-start gap-2">
						<span class="font-bold text-pearl-aqua-700 dark:text-pearl-aqua-400">+1 point</span>
						<span>for each item correctly in the top 5 (maximum 5 points)</span>
					</div>
					<div class="flex items-start gap-2">
						<span class="font-bold text-jasmine-600 dark:text-jasmine-400">+3 bonus</span>
						<span>if your #1 pick is actually ranked #1 (maximum 8 points total)</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Sticky Close Button -->
		<div class="border-t {theme.neutral.border} p-4 sm:p-6 bg-white dark:bg-gray-800">
			<button
				onclick={onClose}
				class="w-full px-6 py-3 bg-pearl-aqua-600 hover:bg-pearl-aqua-700 dark:bg-pearl-aqua-500 dark:hover:bg-pearl-aqua-600 text-white font-semibold rounded-lg transition-colors"
			>
				Got It!
			</button>
		</div>
	</div>
</div>

<style>
	.animate-fadeIn {
		animation: fadeIn 0.2s ease-out;
	}

	.animate-scaleIn {
		animation: scaleIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes scaleIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
