<script>
	import { dev } from '$app/environment';
	import { globalState } from '$lib/globalState.svelte.js';
	import { onMount } from 'svelte';
	import { base, resolve } from '$app/paths';
	import { i18n } from '$lib/i18n.js';
	import { serverServantIds } from '$lib/svtList.js';
	import { SvelteSet } from 'svelte/reactivity';
	import { SvelteMap } from 'svelte/reactivity';
	import { browser } from '$app/environment';
	let t = $derived(i18n[globalState.language] || i18n['KR']);

	let currentServer = $state('KR');
	let currentData = $derived(serverServantIds[currentServer]);
	let svtStates = new SvelteMap();

	function resetData() {
		if (confirm('모든 체크리스트 데이터가 삭제됩니다. 정말 초기화하시겠습니까?')) {
			svtStates.clear();
			if (browser) {
				localStorage.removeItem('svt_checklist_data');
			}
			alert('데이터가 초기화되었습니다.');
		}
	}

	function importCSV(event) {
		const file = event.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const text = e.target.result;
			const lines = text.split('\n').filter((line) => line.trim() !== '');
			if (lines.length < 1) return;

			const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
			const idIdx = headers.indexOf('id');
			const grailIdx = headers.indexOf('grail');
			const npIdx = headers.indexOf('nplv');

			if (idIdx === -1) {
				alert("CSV에 'id' 컬럼이 필요합니다.");
				return;
			}

			lines.slice(1).forEach((line) => {
				const values = line.split(',').map((v) => v.trim());
				const id = Number(values[idIdx]);

				if (!isNaN(id)) {
					const grail = grailIdx !== -1 ? Number(values[grailIdx]) : 0;
					const npLv = npIdx !== -1 ? Number(values[npIdx]) : 1;
					svtStates.set(id, {
						npLv: npLv,
						isGrail: grail >= 15
					});
				}
			});

			alert(`${lines.length - 1}개의 서번트 데이터를 불러왔습니다.`);
			event.target.value = '';
		};
		reader.readAsText(file, 'UTF-8');
	}

	function updateServant(id, action) {
		const currentState = svtStates.get(id) || {
			npLv: 0,
			isGrail: false,
			isGrand: false
		};
		let newState = { ...currentState };

		if (action === 'npLv') {
			newState.npLv = currentState.npLv >= 5 ? 1 : currentState.npLv + 1;
		} else {
			newState[action] = !currentState[action];
		}
		svtStates.set(id, newState);
		if (browser) {
			const dataToSave = Object.fromEntries(svtStates.entries());
			localStorage.setItem('svt_checklist_data', JSON.stringify(dataToSave));
		}
	}
	function formatClassName(folderName) {
		const namePart = folderName.split('_')[1];
		if (!namePart) return folderName;
		return namePart.charAt(0).toUpperCase() + namePart.slice(1);
	}
	onMount(() => {
		if (browser) {
			const savedData = localStorage.getItem('svt_checklist_data');
			if (savedData) {
				const parsed = JSON.parse(savedData);
				for (const [id, data] of Object.entries(parsed)) {
					svtStates.set(Number(id), data);
				}
			}
		}
	});
</script>

<div
	class="min-h-screen bg-gray-100 p-2 pt-5 transition-colors duration-300 md:p-5 dark:bg-gray-900"
