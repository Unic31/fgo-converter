<script>
	import { onMount } from 'svelte';
	import { globalState } from '$lib/globalState.svelte.js';
	import { base, resolve } from '$app/paths';
	import { i18n } from '$lib/i18n.js';
	let t = $derived(i18n[globalState.language] || i18n['KR']);
	onMount(() => {});
</script>

<svelte:head>
	<title>페그오 툴 (FGO Tool)</title>

	<meta
		name="description"
		content="페그오(FGO) 유저를 위한 종합 툴 입니다. 커맨드 변환, 서번트 체크리스트 등 각종 편의성 기능을 제공합니다."
	/>

	<meta
		name="keywords"
		content="페그오, FGO, 페이트 그랜드 오더, 페그오 컨버터, 서번트 체크리스트, 페그오 체크리스트, 칼데아, FGA, 폰닉, 페그오 툴"
	/>

	<meta property="og:title" content="페그오 툴 (FGO Tool)" />
	<meta
		property="og:description"
		content="페그오(FGO) 유저를 위한 종합 툴 입니다. 커맨드 변환, 서번트 체크리스트 등 각종 편의성 기능을 제공합니다."
	/>
	<meta property="og:url" content="https://unic31.github.io/fgo-converter/" />

	<meta property="og:type" content="website" />
	<meta property="og:image" content="https://unic31.github.io/fgo-converter/images/nunnos.png" />
</svelte:head>

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
		<div class="my-font mt-2 text-end">{t.translation}</div>
	</div>
	<div class="flex items-center justify-between">
		<span class="dark:text-white">Display</span>
		<button class="my-btn" onclick={() => globalState.toggleDarkMode()}>
			{globalState.isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
		</button>
	</div>
	<hr class="border border-gray-500" />
	<div class="flex flex-col gap-5">
		<a href={resolve('/converter')} class="a-tag"> FGO Converter </a>
		<a href={resolve('/chklist')} class="a-tag"> SVT CheckList </a>
	</div>
	<hr class="border border-gray-500" />
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
