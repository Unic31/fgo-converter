<script>
	import { globalState } from '$lib/globalState.svelte.js';
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { i18n } from '$lib/i18n.js';
	import { serverServantIds } from '$lib/svtList.js';
	import { SvelteMap } from 'svelte/reactivity';
	import { browser } from '$app/environment';
	import { toPng } from 'html-to-image';
	let t = $derived(i18n[globalState.language] || i18n['KR']);
	let captureArea;
	let isLoading = $state(false);
	let exportTargetWidth = $state(0); // 0이면 기본 폭, 숫자가 들어가면 캡처용 고정 폭
	let isSettingsLoaded = $state(false);
	let isManual = $state(false);
	let currentServer = $state('KR');
	let currentData = $derived(serverServantIds[currentServer]);
	let svtStates = new SvelteMap();
	let filterMode = $state('all');
	let filteredData = $derived.by(() => {
		if (filterMode === 'all') return currentData;
		const result = {};
		for (const [classFolder, ids] of Object.entries(currentData)) {
			const filteredIds = ids.filter((id) => {
				const state = svtStates.get(id);
				const isOwned = state && state.npLv >= 1;
				if (filterMode === 'owned') return isOwned;
				if (filterMode === 'unowned') return !isOwned;
				return true;
			});
			if (filteredIds.length > 0) {
				result[classFolder] = filteredIds;
			}
		}
		return result;
	});
	let iconSize = $state('m');
	let iconClass = $derived.by(() => {
		if (iconSize === 's') return 'h-11 w-11';
		if (iconSize === 'm') return 'h-14 w-14';
		if (iconSize === 'l') return 'h-18 w-18';
		return 'h-14 w-14';
	});

	let leftClickMode = $state('click');
	function handleLeftClick(e, id, zoneAction) {
		e.stopPropagation();
		if (leftClickMode === 'grail') {
			updateServant(id, 'isGrail');
		} else if (leftClickMode === 'grand') {
			updateServant(id, 'isGrand');
		} else {
			updateServant(id, zoneAction);
		}
	}
	let rightClickMode = $state('decrease');
	function handleRightClick(e, id) {
		e.preventDefault();
		e.stopPropagation();
		if (rightClickMode === 'decrease') {
			updateServant(id, 'decreaseNpLv');
		} else if (rightClickMode === 'grail') {
			updateServant(id, 'isGrail');
		} else if (rightClickMode === 'grand') {
			updateServant(id, 'isGrand');
		}
	}

	let fileInput;
	function importCSVBtn() {
		if (fileInput) {
			fileInput.click();
		}
	}
	async function saveAsImage(layout) {
		if (!captureArea || isLoading) return;
		isLoading = true;

		// 2️⃣ 캡처에 필요한 픽셀 너비 계산
		const classArrays = Object.values(filteredData);
		const maxServantsCount =
			classArrays.length > 0 ? Math.max(...classArrays.map((ids) => ids.length)) : 0;

		let iconPx = 56;
		if (iconSize === 's') iconPx = 44;
		if (iconSize === 'l') iconPx = 72;

		let servantsPerRow = maxServantsCount;
		if (layout === 'double') servantsPerRow = Math.ceil(maxServantsCount / 2);

		const itemsPerRow = 1 + servantsPerRow;
		const targetWidth = Math.max(itemsPerRow * iconPx + (itemsPerRow - 1) * 8 + 60, 600);

		// 3️⃣ 로딩창 뒤에서 진짜 DOM의 너비를 강제로 늘리기
		exportTargetWidth = targetWidth;

		try {
			// 브라우저가 화면을 재배열할 시간(0.3초) 대기
			await new Promise((resolve) => setTimeout(resolve, 300));

			// 진짜 DOM을 캡처
			const dataUrl = await toPng(captureArea, {
				pixelRatio: 2,
				backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#f3f4f6'
			});

			// 4️⃣ 파일명에 들어갈 현재 시간 생성
			const now = new Date();
			const pad = (n) => String(n).padStart(2, '0');
			const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

			// 5️⃣ 이미지 즉시 다운로드
			const link = document.createElement('a');
			link.download = `SVT_Checklist_${timestamp}.png`;
			link.href = dataUrl;
			link.click();
		} catch (error) {
			console.error('캡처 에러:', error);
			alert('이미지 저장 중 오류가 발생했습니다.');
		} finally {
			// 6️⃣ 작업이 끝나면 화면을 원상 복구하고 로딩창 끄기
			exportTargetWidth = 0;
			await new Promise((resolve) => setTimeout(resolve, 50));
			isLoading = false;
		}
	}

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
			const rarityIdx = headers.indexOf('rarity');

			if (idIdx === -1) {
				alert("CSV에 'id' 컬럼이 필요합니다.");
				return;
			}

			let importCount = 0;
			svtStates.clear();
			lines.slice(1).forEach((line) => {
				const values = line.split(',').map((v) => v.trim());
				const id = Number(values[idIdx]);
				const rarity = Number(values[rarityIdx]);

				if (!isNaN(id) && rarity === 5) {
					const grail = grailIdx !== -1 ? Number(values[grailIdx]) : 0;
					const npLv = npIdx !== -1 ? Number(values[npIdx]) : 1;
					svtStates.set(id, {
						npLv: npLv,
						isGrail: grail >= 15,
						isGrand: false
					});
					importCount++;
				}
			});
			alert(`${importCount}개의 서번트 데이터를 불러왔습니다.`);
			if (browser) {
				const dataToSave = Object.fromEntries(svtStates.entries());
				localStorage.setItem('svt_checklist_data', JSON.stringify(dataToSave));
			}
			event.target.value = '';
		};
		reader.readAsText(file, 'UTF-8');
	}

	function updateServant(id, action) {
		const currentState = svtStates.get(id) || { npLv: 0, isGrail: false, isGrand: false };
		let newState = { ...currentState };

		if (action === 'npLv') {
			newState.npLv = currentState.npLv >= 5 ? 0 : currentState.npLv + 1;
		} else if (action === 'decreaseNpLv') {
			newState.npLv = currentState.npLv <= 0 ? 5 : currentState.npLv - 1;
		} else {
			newState[action] = !currentState[action];
			if (currentState.npLv === 0) {
				newState.npLv = 1;
			}
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
	$effect(() => {
		if (browser && isSettingsLoaded) {
			const settingsToSave = {
				currentServer,
				filterMode,
				iconSize,
				leftClickMode,
				rightClickMode
			};
			localStorage.setItem('svt_checklist_settings', JSON.stringify(settingsToSave));
		}
	});
	$effect(() => {
		if (browser) {
			if (isManual || isLoading) {
				document.body.style.overflow = 'hidden';
			} else {
				document.body.style.overflow = '';
			}
		}
	});
	onMount(() => {
		if (browser) {
			const savedData = localStorage.getItem('svt_checklist_data');
			if (savedData) {
				const parsed = JSON.parse(savedData);
				for (const [id, data] of Object.entries(parsed)) {
					svtStates.set(Number(id), data);
				}
			}
			const savedSettings = localStorage.getItem('svt_checklist_settings');
			if (savedSettings) {
				const parsedSettings = JSON.parse(savedSettings);
				if (parsedSettings.currentServer) currentServer = parsedSettings.currentServer;
				if (parsedSettings.filterMode) filterMode = parsedSettings.filterMode;
				if (parsedSettings.iconSize) iconSize = parsedSettings.iconSize;
				if (parsedSettings.leftClickMode) leftClickMode = parsedSettings.leftClickMode;
				if (parsedSettings.rightClickMode) rightClickMode = parsedSettings.rightClickMode;
			}
			isSettingsLoaded = true;
		}
	});
</script>

<div
	class="min-h-screen bg-gray-100 p-2 pt-5 transition-colors duration-300 md:p-5 dark:bg-gray-900"
>
	<div class="mx-auto mb-20 max-w-5xl">
		<div
			class="flex flex-col items-center space-y-4 rounded-2xl bg-white p-5 shadow-lg transition-colors duration-300 dark:bg-gray-800"
		>
			<div class="grid w-full grid-cols-[1fr_auto] grid-rows-[1fr_auto] gap-x-3 gap-y-2">
				<h1
					class="col-start-1 row-start-1 flex flex-wrap items-end gap-2 self-end text-3xl font-bold text-gray-900 transition-colors dark:text-gray-100"
				>
					<div
						class="h-20 w-20 transition-transform hover:scale-105 active:scale-95"
						onclick={() => globalState.toggleSidebar()}
					>
						<img src="{base}/images/nunnos.png" alt="nunnos" />
					</div>
					<span class="leading-none">SVT CheckList</span>
				</h1>

				<div
					class="text-1xl col-span-2 row-start-2 self-start text-gray-600 transition-colors md:col-span-1 md:col-start-1 dark:text-gray-400"
				>
					<span>{t.desc2}</span>
					<button
						class="text-md inline-flex cursor-pointer items-center justify-center rounded-md bg-blue-100 px-2.5 py-1 font-semibold text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
						onclick={() => (isManual = !isManual)}
					>
						{t.btnDesc}
					</button>
				</div>

				<div
					class="col-start-2 row-start-1 max-h-30 min-h-20 max-w-30 min-w-20 cursor-pointer self-end transition-transform hover:scale-105 active:scale-90 md:row-span-2 md:self-end"
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
				class="flex w-full flex-wrap items-center gap-5 rounded-xl border border-blue-200 bg-blue-50/30 p-3 transition-colors dark:border-gray-600 dark:bg-gray-700/50"
			>
				<label class="flex">
					<span
						class="justify-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
					>
						선택
					</span>
					<select
						bind:value={currentServer}
						class="block min-w-[120px] rounded-r-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
					>
						<option value="KR">KR</option>
						<option value="JP">JP</option>
						<option value="svt5">5성 선택권</option>
					</select>
				</label>
				<label class="flex">
					<span
						class="justify-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
					>
						출력
					</span>
					<select
						bind:value={filterMode}
						class="block min-w-[120px] rounded-r-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
					>
						<option value="all">전체</option>
						<option value="owned">보유</option>
						<option value="unowned">미보유</option>
					</select>
				</label>
				<label class="flex items-center">
					<span
						class="flex items-center justify-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
					>
						크기
					</span>
					<select
						bind:value={iconSize}
						class="block min-w-[80px] rounded-r-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
					>
						<option value="s">S</option>
						<option value="m">M</option>
						<option value="l">L</option>
					</select>
				</label>
				<label class="flex items-center">
					<span
						class="flex items-center justify-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
					>
						좌클릭
					</span>
					<select
						bind:value={leftClickMode}
						class="block min-w-[80px] rounded-r-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
					>
						<option value="click">구역</option>
						<option value="grail">성배</option>
						<option value="grand">관위</option>
					</select>
				</label>
				<label class="flex items-center">
					<span
						class="flex items-center justify-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
					>
						우클릭
					</span>
					<select
						bind:value={rightClickMode}
						class="block min-w-[80px] rounded-r-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
					>
						<option value="decrease">감소</option>
						<option value="grail">성배</option>
						<option value="grand">관위</option>
					</select>
				</label>

				<button
					type="button"
					class="cursor-pointer rounded-lg bg-green-600 px-4 py-2 font-bold text-white transition-colors hover:bg-green-700"
					onclick={importCSVBtn}
				>
					데이터 불러오기
				</button>
				<input
					bind:this={fileInput}
					type="file"
					class="hidden"
					accept=".csv"
					onchange={importCSV}
				/>
				<button
					class="cursor-pointer rounded-lg bg-gray-200 px-4 py-2 font-bold text-gray-700 transition-transform hover:bg-gray-300 active:scale-95 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
					onclick={resetData}
				>
					데이터 초기화
				</button>
				<button
					class="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
					onclick={() => saveAsImage('single')}
				>
					한줄로 저장
				</button>

				<button
					class="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
					onclick={() => saveAsImage('double')}
				>
					두줄로 저장
				</button>
			</div>

			<div
				bind:this={captureArea}
				class="relative space-y-5 rounded-xl border border-blue-200 bg-blue-50/30 p-2 transition-all duration-300 dark:border-gray-600 dark:bg-gray-700/50 {exportTargetWidth >
				0
					? ''
					: 'mx-auto'}"
				style={exportTargetWidth > 0
					? `width: ${exportTargetWidth}px; min-width: ${exportTargetWidth}px; max-width: none; margin: 0 !important;`
					: 'width: 100%;'}
			>
				{#each Object.entries(filteredData) as [classFolder, ids] (classFolder)}
					{#if ids.length > 0}
						<div class="flex flex-wrap gap-2">
							<img
								src="{base}/images/class/{classFolder}.png"
								alt={formatClassName(classFolder)}
								class="{iconClass} object-contain transition-all duration-300"
							/>

							{#each ids as id (id)}
								<div
									class="relative {iconClass} cursor-pointer overflow-hidden rounded-md bg-gray-200 transition-all duration-300 hover:scale-105 active:scale-95 dark:bg-gray-700"
									oncontextmenu={(e) => handleRightClick(e, id)}
								>
									<img
										src="{base}/images/svt/{classFolder}/{id}.png"
										alt="{formatClassName(classFolder)} {id}"
										onclick={(e) => handleLeftClick(e, id, 'npLv')}
										class="absolute inset-0 h-full w-full object-cover transition-all {svtStates.get(
											id
										)?.npLv >= 1
											? 'brightness-100'
											: 'brightness-[0.9] grayscale'}"
									/>

									{#if svtStates.get(id)?.npLv >= 1}
										<div
											class="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent"
										></div>

										<div class="absolute inset-x-0 bottom-0 z-10 grid h-1/2 grid-cols-3">
											<button
												class="flex h-full w-full items-end justify-center transition-colors hover:bg-white/20"
												onclick={(e) => handleLeftClick(e, id, 'isGrail')}
											>
												{#if svtStates.get(id)?.isGrail}
													<img
														src="{base}/images/grail12.png"
														alt="grail"
														class="w-full object-contain drop-shadow-md"
													/>
												{/if}
											</button>

											<button
												class="flex h-full w-full items-end justify-center transition-colors hover:bg-white/20"
												onclick={(e) => handleLeftClick(e, id, 'isGrand')}
											>
												{#if svtStates.get(id)?.isGrand}
													<img
														src="{base}/images/grand5.png"
														alt="grand"
														class="w-full object-contain drop-shadow-md"
													/>
												{/if}
											</button>

											<button
												class="flex h-full w-full items-end justify-center transition-colors hover:bg-white/20"
												onclick={(e) => handleLeftClick(e, id, 'npLv')}
											>
												<svg viewBox="0 0 24 24" class="w-full overflow-visible drop-shadow-lg">
													<text
														x="50%"
														y="85%"
														text-anchor="middle"
														fill="white"
														stroke="black"
														stroke-width="2"
														paint-order="stroke fill"
														font-family="monospace"
														font-weight="bold"
														font-size="25"
													>
														{svtStates.get(id).npLv}
													</text>
												</svg>
											</button>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				{/each}
				<div
					class="absolute right-3 bottom-2 text-xl font-bold text-gray-900 transition-colors dark:text-gray-100"
				>
					https://unic31.github.io/fgo-converter/chklist
				</div>
			</div>
		</div>
		<div class="font-bold text-gray-900 transition-colors dark:text-gray-100">
			<a
				href="https://leaflu0315.github.io/fgo/"
				target="_blank"
				rel="noopener noreferrer"
				class="transition-colors hover:text-gray-800 hover:underline dark:hover:text-gray-300"
			>
				Servant Checklist
			</a>
			를 제작하신
			<a
				href="https://github.com/mgneko/mgneko.github.io"
				target="_blank"
				rel="noopener noreferrer"
				class="transition-colors hover:text-gray-800 hover:underline dark:hover:text-gray-300"
			>
				mgneko
			</a>
			와
			<a
				href="https://github.com/LeafLu0315/fgo"
				target="_blank"
				rel="noopener noreferrer"
				class="transition-colors hover:text-gray-800 hover:underline dark:hover:text-gray-300"
			>
				LeafLu
			</a>
			의 아이디어를 빌려 제작되었습니다.
		</div>
	</div>
</div>
{#if isManual}
	<div
		class="fixed inset-0 z-60 flex items-center justify-center bg-black/30 backdrop-blur-sm"
		onclick={() => (isManual = false)}
	>
		<div
			class="w-11/12 max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800 dark:text-white"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-bold">
					{t.btnHow}
				</h2>
				<button
					class="ml-3 cursor-pointer text-lg text-black text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
					onclick={() => (isManual = false)}
				>
					✕
				</button>
			</div>

			<div
				class="max-h-[70vh] overflow-y-auto pr-2 text-sm leading-relaxed text-black dark:text-gray-300"
			>
				<div class="flex flex-col gap-1">
					<div>{t.manualGuide2.step1}</div>
					<img src="{base}/images/manual3.png" class="w-150" alt="manual3" />
					<br />
					<div>{t.manualGuide2.step2}</div>
					<img src="{base}/images/manual4.png" class="w-150" alt="manual4" />
				</div>
			</div>

			<div class="mt-4 flex justify-end">
				<button
					class="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
					onclick={() => (isManual = false)}
				>
					{t.btnOk}
				</button>
			</div>
		</div>
	</div>
{/if}

{#if isLoading}
	<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
		<div class="flex flex-col items-center rounded-xl bg-white p-8 shadow-2xl dark:bg-gray-800">
			<div
				class="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
			></div>
			<h2 class="text-xl font-bold dark:text-white">다빈치가 이미지를 그리는중...</h2>
		</div>
	</div>
{/if}

<style>
</style>