>
	<div class="max-w-25xl container mx-auto mb-20">
		<div
			class="flex flex-col items-center space-y-4 rounded-2xl bg-white p-5 shadow-lg transition-colors duration-300 dark:bg-gray-800"
		>
			<div class="flex w-full justify-between">
				<div
					class="flex self-end text-3xl font-bold text-gray-900 transition-colors dark:text-gray-100"
				>
					SVT CheckList
				</div>
				<div
					class="max-h-30 min-h-20 max-w-30 min-w-20 cursor-pointer transition-transform hover:scale-105 active:scale-90 md:row-span-2 md:self-end"
					onclick={() => globalState.toggleDarkMode()}
				>
					<img
						src="{base}/images/bansi1_no_bg.png"
						alt="Bansi Light Mode"
						class="block h-full w-full object-contain dark:hidden"
					/>
					<img
						src="{base}/images/bansi3_no_bg.png"
						alt="Bansi Dark Mode"
						class="hidden h-full w-full object-contain dark:block"
					/>
				</div>
			</div>
			<div
				class="w-full rounded-xl border border-blue-200 bg-blue-50/30 p-3 transition-colors dark:border-gray-600 dark:bg-gray-700/50"
			>
				<button
					class="cursor-pointer rounded-lg px-4 py-2 font-bold transition-colors {currentServer ===
					'KR'
						? 'bg-blue-600 text-white'
						: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}"
					onclick={() => (currentServer = 'KR')}
				>
					한국 서버
				</button>
				<button
					class="cursor-pointer rounded-lg px-4 py-2 font-bold transition-colors {currentServer ===
					'JP'
						? 'bg-blue-600 text-white'
						: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}"
					onclick={() => (currentServer = 'JP')}
				>
					일본 서버
				</button>
				<label
					class="cursor-pointer rounded-lg bg-green-600 px-4 py-2 font-bold text-white transition-colors hover:bg-green-700"
				>
					CSV 불러오기<input type="file" class="hidden" accept=".csv" onchange={importCSV} />
				</label>

				<button
					class="cursor-pointer rounded-lg bg-gray-200 px-4 py-2 font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-300"
					onclick={() => alert('곧 구현될 예정입니다!')}
				>
					CSV 내보내기
				</button>
				<button
					class="cursor-pointer rounded-lg bg-gray-200 px-4 py-2 font-bold text-gray-700 transition-transform hover:bg-gray-300 active:scale-95 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
					onclick={resetData}
				>
					초기화
				</button>
			</div>

			<div class="space-y-8">
				{#each Object.entries(currentData) as [classFolder, ids]}
					{#if ids.length > 0}
						<div class="flex flex-wrap gap-2">
							<img
								src="{base}/images/class/{classFolder}.png"
								alt={formatClassName(classFolder)}
								class="h-16 w-16 object-contain"
							/>
							{#each ids as id (id)}
								<div
									class="relative cursor-pointer overflow-hidden rounded-md transition-transform duration-200 hover:scale-105 active:scale-95"
									onclick={() => updateServant(id, 'npLv')}
								>
									<img
										src="{base}/images/svt/{classFolder}/{id}.png"
										alt="{formatClassName(classFolder)} {id}"
										class="h-16 w-16 object-cover transition-all {svtStates.get(id)?.npLv >= 1
											? 'brightness-100'
											: 'brightness-[0.2] grayscale'}"
									/>
									<!-- {#if svtStates.get(id)?.npLv >= 1}
										<div
											class="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 rounded-b-md bg-gradient-to-t from-black/80 to-transparent"
										></div>
									{/if} -->
									{#if svtStates.get(id)?.npLv >= 1 && svtStates.get(id)?.isGrail}
										<img
											src="{base}/images/grail12.png"
											alt="grail"
											class="absolute bottom-0 -left-0.5 h-6 w-6 drop-shadow-lg"
										/>
									{/if}
									{#if svtStates.get(id)?.npLv >= 1 && svtStates.get(id)?.isGrand}
										<img
											src="{base}/images/grand5.png"
											alt="grail"
											class="absolute bottom-0 left-5.5 h-6 w-6 drop-shadow-lg"
										/>
									{/if}
									{#if svtStates.get(id)?.npLv >= 1}
										<span
											class="absolute -right-1 bottom-0 px-1 text-[30px] leading-none font-bold text-white [-webkit-text-stroke:1.2px_black]"
										>
											{svtStates.get(id).npLv}
										</span>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
</style>
