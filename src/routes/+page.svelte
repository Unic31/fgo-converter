<script>
	import { browser, dev } from '$app/environment';
	import pako from 'pako';
	import { onMount } from 'svelte';
	import { globalState } from '$lib/globalState.svelte.js';
	import { base, resolve } from '$app/paths';
	import { i18n } from '$lib/i18n.js';
	let t = $derived(i18n[globalState.language] || i18n['KR']);
	onMount(() => {});
</script>

<div class="flex justify-center">
	<img src="{base}/images/nunnos.png" alt="nunnos" class="h-50 w-50" />
</div>

<nav class="space-y-6">
	<div>
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
		<div class="my-font text-end mt-2">{t.translation}</div>
	</div>
	<div class="flex items-center justify-between">
		<span class="dark:text-white">Display</span>
		<button
			class="inline-flex cursor-pointer items-center justify-center rounded-md bg-blue-100 px-2.5 py-1 font-semibold text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
			onclick={() => globalState.toggleDarkMode()}
		>
			{globalState.isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
		</button>
	</div>
	<hr class="dark:text-white" />
	<div class="flex flex-col gap-5">
		<a href={resolve('/')} class="a-tag"> FGO Converter </a>
		<a href={resolve('/chklist')} class="a-tag"> SVT CheckList </a>
	</div>
	<hr class="dark:text-white" />
	<div class="flex flex-col gap-5 text-right">
		<a
			href="https://docs.google.com/forms/d/e/1FAIpQLSchVZotqT9RRD2tYW_sjOiu2lKgIGfv8xl0sFmyH7Aod2oQVg/viewform?usp=header"
			target="_blank"
			rel="noopener noreferrer"
			class="a-tag"
		>
			Feedback & Bug Report
		</a>
		<a
			href="https://www.pixiv.net/users/12102224"
			target="_blank"
			rel="noopener noreferrer"
			class="a-tag"
		>
			Illustrated by KANYA
		</a>
		<a
			href="https://github.com/Unic31/fgo-converter"
			target="_blank"
			rel="noopener noreferrer"
			class="a-tag"
		>
			Developed by Unic
		</a>
		<a href="https://ko-fi.com/unic31" target="_blank" rel="noopener noreferrer" class="a-tag">
			Buy me a Saint Quartz
		</a>
	</div>
</nav>

<style lang="postcss">
	@reference "tailwindcss";
	.test {
		@apply rounded-lg;
	}
</style>
