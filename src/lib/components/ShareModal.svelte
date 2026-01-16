<script lang="ts">
	import { Icon, XMark, ClipboardDocument, Share as ShareIcon, Photo, ArrowDownTray } from 'svelte-hero-icons';
	import { theme } from '$lib/theme';
	import { generateImageFromElement, downloadImage, shareImage, copyImageToClipboard } from '$lib/utils';
	import ShareCard from './ShareCard.svelte';
	import type { Results } from '$lib/types';

	interface Props {
		shareText: string;
		shareUrl?: string;
		results: Results;
		puzzleNumber: number;
		onClose: () => void;
	}

	let { shareText, shareUrl = '', results, puzzleNumber, onClose }: Props = $props();

	let copied = $state(false);
	let generatingImage = $state(false);
	let shareCardElement: HTMLElement;
	let imageGenerated = $state(false);
	let showToast = $state(false);
	let toastMessage = $state('');

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(shareText);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	async function useNativeShare() {
		if (navigator.share) {
			try {
				await navigator.share({
					text: shareText,
					url: shareUrl
				});
				onClose();
			} catch (err) {
				if (err instanceof Error && err.name !== 'AbortError') {
					console.error('Share failed:', err);
				}
			}
		}
	}

	async function shareOnTwitter() {
		const text = encodeURIComponent(shareText + (shareUrl ? `\n\n${shareUrl}` : ''));
		await copyImageAndOpenPlatform(`https://twitter.com/intent/tweet?text=${text}`, 'X/Twitter');
	}

	async function shareOnFacebook() {
		const url = encodeURIComponent(shareUrl || window.location.href);
		await copyImageAndOpenPlatform(`https://www.facebook.com/sharer/sharer.php?u=${url}`, 'Facebook');
	}

	async function shareOnLinkedIn() {
		const url = encodeURIComponent(shareUrl || window.location.href);
		await copyImageAndOpenPlatform(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, 'LinkedIn');
	}

	async function shareOnReddit() {
		const title = encodeURIComponent(shareText.split('\n')[0]);
		const url = encodeURIComponent(shareUrl || window.location.href);
		await copyImageAndOpenPlatform(`https://reddit.com/submit?title=${title}&url=${url}`, 'Reddit');
	}

	function shareViaEmail() {
		const subject = encodeURIComponent('Check out my Topick score!');
		const body = encodeURIComponent(shareText + (shareUrl ? `\n\n${shareUrl}` : ''));
		window.location.href = `mailto:?subject=${subject}&body=${body}`;
		onClose();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	async function handleDownloadImage() {
		if (!shareCardElement) return;

		generatingImage = true;
		try {
			const blob = await generateImageFromElement(shareCardElement);
			if (blob) {
				downloadImage(blob, `topick-${puzzleNumber}.png`);
				imageGenerated = true;
			}
		} finally {
			generatingImage = false;
		}
	}

	async function handleShareImage() {
		if (!shareCardElement) return;

		generatingImage = true;
		try {
			const blob = await generateImageFromElement(shareCardElement);
			if (blob) {
				const shared = await shareImage(blob, `topick-${puzzleNumber}.png`, shareText);
				imageGenerated = true;
				if (shared) {
					onClose();
				}
			}
		} finally {
			generatingImage = false;
		}
	}

	async function handleCopyImage() {
		if (!shareCardElement) return;

		generatingImage = true;
		try {
			const blob = await generateImageFromElement(shareCardElement);
			if (blob) {
				const success = await copyImageToClipboard(blob);
				if (success) {
					copied = true;
					setTimeout(() => {
						copied = false;
					}, 2000);
				}
				imageGenerated = true;
			}
		} finally {
			generatingImage = false;
		}
	}

	function showToastNotification(message: string) {
		toastMessage = message;
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 4000);
	}

	async function copyImageAndOpenPlatform(platformUrl: string, platformName: string) {
		if (!shareCardElement) return;

		// Try to copy image first
		try {
			const blob = await generateImageFromElement(shareCardElement);
			if (blob) {
				const success = await copyImageToClipboard(blob);
				if (success) {
					showToastNotification(`Image copied! Paste it in your ${platformName} post (Ctrl/Cmd+V)`);
				} else {
					showToastNotification(`Opening ${platformName}. Download the image below to attach it.`);
				}
			}
		} catch (error) {
			console.error('Failed to copy image:', error);
			showToastNotification(`Opening ${platformName}. Download the image below to attach it.`);
		}

		// Open platform compose window
		window.open(platformUrl, '_blank', 'width=550,height=420');
	}
