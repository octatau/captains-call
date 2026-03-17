<script lang="ts">
	import { page } from '$app/stores';
	import { theme } from '$lib/theme';
	import { Icon, ExclamationTriangle, Home, ArrowPath } from 'svelte-hero-icons';

	const statusCode = $derived($page.status);
	const message = $derived($page.error?.message || 'Something went wrong');

	function getErrorInfo(status: number): { title: string; description: string } {
		switch (status) {
			case 404:
				return {
					title: 'Page Not Found',
					description: 'The page you are looking for does not exist or has been moved.'
				};
			case 500:
				return {
					title: 'Server Error',
					description: 'Something went wrong on our end. Please try again later.'
				};
			default:
				return {
					title: 'Error',
					description: 'An unexpected error occurred.'
				};
		}
	}

	const errorInfo = $derived(getErrorInfo(statusCode));

	function handleRetry() {
		window.location.reload();
	}

	function handleGoHome() {
		window.location.href = '/';
	}
</script>

<svelte:head>
	<title>{errorInfo.title} - Topick</title>
</svelte:head>

<div class="min-h-screen {theme.page.bg} transition-colors flex items-center justify-center">
	<div class="container mx-auto px-4 py-8 max-w-md text-center">
		<div class="{theme.card.bg} rounded-lg shadow-lg p-8">
			<!-- Error Icon -->
			<div class="flex justify-center mb-6">
				<div class="w-16 h-16 rounded-full {theme.error.bgLight} flex items-center justify-center">
					<Icon src={ExclamationTriangle} size="32" class={theme.error.text} />
				</div>
			</div>

			<!-- Error Code -->
			<p class="text-6xl font-bold {theme.neutral.text} mb-2">{statusCode}</p>

			<!-- Error Title -->
			<h1 class="text-2xl font-bold {theme.neutral.textStrong} mb-2">{errorInfo.title}</h1>

			<!-- Error Description -->
			<p class="{theme.neutral.text} mb-6">{errorInfo.description}</p>

			<!-- Debug Message (only show if different from default) -->
			{#if message && message !== 'Something went wrong' && message !== errorInfo.description}
				<p class="text-sm {theme.neutral.text} mb-6 p-3 {theme.neutral.bgLight} rounded">
					{message}
				</p>
			{/if}

			<!-- Action Buttons -->
			<div class="flex flex-col sm:flex-row gap-3 justify-center">
				<button
					onclick={handleRetry}
					class="flex items-center justify-center gap-2 px-6 py-3 {theme.primary.bg} {theme.primary.bgHover} text-white font-semibold rounded-lg transition-colors"
				>
					<Icon src={ArrowPath} size="20" />
					Try Again
				</button>
				<button
					onclick={handleGoHome}
					class="flex items-center justify-center gap-2 px-6 py-3 border-2 {theme.neutral.border} {theme.neutral.textStrong} font-semibold rounded-lg transition-colors {theme.neutral.borderHover}"
				>
					<Icon src={Home} size="20" />
					Go Home
				</button>
			</div>
		</div>
	</div>
</div>
