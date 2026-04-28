<script>
	import { base, resolve } from '$app/paths';
</script>

<div
	class="min-h-screen bg-gray-100 p-2 pt-5 transition-colors duration-300 md:p-5 dark:bg-gray-900"
>
	<div class="container mx-auto max-w-5xl">
		<div
			class="flex flex-col items-center space-y-4 rounded-2xl bg-white p-5 shadow-lg transition-colors duration-300 dark:bg-gray-800"
		>
			<img src="{base}/images/nunnos.png" alt="logo" class="mb-15 h-50 w-50" />
			<a
				href={resolve('/converter')}
				class="mb-10 inline-flex cursor-pointer items-center justify-center rounded-md bg-blue-100 px-2.5 py-1 text-4xl font-semibold text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
			>
				FGO Converter
			</a>
			<a
				href={resolve('/chklist')}
				class="inline-flex cursor-pointer items-center justify-center rounded-md bg-blue-100 px-2.5 py-1 text-4xl font-semibold text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
			>
				SVT Check List
			</a>
		</div>
	</div>
</div>

<style>
</style>