</script>

<!-- Modal Backdrop -->
<div
	onclick={handleBackdropClick}
	class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn"
>
	<!-- Modal Content -->
	<div
		class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full relative animate-scaleIn my-8 max-h-[90vh] overflow-y-auto"
	>
		<!-- Close Button -->
		<button
			onclick={onClose}
			class="sticky top-4 right-4 float-right p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10 bg-white dark:bg-gray-800"
			aria-label="Close"
		>
			<Icon src={XMark} size="24" class="text-gray-500 dark:text-gray-400" />
		</button>

		<div class="p-4 sm:p-6">
		<!-- Header -->
		<div class="mb-4 sm:mb-6">
			<h2 class="text-xl sm:text-2xl font-bold {theme.neutral.textStrong} mb-2">Share Your Results</h2>
			<div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 sm:p-4 {theme.neutral.text} text-sm sm:text-base whitespace-pre-line">
				{shareText}
			</div>
		</div>

		<!-- Image Generation Section -->
		<div class="mb-4 sm:mb-6">
			<h3 class="text-sm font-semibold {theme.neutral.textStrong} mb-2 sm:mb-3">Share as Image</h3>
			<div class="grid grid-cols-2 gap-3">
				<!-- Download Image -->
				<button
					onclick={handleDownloadImage}
					disabled={generatingImage}
					class="flex items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg {theme.primary.bg} hover:bg-pearl-aqua-700 dark:hover:bg-pearl-aqua-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if generatingImage}
						<div class="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
					{:else}
						<Icon src={ArrowDownTray} size="18" class="sm:w-5 sm:h-5" />
					{/if}
					<span class="font-medium text-sm sm:text-base">Download</span>
				</button>

				<!-- Share Image (Native) -->
				{#if navigator.share}
					<button
						onclick={handleShareImage}
						disabled={generatingImage}
						class="flex items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg {theme.primary.bg} hover:bg-pearl-aqua-700 dark:hover:bg-pearl-aqua-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if generatingImage}
							<div class="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
						{:else}
							<Icon src={ShareIcon} size="18" class="sm:w-5 sm:h-5" />
						{/if}
						<span class="font-medium text-sm sm:text-base">Share</span>
					</button>
				{:else}
					<!-- Copy Image -->
					<button
						onclick={handleCopyImage}
						disabled={generatingImage}
						class="flex items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg {theme.primary.bg} hover:bg-pearl-aqua-700 dark:hover:bg-pearl-aqua-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if generatingImage}
							<div class="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
						{:else}
							<Icon src={Photo} size="18" class="sm:w-5 sm:h-5" />
						{/if}
						<span class="font-medium text-sm sm:text-base">{copied ? 'Copied!' : 'Copy Image'}</span>
					</button>
				{/if}
			</div>
		</div>

		<div class="border-t {theme.neutral.border} my-3 sm:my-4"></div>

		<!-- Share Options -->
		<div class="space-y-2 sm:space-y-3">
			<h3 class="text-sm font-semibold {theme.neutral.textStrong} mb-2 sm:mb-3">Share on Social Media</h3>
			<p class="text-xs {theme.neutral.text} mb-2 sm:mb-3">Click a platform below - the image will be copied to your clipboard, then paste it in your post!</p>
			<!-- Copy to Clipboard -->
			<button
				onclick={copyToClipboard}
				class="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border-2 {theme.neutral.border} hover:border-pearl-aqua-500 dark:hover:border-pearl-aqua-400 transition-all {theme.card.bg}"
			>
				<Icon src={ClipboardDocument} size="20" class="{theme.primary.text} sm:w-6 sm:h-6" />
				<span class="flex-1 text-left font-medium text-sm sm:text-base {theme.neutral.textStrong}">
					{copied ? 'Copied!' : 'Copy to Clipboard'}
				</span>
			</button>

			<!-- Native Share (Mobile) -->
			{#if navigator.share}
				<button
					onclick={useNativeShare}
					class="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border-2 {theme.neutral.border} hover:border-pearl-aqua-500 dark:hover:border-pearl-aqua-400 transition-all {theme.card.bg}"
				>
					<Icon src={ShareIcon} size="20" class="{theme.primary.text} sm:w-6 sm:h-6" />
					<span class="flex-1 text-left font-medium text-sm sm:text-base {theme.neutral.textStrong}">Share via...</span>
				</button>
			{/if}

			<!-- Social Platforms -->
			<div class="grid grid-cols-2 gap-2 sm:gap-3">
				<!-- Twitter/X -->
				<button
					onclick={shareOnTwitter}
					class="flex items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg bg-black hover:bg-gray-800 text-white transition-colors"
				>
					<svg class="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
					</svg>
					<span class="font-medium text-sm sm:text-base">X</span>
				</button>

				<!-- Facebook -->
				<button
					onclick={shareOnFacebook}
					class="flex items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg bg-[#1877F2] hover:bg-[#166FE5] text-white transition-colors"
				>
					<svg class="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
					</svg>
					<span class="font-medium text-sm sm:text-base">Facebook</span>
				</button>

				<!-- LinkedIn -->
				<button
					onclick={shareOnLinkedIn}
					class="flex items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg bg-[#0A66C2] hover:bg-[#095196] text-white transition-colors"
				>
					<svg class="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
					</svg>
					<span class="font-medium text-sm sm:text-base">LinkedIn</span>
				</button>

				<!-- Reddit -->
				<button
					onclick={shareOnReddit}
					class="flex items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg bg-[#FF4500] hover:bg-[#E03D00] text-white transition-colors"
				>
					<svg class="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
					</svg>
					<span class="font-medium text-sm sm:text-base">Reddit</span>
				</button>
			</div>

			<!-- Email -->
			<button
				onclick={shareViaEmail}
				class="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border-2 {theme.neutral.border} hover:border-pearl-aqua-500 dark:hover:border-pearl-aqua-400 transition-all {theme.card.bg}"
			>
				<svg class="w-5 h-5 sm:w-6 sm:h-6 {theme.primary.text}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
				</svg>
				<span class="flex-1 text-left font-medium text-sm sm:text-base {theme.neutral.textStrong}">Share via Email</span>
			</button>
		</div>
		</div>
	</div>
</div>

<!-- Hidden Share Card for Image Generation -->
<div style="position: absolute; left: -9999px; top: 0;">
	<div bind:this={shareCardElement}>
		<ShareCard {results} {puzzleNumber} />
	</div>
</div>

<!-- Toast Notification -->
{#if showToast}
	<div class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[60] animate-slideUp">
		<div class="bg-pearl-aqua-600 text-white px-6 py-4 rounded-lg shadow-2xl max-w-md">
			<p class="font-medium text-center">{toastMessage}</p>
		</div>
	</div>
{/if}

<style>
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

	.animate-fadeIn {
		animation: fadeIn 0.2s ease-out;
	}

	.animate-scaleIn {
		animation: scaleIn 0.2s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translate(-50%, 20px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 0);
		}
	}

	.animate-slideUp {
		animation: slideUp 0.3s ease-out;
	}
</style>
