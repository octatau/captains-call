const FOCUSABLE_SELECTOR =
	'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function focusTrap(node: HTMLElement) {
	const previouslyFocused = document.activeElement as HTMLElement | null;

	function getFocusableElements() {
		return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
			(el) => !el.hasAttribute('disabled') && el.offsetParent !== null
		);
	}

	// Move focus into the trap on mount
	const focusable = getFocusableElements();
	if (focusable.length > 0) {
		focusable[0].focus();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key !== 'Tab') return;

		const elements = getFocusableElements();
		if (elements.length === 0) return;

		const first = elements[0];
		const last = elements[elements.length - 1];

		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}

	node.addEventListener('keydown', handleKeydown);

	return {
		destroy() {
			node.removeEventListener('keydown', handleKeydown);
			previouslyFocused?.focus();
		}
	};
}
