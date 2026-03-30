<script>
	import pako from 'pako';
	import { onMount } from 'svelte';

	let isLoading = $state(false);
	// sample
	let url = $state(
		'https://link.chaldea.center/laplace/share?data=GH4sIAM4jymkA_81XbW_aMBD-L_6cSXZeCd9WtmqVui8b-1ShyZArsXCcNHGioar_fWfnpVS0GdCCJhDOOXd-7p57SXgkmVBXtZAJmcae5xBeFL0YMYc81FBpMn0kwuz4NJ5MGHVIkfIKyBQVQEG2_carlEwJ-01Dz_8dMuaFyyV5ckheaJGryhyQiXWqt7OUC0WmuqzBIYmo-FLC1wYUYtxzWeFmkQulr-r7e7RStZQOqURWS67hsxiULOoP3PtVtFqIpYFnBkjxDHrTbFtpsZrlCVgXBukGo3FNIBIakBgINc6qawEy-dlohL57JFWjrV5AKaNGV2RCz_LaOOujWxsh5U1idKM4DgLq-F7o2yUKArboNG4bo4FY9ruwDINK2m27az94QyfPcMyItw2KiNsYB9EBrjfXeW0FlNJiR1jZkDBBXhxb8dY4e1UC3_Rs415_EDzUomA7aW2t5J5NB43kVHVR5KWebwukkqhcAXHIuuTK8NXl5ckZSAupH41z5rIoNKThihd2naB8Km0WcJQ1d4S1aLLPWldqHW2vkNYayX0TC308ZwHF6hmvs5CZAotCN7CLF55OmEUbCGOt1_GBVfYaXy-qLDiIr50iCw7lCwNY8tWmLvb6dPLPPo2pa0otpl67-GP8de04edGOh_L0ZiHtdV87qN6oosM7zx5jfhZokoCENU5Hg1FCIfkKvkO2hPJGJfAHTKB3LtaC0eWrbkQjk7rFsHwgSGXOpx0_9mpnnuOpWyjnvFxDq2Vnci8jT8bDPDNc4U2dllCluXmuGIqeTNmPo7ELoLEBzb0o2iWYdA9CYx-Oxi6K5p4HjWuNM4Y43cUwZyzgipdo8gmPE9X8yzD4SoEvF1w-9zuqtU3LuiFvXXiH9YDt98a98mDdnTYYu2ZenjUfx-eBvrt_2AXQTusf-hE1dlqVLC5KyrlTcPygpGcdJvT_SXQ_DugJ1uPz4OggFwZ4hnBz--erfRf5C6A3qhVUDgAA&questId=94098810&phase=1&enemyHash=1_0634_61136bb'
		// 'https://link.chaldea.center/laplace/share?data=GH4sIAO4RymkA_82X32-bMBDH_xc_M8kGTH68rdmqVepetuypiionuMGKMRRMtKjq_747m5Ko1UiTdqxKFGNzvu_dh7NNHkiuzEWjdEqmkygKiCjLp-4IuveNrC2ZPhCFIzGdjMeMBqTMRC3JlAVEGpnvvok6I1PCbmkSxbcJY1GyXJLHgBSlVYWp0UGu1pndzTKhDJnaqpEBSVUtllp-3UoDGndC1zBYFsrYi-buDmaZRuuA1CpvtLDys-qMnOoPGPtVeivQslLkKGRELp-m5rvaqtWsSKULoetdQTYhJqLlVmpIhGKw5lJJnf7cWpC-eSD11qJdQuMRRVOVKzsrGow1hqg2SuurFE1DNko4pwG0cOHaMfQXrdH1Fo1AzX0XjrE0qR92o-4DN2zaCTLsXW8dYw3NBCIQdnNZNBgtxpOVB52VSwke0Gg8cd1rjPaikmLzRBvG0B0HeveNKtnBU_WT9Isp2k0ANHVTlkVl57sSQBJTGEkCsq6EQVrtU3kMOmQYU9jPLOIh5yxgHH8jHgHAc3l5tQ5YeBowGo_7gaH1C2J-1l-IUXo6Mk5j3k9slDAwCUZJyF0DyM4uMad2com9vqb86ntrQUG4S7HaNOXzJRmOKWX9tCY0xKU4oZFv4j5aHor3-iYq7fbksdDjVFp71Hl9zTg3-7UGISdH9qeQR1g60MYhD7Hl_CgO7_g5jvFHw7EAw1RquYbTAD1XstRiJb_LfCmrK5PK3xLTu4G0F2grVu2RBOVkvWdHAVzX6DVsqbiAD84v8LqT1VxUa2n3J99BH-MqciwYmGizStZZodvt6RFXer8aG1Qt7FGj76A2jMpHJfj-akPUIh00NzpobmzQKmGD5fZPVYS1cPySoL3ojmDnZCUqmPIJrlQ9_9K9EFQKXrGF3u_9YOY38AjP8wHRn1LE9D2g0DOgsJOg0DevNTaA2nm7Fh10_6eD7v__sbyCwVbs0SQXKDwDubn7p-5f3_4AC4maL4EQAAA%3D&questId=94098810&phase=1&enemyHash=1_0634_61136bb'
		// 'https://link.chaldea.center/laplace/share?data=GH4sIANpNyWkA_9VXUW_aMBD-L37OJDsECLytbNWQ2MvGnipUuclBLBwnjR00VPW_784JFJVC2dRGnYRwztx3392X8yU8sFyZq1rplI1HvV7AZFnuzDgO2H0N1rHxA1O0E3Hc5CJgZSYtsDFegYF8-03ajI2ZuOUx57dxlPAkEewxYEXpVGEsBcjVKnPbSSaVYWNX1RCwVFl5p-HrBgxyLKW2uFkWyrirerlElKm1DphVea2lg89q7-RZf-Der7LxQi4HMiciI3PYQfOtdSqZFCn4FPbWFKsJBQ-Yhg1oLIRTsuZagU5_bhxS3zwwu3HkN-QR5-SqcuUmRU25RpjVWmk9Tck1Ho6iPg-Gg7CHCyrU7_NF6zHbkAdS-Q_uunQfVJA123gdNS4jZJFufV3UlBFxZuWBkfi08SbwXuTNGWV0VYFc7xTFPQrXR4Xua1WKgzvXgPQRRHsAlm_rsiwqN9-WKBZbVgpMygK2qqQhTVrtH4P_TJi2Y1plLhKmhXhljoQxhYGzsghManRel0E8QCWCQTyM_ILma7o0UT9yx5wQBiu4k8m6Lp-fK6xI9M_rFIrhiIQKhW8dWkX_Eqkw8F9LdbJp-HNtmtlyomP4xR3jw9DXAiEpaFjhQCMOlxISR6VZga8QS6ug1DKB75DfQTU1Kfz2P92IgC8IL5N20qLAruH1GiGxJU7eauavDsYyRt1CNZfVCtArbEfrzkZfyrrIST80XFaBzQp6PJBsj9T259lEp2xhB2xhp0qKi9jEm7OJTtnC92GTzuHoYUF7sR8_Pkgiq9QPHGXnX56OfKXwHUHqpw10aw5y2A75A3R4OVocoz-JHbydxee4F11LJF4vsk37hRr3YH4xuHcM_ggCnTj7Yads730au6npXefY6UYO_6GdxNu204KIJ0g3939SmheAP2JGBAd8DQAA&questId=94098801&phase=1&enemyHash=1_0800_84c0cc1'
	);
	let decodedData = $state(null);
	let fgaCommand = $state('');
	let teamData = $state([]);
	let mcData = $state(null);
	let isError = $state(false);

	async function fetchSvtDetails(svtList) {
		if (!svtList) return [];
		const svtPromises = svtList.map(async (svt) => {
			// 빈 자리(null)는 그대로 null 반환
			if (!svt || !svt.svtId) return null;

			try {
				const res = await fetch(`https://api.atlasacademy.io/nice/JP/svt/${svt.svtId}`);
				const data = await res.json();

				let ceData = null;
				// 예장은 있는 경우에만
				if (svt.ceId) {
					const ceRes = await fetch(`https://api.atlasacademy.io/nice/JP/equip/${svt.ceId}`);
					ceData = await ceRes.json();
				}

				return {
					...svt,
					details: data,
					ceDetails: ceData
				};
			} catch (err) {
				console.error(`서번트(ID: ${svt.svtId}) 로드 실패:`, err);
				return { ...svt, details: null, ceDetails: null };
			}
		});
		return await Promise.all(svtPromises);
	}

	async function fetchMCDetails(mcId) {
		if (!mcId) return null;
		try {
			const res = await fetch(`https://api.atlasacademy.io/nice/JP/MC/${mcId}`);
			return await res.json();
		} catch (err) {
			console.error(`마스터 예장(ID: ${mcId}) 로드 실패:`, err);
			return null;
		}
	}

	async function fncConvertBtn() {
		try {
			isLoading = true;
			isError = false;
			fgaCommand = '';
			teamData = [];
			mcData = null;

			const urlObj = new URL(url.trim());
			let dataParam = urlObj.searchParams.get('data');

			// url에 data 없으면
			if (!dataParam) {
				isError = true;
				decodedData = null;
				return;
			}

			if (dataParam.startsWith('G') || dataParam.startsWith('D') || dataParam.startsWith('Z')) {
				dataParam = dataParam.substring(1);
			}

			let base64 = dataParam.replace(/-/g, '+').replace(/_/g, '/');

			while (base64.length % 4 !== 0) {
				base64 += '=';
			}

			const binaryString = atob(base64);
			const len = binaryString.length;
			const bytes = new Uint8Array(len);
			for (let i = 0; i < len; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}
			const decompressed = pako.inflate(bytes);
			const jsonString = new TextDecoder().decode(new Uint8Array(decompressed));
			decodedData = JSON.parse(jsonString);

			// 마스터 예장 api
			console.log(decodedData.team?.mysticCode);
			if (decodedData.team?.mysticCode?.mysticCodeId) {
				mcData = await fetchMCDetails(decodedData.team.mysticCode.mysticCodeId);
			}

			// 서번트 api
			const team = [
				...decodedData.team.onFieldSvts, // [0, 1, 2]
				...decodedData.team.backupSvts // [3, 4, 5]
			];
			teamData = await fetchSvtDetails(team);

			fgaCommand = fncConvert(decodedData.actions, decodedData.delegate, mcData);
			// const cntRes = await (await fetch(`https://n8n.kstr.dev/webhook/6daee07e-8a2e-4a5e-982e-f07ee83c900f`)).json(e=>e.json);
			const cntRes = 1;
			console.log(`총 ${cntRes} 번 변환되었습니다.`);
		} catch (err) {
			console.error('fncConvertBtn:', err);
			isError = true;
			decodedData = null;
		} finally {
			isLoading = false;
		}
	}

	function copyToClipboard() {
		if (!decodedData) return;

		// 텍스트로 변환 (들여쓰기 2칸 적용)
		const text = JSON.stringify(decodedData, null, 2);

		// 브라우저 클립보드 API 호출
		navigator.clipboard
			.writeText(text)
			.then(() => {
				alert('데이터가 복사되었습니다');
			})
			.catch((err) => {
				console.error('복사 실패:', err);
			});
	}

	function fncConvert(actions, delegate, mcInfo) {
		if (!actions) return '';
		let result = '';

		// delegate.replaceMemberIndexes 배열을 복사해둠 (오더체인지 시 앞에서부터 꺼내 쓰기 위함)
		let swaps = delegate?.replaceMemberIndexes ? [...delegate.replaceMemberIndexes] : [];

		actions.forEach((action) => {
			if (action.type === 'skill') {
				if (action.svt === undefined) {
					// ★ 마스터 스킬 처리
					let isOrderChange = false;
					let isMCTargeting = false; // 마스터 스킬 타겟팅 여부 추가

					// Atlas API 데이터로 스킬 정보 확인
					if (mcInfo && mcInfo.skills && mcInfo.skills[action.skill]) {
						const skillData = mcInfo.skills[action.skill];

						// 1. 오더체인지 판별
						isOrderChange = skillData.functions.some((f) => f.funcType === 'replaceMember');

						// 2. 타겟팅(아군 1체) 판별
						isMCTargeting = skillData.functions.some((f) => f.funcTargetType === 'ptOne');
					} else if (action.skill === 2 && swaps.length > 0) {
						// API 데이터가 모종의 이유로 없을 때의 대비책 (보통 3스킬이 오더체인지)
						isOrderChange = true;
					}

					if (isOrderChange && swaps.length > 0) {
						// 오더체인지 명령어: x + 전열타겟 + 후열타겟
						const swap = swaps.shift();
						result += `x${swap[0] + 1}${swap[1] + 1}`;
					} else {
						// 일반 마스터 스킬: j, k, l + 타겟번호
						const masterSkills = ['j', 'k', 'l'];
						result += masterSkills[action.skill];

						// ★ 타겟팅 스킬일 때만 번호 결합
						if (isMCTargeting && action.options?.playerTarget !== undefined) {
							result += action.options.playerTarget + 1;
						}
					}
				} else {
					// ★ 서번트 스킬 처리 (기존과 동일)
					const skillMap = [
						['a', 'b', 'c'],
						['d', 'e', 'f'],
						['g', 'h', 'i']
					];
					result += skillMap[action.svt][action.skill];

					// 타겟팅 필요 여부 판별 로직
					let isTargeting = false;
					const svtInfo = teamData[action.svt];

					if (svtInfo?.details?.skills) {
						const skillSlot = action.skill + 1;
						const slotSkills = svtInfo.details.skills.filter((s) => s.num === skillSlot);
						const latestSkill = slotSkills[slotSkills.length - 1];

						if (latestSkill?.functions) {
							isTargeting = latestSkill.functions.some((f) => f.funcTargetType === 'ptOne');
						}
					}

					// 타겟팅 스킬일 때만 번호 추가
					if (isTargeting && action.options?.playerTarget !== undefined) {
						result += action.options.playerTarget + 1;
					}
				}
			} else if (action.type === 'attack') {
				action.attacks.forEach((atk) => {
					if (atk.isTD) result += atk.svt + 4;
				});
				result += ',#,';
			}
		});

		return result;
	}
	onMount(() => {
		fncConvertBtn();
	});
