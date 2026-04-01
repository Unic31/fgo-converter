<script>
	import pako from 'pako';
	import { onMount } from 'svelte';

	let isLoading = $state(false);
	// sample
	let url = $state(
		'https://link.chaldea.center/laplace/share?data=GH4sIAMyGy2kA_9WYbW_aMBDHv4tfZ5LtPCzh3cpWrVL3ZmOvKlS5yQEWzkMTBw1V_e67cyCl7QotBbQKJMfmfP_zz3d2xB3LdXHWapOxQeL7HlNVte7GscduW2gsG9wxTSMBx0EuPFbNVANsgE9QQL78rpoZGzBxzWPOr-Mg5Wkq2L3HysrqsmjIQa6nM7sczpQu2MDWLXgs0426MfBtAQVqTJRpcLAqdWHP2skEZxWtMR5rdN4aZeGL7o2c6k8c-111VqhlQeUkVKgc1lPzZWN1OiwzcCH0vQtcjRTcYwYWYHAhnIItzjWY7NfCovTVHWsWluwCHkhOpjrXdli2FGuAUc21MRcZmcZxEobcixMeuEZEIR-vLC4XZIFS7jt2gKHIumE36j74g816NUG9ywUbhCiLTYzyys7Py5ZCpWBm1UYndevB3eF-4LqXFOpZDWq-Ro1j6EegP7htdSU2trSbZJ5NMW4CcmnaqiprO1pWSJEVZQHMY9NaFYRqtSX3Xs8r5EG0g1fkRwQqChyvKAy38OqwOKc9FtFFl3wkLBg-345FSh9xJIJySfpUSjugOJdyDUW-MVeCeDsUsn5Oxc16gQrnr8WCS7hR6bytnhZbtLPYEk7p4iU86prPu5MnelRTHzF5MB14-JQLf5w9fJU5PHF5hK0f7UTTOf6f2Uxqjeflv-jQET9G-wwMTPEuII0aKqNS-AH5DdQXRQZ_gNZ9JT0xJluVri4kTDnbCTg86L8h13KFy9HduL3Q6xLqkaqn0JF3N9BGn4Irc0KHHTuroZmVdIsSsXvaye1q4g1qck81vtfaxLvVxAlIPqjJLWpifzVlLR5YzFs99IeWc5KqGqd8Qve6GX3ta6DW-LqhTP_WQmZdVgs6AY8R5gE2_LhbcHg1cQKS4lUk5cHVjlQ6Lyez2CuZvXeUgtxaCvykG8g_yga-oCZPemfJI98ip1F5_ZrEwdbET6IijqNy2MNDvukm3BnmmISHKDdy_wZ0b4p_Ac7GteLlEAAA&questId=94098801&phase=1&enemyHash=1_0800_84c0cc1'
	);
	let decodedData = $state(null);
	let fgaCommand = $state('');
	let teamData = $state([]);
	let mcData = $state(null);
	let isError = $state(false);
	let isDarkMode = $state(false);

	// 해아할거
	// 예장이나 스킬 효과로 서번트가 거츠 보유중이면 자폭 보구로 안죽게 변경
	// 사용 방법 추가

	function toggleBansi() {
		isDarkMode = !isDarkMode;

		if (isDarkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

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

			if (decodedData.team?.mysticCode?.mysticCodeId) {
				mcData = await fetchMCDetails(decodedData.team.mysticCode.mysticCodeId);
			}

			// 서번트 api
			const team = [
				...decodedData.team.onFieldSvts, // [0, 1, 2]
				...decodedData.team.backupSvts // [3, 4, 5]
			];
			teamData = await fetchSvtDetails(team);

			fgaCommand = fncConvert(decodedData.actions, decodedData.delegate);
			// const cntRes = await (await fetch(`https://n8n.kstr.dev/webhook/6daee07e-8a2e-4a5e-982e-f07ee83c900f`)).json(e=>e.json);
			// const cntRes = 1;
			// console.log(`총 ${cntRes} 번 변환되었습니다.`);
		} catch (err) {
			console.error('fncConvertBtn:', err);
			isError = true;
			decodedData = null;
		} finally {
			isLoading = false;
		}
	}

	function fncConvert(actions, delegate) {
		if (actions.length <= 0) {
			alert('등록된 전투 데이터가 없습니다.');
			return '';
		}
		let command = '';
		let delayedActions = [];
		// 던전마다 몹 배치가 다르므로 시작 몹 타겟은 설정하지 않음. 스킬 쓸때만 타겟이 적이면 그것만 계산
		let currentEnemyTarget = null;
		// 서번트 교체가 있었을경우 해당 위치 미리 저장
		let swaps = delegate?.replaceMemberIndexes ? [...delegate.replaceMemberIndexes] : [];
		let frontSvtList = [teamData[0], teamData[1], teamData[2]];
		let backSvtList = [teamData[3], teamData[4], teamData[5]];

		// 서번트 스킬
		const svtSkillMap = [
			['a', 'b', 'c'],
			['d', 'e', 'f'],
			['g', 'h', 'i']
		];
		const masterSkill = ['j', 'k', 'l'];

		const svtDeath = (deadSvtIdx) => {
			const nextIdx = backSvtList.findIndex((b) => b !== null && b !== undefined);
			if (nextIdx !== -1) {
				frontSvtList[deadSvtIdx] = backSvtList[nextIdx];
				backSvtList[nextIdx] = null;
			} else {
				frontSvtList[deadSvtIdx] = null;
			}
			let newBackList = backSvtList.filter((b) => b !== null && b !== undefined);
			while (newBackList.length < 3) newBackList.push(null);
			backSvtList = newBackList;
		};
		const svtRetreat = (retreatSvtIdx) => {
			const retreatingSvt = frontSvtList[retreatSvtIdx];
			const nextIdx = backSvtList.findIndex((b) => b !== null && b !== undefined);
			if (nextIdx !== -1) {
				frontSvtList[retreatSvtIdx] = backSvtList[nextIdx];
				backSvtList[nextIdx] = null;
			} else {
				frontSvtList[retreatSvtIdx] = null;
			}
			let newBackList = backSvtList.filter((b) => b !== null && b !== undefined);
			newBackList.push(retreatingSvt);
			while (newBackList.length < 3) newBackList.push(null);
			backSvtList = newBackList;
		};
		actions.forEach((action) => {
			let needsEnemyTarget = false;

			if (action.type === 'attack') {
				action.attacks.forEach((atk) => {
					if (!atk.isTD) {
						needsEnemyTarget = true; // 평타 공격은 타겟팅 적용
					} else {
						const svtInfo = frontSvtList[atk.svt];
						const currentNP = svtInfo?.details?.noblePhantasms?.find(
							(np) => np.id === svtInfo.tdId
						);
						if (currentNP?.effectFlags?.includes('attackEnemyOne')) {
							needsEnemyTarget = true;
						}
					}
				});
			} else if (action.type === 'skill') {
				if (action.svt === undefined && mcData) {
					const skillData = mcData.skills[action.skill];
					needsEnemyTarget = skillData?.functions?.some((f) => f.funcTargetType === 'enemy');
				} else {
					const svtInfo = frontSvtList[action.svt];
					if (svtInfo?.details?.skills) {
						const currentSkillId = svtInfo.skillIds[action.skill];
						const exactSkill = svtInfo.details.skills.find((s) => s.id === currentSkillId);
						needsEnemyTarget = exactSkill?.functions?.some((f) => f.funcTargetType === 'enemy');
					}
				}
			}

			if (
				needsEnemyTarget &&
				action.options?.enemyTarget !== undefined &&
				action.options.enemyTarget !== currentEnemyTarget
			) {
				currentEnemyTarget = action.options.enemyTarget;
				const targetNum = 3 - currentEnemyTarget;
				command += `t${targetNum}`;
			}

			if (action.type === 'skill') {
				if (action.svt === undefined && mcData) {
					const skillData = mcData.skills[action.skill];
					const isOrderChange = skillData.functions.some((f) => f.funcType === 'replaceMember');
					const isTargeting = skillData.functions.some((f) => f.funcTargetType === 'ptOne');

					if (isOrderChange && swaps.length > 0) {
						const swap = swaps.shift();
						const fieldIdx = swap[0];
						const backupIdx = swap[1];

						let relativeBackupIdx = 0;
						for (let i = 0; i <= backupIdx; i++) {
							if (backSvtList[i] !== null && backSvtList[i] !== undefined) {
								relativeBackupIdx++;
							}
						}

						command += `x${fieldIdx + 1}${relativeBackupIdx}`;

						const temp = frontSvtList[fieldIdx];
						frontSvtList[fieldIdx] = backSvtList[backupIdx];
						backSvtList[backupIdx] = temp;
					} else {
						command += masterSkill[action.skill];
						if (isTargeting && action.options?.playerTarget !== undefined) {
							command += action.options.playerTarget + 1;
						}
					}
				} else {
					const svtInfo = frontSvtList[action.svt];

					if (svtInfo?.details?.skills) {
						const currentSkillId = svtInfo.skillIds[action.skill];
						const exactSkill = svtInfo.details.skills.find((s) => s.id === currentSkillId);
						const isTargeting = exactSkill.functions.some((f) => f.funcTargetType === 'ptOne');

						// 하베트롯(404200) 3스킬 -> 턴 종료 시 자폭
						if (svtInfo.svtId === 404200 && action.skill === 2) {
							delayedActions.push({ type: 'death', svtIdx: action.svt });
						}
						// 종토리(1102200) 3스킬 -> 턴 종료 시 자폭
						if (svtInfo.svtId === 1102200 && action.skill === 2) {
							delayedActions.push({ type: 'death', svtIdx: action.svt });
						}
						// 수영복 클로에(1101600) 2스킬 -> 턴 종료 시 후퇴
						if (svtInfo.svtId === 1101600 && action.skill === 1) {
							delayedActions.push({ type: 'retreat', svtIdx: action.svt });
						}

						command += svtSkillMap[action.svt][action.skill];
						if (isTargeting && action.options?.playerTarget !== undefined) {
							command += action.options.playerTarget + 1;
						}
					}
				}
			} else if (action.type === 'attack') {
				let atkCnt = 0; // 보구 전 평타 횟수
				let npCommand = ''; // 보구 커맨드 문자열
				action.attacks.forEach((atk) => {
					if (!atk.isTD) {
						// 보구를 안 썼을 때만 평타 횟수 추가
						if (npCommand === '') {
							atkCnt++;
						}
					} else {
						npCommand += atk.svt + 4;
						const svtInfo = frontSvtList[atk.svt];
						// 보구강화 리스트 중 해당 서번트가 장착된 보구 가져옴
						const currentNP = svtInfo?.details?.noblePhantasms?.find(
							(np) => np.id === svtInfo.tdId
						);

						// 자폭
						if (
							currentNP?.functions?.some(
								(func) => func.funcType === 'forceInstantDeath' && func.funcTargetType === 'self'
							)
						) {
							svtDeath(atk.svt);
						}
						// 발사
						else if (
							currentNP?.functions?.some(
								(func) =>
									func.funcType === 'forceInstantDeath' &&
									func.funcTargetType === 'ptSelfAnotherFirst'
							)
						) {
							// 자신을 제외한 가장 왼쪽(0번부터) 서번트 희생
							for (let i = 0; i < 3; i++) {
								if (i !== atk.svt && frontSvtList[i] !== null) {
									svtDeath(i);
									break;
								}
							}
						}
						// 후퇴
						else if (
							currentNP?.functions?.some(
								(func) => func.funcType === 'moveToLastSubmember' && func.funcTargetType === 'self'
							)
						) {
							svtRetreat(atk.svt);
						}
					}
				});

				if (atkCnt > 0) {
					command += `n${atkCnt}`;
				}
				command += npCommand;
				command += ',#,';

				// 예약해둔 지연스킬 발동(자폭, 후퇴) 일괄 실행
				if (delayedActions.length > 0) {
					delayedActions.forEach((delAct) => {
						if (delAct.type === 'death') {
							svtDeath(delAct.svtIdx);
						} else if (delAct.type === 'retreat') {
							svtRetreat(delAct.svtIdx);
						}
					});
					delayedActions = [];
				}
			}
		});
		if (command.endsWith(',#,')) {
			command = command.slice(0, -3);
		}
		return command;
	}

	function copyToClipboardActions() {
		if (!decodedData) return;

		// 텍스트로 변환 (들여쓰기 2칸 적용)
		const text = JSON.stringify(decodedData.actions, null, 2);

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
	function copyToClipboardAll() {
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

	onMount(() => {
		// fncConvertBtn();
	});
</script>

<div
	class="min-h-screen bg-gray-100 p-2 pt-5 transition-colors duration-300 md:p-5 dark:bg-gray-900"
>
	<div
		class="mx-auto flex max-w-5xl flex-col space-y-3 rounded-2xl bg-white p-5 shadow-lg transition-colors duration-300 dark:bg-gray-800 dark:shadow-gray-900/50"
	>
		<div class="flex items-end justify-between gap-3">
			<div>
				<h1 class="mb-1 text-3xl font-bold text-gray-800 transition-colors dark:text-gray-100">
					FGO 커맨드 변환기
				</h1>
				<div class="text-2xl text-gray-500 transition-colors dark:text-gray-400">
					칼데아(Chaldea) 앱의 공유 URL을 FGA용 텍스트로 변환합니다.<br />
				</div>
			</div>

			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="h-30 min-h-20 w-30 min-w-20 cursor-pointer transition-transform hover:scale-105 active:scale-90"
				onclick={toggleBansi}
			>
				<img
					src="/images/bansi1_no_bg.png"
					alt="Bansi Light Mode"
					class="h-full w-full object-contain dark:hidden"
				/>

				<img
					src="/images/bansi3_no_bg.png"
					alt="Bansi Dark Mode"
					class="hidden h-full w-full object-contain dark:block"
				/>
			</div>
		</div>

		<input
			type="text"
			bind:value={url}
			placeholder="https://link.chaldea.center/laplace/share?data=..."
			class="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 transition-colors outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
		/>
		<button
			onclick={fncConvertBtn}
			class="w-full cursor-pointer rounded-lg bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700 active:bg-blue-900 dark:bg-blue-500 dark:hover:bg-blue-600"
		>
			{isLoading ? '아틀라스원과 통신 중...' : '변환하기'}
		</button>
		<!-- {#if decodedData}
			<div class="relative rounded-lg bg-gray-900 p-4">
				<div class="mb-2 flex items-center justify-between">
					<h3 class="text-sm font-bold text-gray-400">압축 해제된 전체 JSON 데이터</h3>
					<button
						onclick={copyToClipboardAll}
						class="rounded bg-gray-700 px-2 py-1 text-xs text-gray-200 transition-colors hover:bg-gray-600"
					>
						복사하기 📑
					</button>
				</div>

				<div class="max-h-50 overflow-auto text-xs text-green-400">
					<pre>{JSON.stringify(decodedData, null, 2)}</pre>
				</div>
			</div>
			<div class="relative rounded-lg bg-gray-900 p-4">
				<div class="mb-2 flex items-center justify-between">
					<h3 class="text-sm font-bold text-gray-400">압축 해제된 ACTIONS JSON 데이터</h3>
					<button
						onclick={copyToClipboardActions}
						class="rounded bg-gray-700 px-2 py-1 text-xs text-gray-200 transition-colors hover:bg-gray-600"
					>
						복사하기 📑
					</button>
				</div>

				<div class="max-h-50 overflow-auto text-xs text-blue-400">
					<pre>{JSON.stringify(decodedData?.actions, null, 2)}</pre>
				</div>
			</div>
		{/if} -->

		{#if isError}
			<div class="rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/30 dark:text-red-400">
				⚠️ 올바른 링크인지 확인해주세요.
			</div>
		{/if}

		{#if teamData && teamData.length > 0}
			<div class="custom-scrollbar mt-4 flex flex-nowrap gap-3 overflow-x-auto pb-2">
				{#if mcData}
					<div
						class="flex min-w-30 flex-1 flex-col items-center rounded-xl border border-blue-100 bg-blue-50/30 p-2 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-700/50"
					>
						<img
							src={mcData?.extraAssets?.item?.female || mcData?.extraAssets?.item?.male}
							alt={mcData?.name || ''}
							class="h-full w-full rounded-lg object-cover"
						/>
					</div>
				{/if}

				{#each teamData as item, idx (idx)}
					<div
						class="flex min-w-30 flex-1 flex-col items-center rounded-xl border border-blue-100 bg-blue-50/30 p-2 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-700/50"
					>
						{#if item && item.details}
							<div
								class="relative mb-2 h-26 w-full overflow-hidden rounded-lg bg-white dark:bg-gray-800"
							>
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
								<img
									src={item.details.extraAssets?.faces?.ascension?.[4] ||
										item.details.extraAssets?.faces?.ascension?.[1]}
									alt={item.details.name}
									class="h-full w-full cursor-pointer object-cover transition-opacity hover:opacity-80"
									onclick={() => console.log(item)}
								/>
							</div>
							<div class="relative h-10 w-full">
								{#if item.ceDetails}
									<img
										src={item.ceDetails.extraAssets?.equipFace?.equip?.[item.ceDetails.id]}
										alt={item.ceDetails.name}
										class="h-full w-full rounded object-cover"
									/>
									{#if item.equip1?.limitBreak}
										<div
											class="absolute -right-1 -bottom-1 h-5 w-5 rounded-full border-2 border-white bg-yellow-400 text-center text-[15px] leading-[15px] text-white dark:border-gray-700"
										>
											★
										</div>
									{/if}
								{:else}
									<div class="h-full w-full rounded bg-gray-100 dark:bg-gray-600"></div>
								{/if}
							</div>
						{:else}
							<div
								class="mb-2 flex h-26 w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-xs text-gray-300 dark:border-gray-600 dark:text-gray-500"
							>
								Empty
							</div>
							<div class="h-10 w-full rounded bg-gray-100 dark:bg-gray-600"></div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		{#if fgaCommand}
			<div
				class="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-5 transition-colors dark:border-gray-600 dark:bg-gray-800"
			>
				<h2 class="mb-2 text-lg font-bold text-blue-800 dark:text-blue-300">FGA 커맨드</h2>
				<div class="flex items-center gap-2">
					<code
						class="flex-1 rounded border border-gray-200 bg-white p-3 font-mono break-all text-blue-600 transition-colors dark:border-gray-700 dark:bg-gray-900 dark:text-blue-400"
					>
						{fgaCommand}
					</code>
					<button
						onclick={() => {
							navigator.clipboard.writeText(fgaCommand);
							alert('커맨드가 복사되었습니다!');
						}}
						class="cursor-pointer rounded-lg bg-blue-600 px-4 py-3 font-bold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
					>
						복사
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		height: 6px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb {
		background-color: #cbd5e1; /* 연한 회색 (라이트 모드) */
		border-radius: 10px;
	}
	:global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
		background-color: #4b5563; /* 진한 회색 (다크 모드) */
	}
</style>
