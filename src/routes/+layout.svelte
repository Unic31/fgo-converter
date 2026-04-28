<script>
	import './layout.css';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { globalState } from '$lib/globalState.svelte.js';
	let { children } = $props();

	onMount(() => {
		const savedTheme = localStorage.getItem('theme');
		if (
			savedTheme === 'dark' ||
			(!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
		) {
			globalState.isDarkMode = true;
			document.documentElement.classList.add('dark');
		} else {
			globalState.isDarkMode = false;
			document.documentElement.classList.remove('dark');
		}

		const savedLang = localStorage.getItem('language');
		if (savedLang) {
			globalState.language = savedLang;
		} else {
			const browserLang = navigator.language.toLowerCase();
			if (browserLang.startsWith('ko')) {
				globalState.language = 'KR';
			} else if (browserLang.startsWith('ja')) {
				globalState.language = 'JP';
			} else {
				globalState.language = 'EN';
			}
		}
	});
</script>

<svelte:head>
	<link rel="icon" href="{base}/images/nunnos.png" />
</svelte:head>

{@render children()}
