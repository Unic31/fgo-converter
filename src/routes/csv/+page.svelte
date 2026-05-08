<script>
	let headers = $state([]); // 한글 헤더
	let englishHeaders = $state([]); // 영문 헤더 (저장용)
	let csvData = $state([]); // 실제 데이터 (2차원 배열)
	let fileName = $state('');

	const visibleColumns = [
		'name',
		'class',
		'rarity',
		'npLv',
		'append1',
		'append2',
		'append3',
		'append4',
		'append5'
	];

	let visibleIndices = $state([]);

	let favoriteIndex = $state(-1);
	let rarityIndex = $state(-1);
	let skill1Index = $state(-1);
	let skill2Index = $state(-1);
	let skill3Index = $state(-1);

	let classIndex = $state(-1);

	const standardClasses = [
		'Saber',
		'Archer',
		'Lancer',
		'Rider',
		'Caster',
		'Assassin',
		'Berserker',
		'Ruler',
		'Avenger',
		'Altergo',
		'Foreigner',
		'Mooncancer',
		'Pretender',
		'Beast'
	];

	function handleFileUpload(event) {
		const file = event.target.files[0];
		if (!file) return;

		fileName = file.name;
		const reader = new FileReader();

		reader.onload = (e) => {
			const text = e.target.result;
			const lines = text.split('\n').filter((line) => line.trim() !== '');

			if (lines.length < 2) return;

			englishHeaders = lines[0].split(',').map((h) => h.trim());
			headers = lines[1].split(',').map((h) => h.trim());

			visibleIndices = visibleColumns
				.map((col) => englishHeaders.indexOf(col))
				.filter((index) => index !== -1);

			favoriteIndex = englishHeaders.indexOf('favorite');
			rarityIndex = englishHeaders.indexOf('rarity');
			skill1Index = englishHeaders.indexOf('skill1');
			skill2Index = englishHeaders.indexOf('skill2');
			skill3Index = englishHeaders.indexOf('skill3');
			classIndex = englishHeaders.indexOf('class');

			// 🌟 1. 전체 데이터를 먼저 파싱합니다.
			const parsedRows = lines.slice(2).map((row) => row.split(',').map((v) => v.trim()));

			// 🌟 2. class 컬럼이 존재한다면, 정규 클래스(standardClasses)에 포함된 행만 남깁니다.
			if (classIndex !== -1) {
				csvData = parsedRows.filter((row) => standardClasses.includes(row[classIndex]));
			} else {
				// 만약 class 컬럼 자체가 없는 파일이라면 그대로 불러옵니다.
				csvData = parsedRows;
			}
		};
		reader.readAsText(file, 'UTF-8');
	}

	function downloadCSV() {
		if (csvData.length === 0) return;

		const readyToSaveData = csvData.map((row) => {
			if (row.length > 0) {
				if (favoriteIndex !== -1) row[favoriteIndex] = '1';
				if (skill1Index !== -1) row[skill1Index] = '10';
				if (skill2Index !== -1) row[skill2Index] = '10';
				if (skill3Index !== -1) row[skill3Index] = '10';
			}
			return row;
		});

		const content = [
			englishHeaders.join(','),
			headers.join(','),
			...readyToSaveData.map((row) => row.join(','))
		].join('\n');

		const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');

		link.setAttribute('href', url);
		link.setAttribute('download', fileName || 'edited_servants.csv');
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	function removeRow(index) {
		csvData = csvData.filter((_, i) => i !== index);
	}

	function removeByRarity(targetRarity) {
		if (rarityIndex === -1) return;
		csvData = csvData.filter((row) => row[rarityIndex] !== String(targetRarity));
	}

	function removeByClass(targetClass) {
		if (classIndex === -1) return;
		csvData = csvData.filter((row) => row[classIndex] !== targetClass);
	}
</script>

<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
	<h1 class="text-2xl font-bold dark:text-white">FGO 데이터 편집기</h1>

	<div class="flex gap-2">
		{#if csvData.length > 0}
			<button
				onclick={downloadCSV}
				class="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700"
			>
				CSV로 저장 (다운로드)
			</button>
		{/if}
	</div>
	<div class="flex gap-2">
		{#if csvData.length > 0}
			<div
				class="mb-6 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-gray-800"
			>
				<h3 class="text-sm font-bold text-red-800 dark:text-red-400">
					일괄 삭제 도구 (클릭 시 즉시 삭제됩니다)
				</h3>

				<!-- 레어도 삭제 그룹 -->
				<div class="flex flex-wrap gap-2">
					{#each [1, 2, 3, 4, 5] as star}
						<button
							onclick={() => removeByRarity(star)}
							class="rounded-lg bg-red-200 px-3 py-1 text-sm font-bold text-red-700 transition-colors hover:bg-red-300 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-800/50"
						>
							{star}성 삭제
						</button>
					{/each}
				</div>

				<!-- 클래스 삭제 그룹 -->
				<div class="flex flex-wrap gap-2">
					{#each standardClasses as cls}
						<button
							onclick={() => removeByClass(cls)}
							class="rounded-lg bg-orange-200 px-3 py-1 text-sm font-bold text-orange-800 transition-colors hover:bg-orange-300 dark:bg-orange-900/50 dark:text-orange-300 dark:hover:bg-orange-800/50"
						>
							{cls} 삭제
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>

<div class="mb-8">
	<label
		class="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500"
	>
		<span class="text-sm text-gray-500 dark:text-gray-400">
			{fileName ? `선택됨: ${fileName}` : '수정할 CSV 파일을 업로드하세요'}
		</span>
		<input type="file" class="hidden" accept=".csv" onchange={handleFileUpload} />
	</label>
</div>

{#if csvData.length > 0}
	<div
		class="custom-scrollbar overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700"
	>
		<table class="w-full text-left text-sm">
			<thead class="bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-400">
				<tr>
					<th class="px-4 py-3 text-center"></th>

					<!-- 전체 헤더가 아닌, visibleIndices(선택된 순번)만 반복해서 그립니다 -->
					{#each visibleIndices as colIdx (colIdx)}
						<th class="px-4 py-3 font-bold whitespace-nowrap">
							{headers[colIdx]}
							<span class="font-normal text-gray-500 dark:text-gray-400">
								({englishHeaders[colIdx]})
							</span>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
				{#each csvData as row, rowIdx (rowIdx)}
					<tr class="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700/50">
						<td class="px-4 py-2 text-center">
							<button onclick={() => removeRow(rowIdx)} class="text-red-500 hover:text-red-700"
								>✕</button
							>
						</td>

						<!-- 전체 열이 아닌, visibleIndices에 해당하는 칸만 input으로 그립니다 -->
						{#each visibleIndices as colIdx (colIdx)}
							<td class="px-2 py-1">
								<input
									type="text"
									bind:value={csvData[rowIdx][colIdx]}
									class="w-full border-none bg-transparent p-1 focus:ring-2 focus:ring-blue-500 dark:text-white"
								/>
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else}
	<div class="py-20 text-center text-gray-500">편집할 파일을 업로드하면 테이블이 생성됩니다.</div>
{/if}

<style>
	.custom-scrollbar::-webkit-scrollbar {
		height: 10px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 5px;
	}
	.dark .custom-scrollbar::-webkit-scrollbar-thumb {
		background: #475569;
	}
</style>
