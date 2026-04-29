<script>
	import './layout.css';
	import { base, resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { globalState } from '$lib/globalState.svelte.js';
	import { afterNavigate } from '$app/navigation';
	let { children } = $props();
	
	afterNavigate(() => {
		if (globalState.isSideBar) {
			globalState.toggleSidebar();
		}
	});

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
{#if globalState.isSideBar}
	<div
		class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
		onclick={() => globalState.toggleSidebar()}
	></div>
{/if}
<aside
	class="fixed top-0 left-0 z-60 h-full w-72 bg-white p-6 shadow-2xl transition-transform duration-300 ease-in-out dark:bg-gray-800
           {globalState.isSideBar ? 'translate-x-0' : '-translate-x-full'}"
>
	<div class="flex h-full flex-col overflow-y-auto">
		<div class="mb-8 flex items-center justify-between">
			<div class="h-15 w-15">
				<img src="{base}/images/nunnos.png" alt="nunnos" />
			</div>
			<button class="text-2xl dark:text-white" onclick={() => globalState.toggleSidebar()}>✕</button
			>
		</div>

		<nav class="space-y-6">
			<div class="flex items-center justify-between">
				<span class="dark:text-white">Language</span>
				<select
					value={globalState.language}
					onchange={(e) => globalState.setLanguage(e.target.value)}
					class="rounded-lg border p-2 text-sm transition-colors outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
				>
					<option value="KR">KR</option>
					<option value="JP">JP</option>
					<option value="EN">EN</option>
				</select>
			</div>
			<div class="flex items-center justify-between">
				<span class="dark:text-white">Display</span>
				<button
					class="text-md inline-flex cursor-pointer items-center justify-center rounded-md bg-blue-100 px-2.5 py-1 font-semibold text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
					onclick={() => globalState.toggleDarkMode()}
				>
					{globalState.isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
				</button>
			</div>
			<hr class="dark:text-white" />
			<div class="flex flex-col gap-5">
				<a
					href={resolve('/')}
					class="text-md w-full cursor-pointer rounded-md bg-blue-100 px-2.5 py-1 font-semibold text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
				>
					FGO Converter
				</a>
				<a
					href={resolve('/chklist')}
					class="text-md w-full cursor-pointer rounded-md bg-blue-100 px-2.5 py-1 font-semibold text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
				>
					SVT CheckList
				</a>
			</div>
		</nav>

		<ul class="mt-auto space-y-1 pt-8 text-start text-sm text-gray-900 dark:text-gray-100">
			<li>
				<a
					href="https://docs.google.com/forms/d/e/1FAIpQLSchVZotqT9RRD2tYW_sjOiu2lKgIGfv8xl0sFmyH7Aod2oQVg/viewform?usp=header"
					target="_blank"
					rel="noopener noreferrer"
					class="transition-colors hover:text-gray-800 hover:underline dark:hover:text-gray-300"
				>
					Feedback & Bug Report
				</a>
			</li>
			<li>
				<a
					href="https://www.pixiv.net/users/12102224"
					target="_blank"
					rel="noopener noreferrer"
					class="transition-colors hover:text-gray-800 hover:underline dark:hover:text-gray-300"
				>
					Illustrated by KANYA
				</a>
			</li>
			<li>
				<a
					href="https://github.com/Unic31/fgo-converter"
					target="_blank"
					rel="noopener noreferrer"
					class="transition-colors hover:text-gray-800 hover:underline dark:hover:text-gray-300"
				>
					Developed by Unic
				</a>
			</li>
			<li>
				<a
					href="https://ko-fi.com/unic31"
					target="_blank"
					rel="noopener noreferrer"
					class="transition-colors hover:text-gray-800 hover:underline dark:hover:text-gray-300"
				>
					Buy me a Saint Quartz
				</a>
			</li>
		</ul>
	</div>
</aside>
{@render children()}
<div
	class="fixed bottom-4 left-4 z-50 h-20 w-20 transition-transform hover:scale-125 active:scale-95"
	onclick={() => globalState.toggleSidebar()}
>
	<img src="{base}/images/nunnos.png" alt="nunnos" />
</div>
