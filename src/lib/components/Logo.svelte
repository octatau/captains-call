<script lang="ts">
	interface Props {
		size?: number;
		class?: string;
	}

	let { size = 32, class: className = '' }: Props = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 100 100"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	class={className}
>
	<!-- Podium Base - Three Levels -->
	<!-- 3rd Place (Left, Shortest) -->
	<rect x="10" y="60" width="20" height="30" rx="2" fill="#91d4cc" />
	<text x="20" y="80" font-size="14" font-weight="bold" fill="white" text-anchor="middle">3</text>

	<!-- 1st Place (Center, Tallest) -->
	<rect x="40" y="35" width="20" height="55" rx="2" fill="#47b8ab" />
	<text x="50" y="67" font-size="14" font-weight="bold" fill="white" text-anchor="middle">1</text>

	<!-- 2nd Place (Right, Medium) -->
	<rect x="70" y="50" width="20" height="40" rx="2" fill="#6cc6bb" />
	<text x="80" y="75" font-size="14" font-weight="bold" fill="white" text-anchor="middle">2</text>

	<!-- Star on #1 -->
	<g transform="translate(50, 20)">
		<!-- Star shape -->
		<path
			d="M 0 -8 L 2.4 -2.4 L 8 -1.2 L 4 3.2 L 5.6 8.8 L 0 6 L -5.6 8.8 L -4 3.2 L -8 -1.2 L -2.4 -2.4 Z"
			fill="#edb312"
			stroke="#0f172a"
			stroke-width="0.5"
		/>
	</g>

	<!-- Base Line -->
	<line x1="5" y1="92" x2="95" y2="92" stroke="#2b6e66" stroke-width="2" stroke-linecap="round" />
</svg>