</script>

<div class="min-h-screen bg-gray-100 p-10 md:p-10">
	<div class="mx-auto flex max-w-3xl flex-col space-y-3 rounded-2xl bg-white p-5 shadow-lg">
		<div class="flex justify-between">
			<h1 class="mb-1 text-3xl font-bold text-gray-800">FGO 커맨드 변환기</h1>
		</div>
		<div class="text-2x1 text-gray-500">
			칼데아(Chaldea) 앱의 공유 URL을 FGA용 텍스트로 변환합니다.
		</div>
		<input
			type="text"
			bind:value={url}
			placeholder="https://link.chaldea.center/laplace/share?data=..."
			class="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
		/>
		<button
			onclick={fncConvertBtn}
			class="w-full rounded-lg bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700 active:bg-blue-900"
			style="cursor: pointer;"
		>
			변환하기
		</button>

		{#if isError}
			<div class="rounded-lg bg-red-50 p-4 text-red-600">⚠️ 올바른 링크인지 확인해주세요.</div>
		{/if}

		{#if decodedData}
			<div class="">
				<div class="relative rounded-lg bg-gray-900 p-4">
					<div class="mb-2 flex items-center justify-between">
						<h3 class="text-sm font-bold text-gray-400">압축 해제된 전체 JSON 데이터</h3>
						<button
							onclick={copyToClipboard}
							class="rounded bg-gray-700 px-2 py-1 text-xs text-gray-200 transition-colors hover:bg-gray-600"
						>
							복사하기 📑
						</button>
					</div>

					<div class="max-h-50 overflow-auto text-xs text-green-400">
						<pre>{JSON.stringify(decodedData, null, 2)}</pre>
					</div>
				</div>
			</div>
		{/if}
		{#if teamData && teamData.length > 0}
			<div class="grid grid-cols-7 gap-3">
				{#if mcData}
					<div
						class="flex flex-col items-center rounded-xl border border-blue-100 bg-blue-50/30 p-2 shadow-sm"
					>
						<img
							src={mcData.extraAssets.item.male}
							alt={mcData.name}
							class="h-full w-full object-cover"
						/>
					</div>
				{/if}
				{#each teamData as item, idx (idx)}
					<div
						class="flex flex-col items-center rounded-xl border border-blue-100 bg-blue-50/30 p-2 shadow-sm"
					>
						{#if item}
							<div class="relative mb-2 h-20 w-full overflow-hidden rounded-lg bg-white">
								<img
									src={item.details.extraAssets.faces.ascension[4]}
									alt={item.details.name}
									class="h-full w-full object-cover"
								/>
							</div>
							<div class="relative h-10 w-full">
								{#if item.ceDetails}
									<img
										src={item.ceDetails.extraAssets.equipFace.equip[item.ceDetails.id]}
										alt={item.id}
										class="h-full w-full rounded"
									/>
									{#if item.equip1.limitBreak}
										<div
											class="absolute -right-1 -bottom-1 h-5 w-5 rounded-full border-2 border-white bg-yellow-400 text-center text-[15px] leading-[15px] text-white"
										>
											★
										</div>
									{/if}
								{:else}
									<div class="h-full w-full rounded bg-gray-100"></div>
								{/if}
							</div>
						{:else}
							<div
								class="mb-2 flex h-20 w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-xs text-gray-300"
							>
								Empty
							</div>
							<div class="h-10 w-full rounded bg-gray-100"></div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
		{#if fgaCommand}
			<div class="rounded-xl border-2 border-blue-200 bg-blue-50 p-5">
				<h2 class="mb-2 text-lg font-bold text-blue-800">FGA 커맨드</h2>
				<div class="flex items-center gap-2">
					<code class="flex-1 rounded border bg-white p-3 font-mono break-all text-blue-600">
						{fgaCommand}
					</code>
					<button
						onclick={() => {
							navigator.clipboard.writeText(fgaCommand);
							alert('커맨드가 복사되었습니다!');
						}}
						class="rounded-lg bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700"
					>
						복사
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
</style>
