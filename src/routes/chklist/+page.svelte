<script>
	import { dev } from '$app/environment';
	import { onMount } from 'svelte';
	import { base, resolve } from '$app/paths';
	let isDarkMode = $state(false);
	let language = $state('KR');
	$effect(() => {
		if (language) {
			localStorage.setItem('language', language);
		}
	});
	onMount(() => {
		const savedTheme = localStorage.getItem('theme');
		if (
			savedTheme === 'dark' ||
			(!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
		) {
			isDarkMode = true;
			document.documentElement.classList.add('dark');
		}
		const savedLang = localStorage.getItem('language');
		if (savedLang) {
			language = savedLang;
		} else {
			const browserLang = navigator.language.toLowerCase();
			if (browserLang.startsWith('ko')) {
				language = 'KR';
			} else if (browserLang.startsWith('ja')) {
				language = 'JP';
			} else {
				language = 'EN';
			}
		}
	});
</script>

<div
	class="min-h-screen bg-gray-100 p-2 pt-5 transition-colors duration-300 md:p-5 dark:bg-gray-900"
>
	<div class="container mx-auto max-w-5xl">
		<div
			class="flex flex-col items-center space-y-4 rounded-2xl bg-white p-5 shadow-lg transition-colors duration-300 dark:bg-gray-800"
		>
			
		</div>
	</div>
</div>

<style>
	
</style>
