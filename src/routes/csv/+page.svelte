<script>
	import { base } from '$app/paths';

	let headers = $state([]); // 한글 헤더
	let englishHeaders = $state([]); // 영문 헤더 (저장용)
	let csvData = $state([]); // 실제 데이터 (2차원 배열)
	let fileName = $state('');

	// 1. 파일 읽기 및 데이터화
	function handleFileUpload(event) {
		const file = event.target.files[0];
		if (!file) return;

		fileName = file.name;
		const reader = new FileReader();

		reader.onload = (e) => {
			const text = e.target.result;
			const lines = text.split('\n').filter((line) => line.trim() !== '');

			if (lines.length < 2) return;

			// 첫 번째 줄: 영문 키, 두 번째 줄: 한글 이름 저장
			englishHeaders = lines[0].split(',').map((h) => h.trim());
			headers = lines[1].split(',').map((h) => h.trim());

			// 데이터 부분 (3번째 줄부터)
			csvData = lines.slice(2).map((row) => row.split(',').map((v) => v.trim()));
		};
		reader.readAsText(file, 'UTF-8');
	}

	// 2. 수정된 데이터를 다시 CSV 형식으로 변환하여 다운로드
	function downloadCSV() {
		if (csvData.length === 0) return;

		// 헤더 2줄 + 데이터 합치기
		const content = [
			englishHeaders.join(','),
			headers.join(','),
			...csvData.map((row) => row.join(','))
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

	// 행 추가 기능 (필요 시)
	function addRow() {
		const newRow = new Array(headers.length).fill('0');
		csvData = [...csvData, newRow];
	}

	// 행 삭제 기능
	function removeRow(index) {
		csvData = csvData.filter((_, i) => i !== index);
	}
</script>

<div class="min-h-screen bg-gray-100 p-5 dark:bg-gray-900">
	<div class="container mx-auto max-w-7xl">
		<div class="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
			<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
				<h1 class="text-2xl font-bold dark:text-white">FGO 데이터 편집기</h1>

				<div class="flex gap-2">
					{#if csvData.length > 0}
						<button
							onclick={addRow}
							class="rounded-lg bg-green-600 px-4 py-2 font-bold text-white hover:bg-green-700"
						>
							행 추가
						</button>
						<button
							onclick={downloadCSV}
							class="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700"
						>
							CSV로 저장 (다운로드)
						</button>
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
								<th class="px-4 py-3 text-center">삭제</th>

								{#each headers as header, i}
									<th class="px-4 py-3 font-bold whitespace-nowrap">
										{header}
										<span class="font-normal text-gray-500 dark:text-gray-400"
											>({englishHeaders[i]})</span
										>
									</th>
								{/each}
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
							{#each csvData as row, rowIndex}
								<tr class="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700/50">
									<td class="px-4 py-2 text-center">
										<button
											onclick={() => removeRow(rowIndex)}
											class="text-red-500 hover:text-red-700">✕</button
										>
									</td>
									{#each row as cell, cellIndex}
										<td class="px-2 py-1">
											<input
												type="text"
												bind:value={csvData[rowIndex][cellIndex]}
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
				<div class="py-20 text-center text-gray-500">
					편집할 파일을 업로드하면 테이블이 생성됩니다.
				</div>
			{/if}
		</div>
	</div>
</div>

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
