<script>
	import pako from 'pako';
	import { onMount } from 'svelte';
	import { base } from '$app/paths';

	let isLoading = $state(false);
	let url = $state(
		'https://link.chaldea.center/laplace/share?data=GH4sIAK13zmkA_91XUW-bMBD-L35mkk0Chby12apV6l7W7KmKKgcuwYoxFAxaFPW_784Q2q5a2q5Luk2JuNxx5-_u8_kgW5Yrc9YonbJJPBp5TJblTj3hHrttoLZssmWKLGMeR5FAc5nJGthEeAwM5JvPss7YhIkbHo7GN6EQo3CxYHceK0qrClPTArlaZXYzzaQybGKrBjyWqlouNHxqwSDGUuoajWWhjD1rlkuMMo3WHqtV3mhp4VQNTg71K9q-lZ0XYlmQOQEZmcMuNN_UViXTIgWXwqBdYDU-FaKhBY2FcErWnCvQ6VVrEfp6y-rWOr-AC8HJV-XKTouGkh1jWmul9UVKvr6I4iAQni9iHgacpEA5750uW3JCOPedO5LBpJ3ZWd0Hb9j0HlGQetmySYDQKISPOUi7Pi8adOGUUVY6RTglcVXhHp1EsVMvKd-zCuR64A2NLQUjg7eNKsWDne2i9NMY7SKQn7opy6Kys02JbLJlpbAG5rFVJQ2R1gfceQNzIR_7-4mLeRAgX8SaEyfB77Pm0AbSRJd4_IAz8e6cmcLAXsZo55-hzPeDiMhCGXcy5MHbes3n_k-9Fv0LtGENC5msm_LJiY04F881nh-6jht1YrzvuPZMuVUP1mDitUSJF7eXm4V0mWNIChpWODkJxpV7mtgrtO2u3bymVvEE1l5BqWUCXyBfQHVhUvgOdPvaxx6i5eQQsWW2S8OtinnUlILoSUX-Hj0OcNUNVDNZrQC9eD_SdzpGURFFTgTjTZtVUGcFPZaI1zs6MvvRxFHR-BHQ-Itq8_842nFrO0aX-IfuEmktDibm9T-G4eSgE1lhyAdcTtWzj7t3oaRS-G4i9f1UQLfuXIv-AeFSenW0T3PyiJS-ZgP5m9H4gdH-o5p-3ZTi4G3Fj3pS-V_fxO-00fz9N3pOwFOEm7m_a90byg8vbpLGhg4AAA%3D%3D&questId=94098810&phase=1&enemyHash=1_0634_61136bb'
		// 'https://link.chaldea.center/laplace/share?data=GH4sIAIn9zWkA_9WXUW_aMBDHv4ufM8l2CE14W9mqVepeNvY0ocolB7FwnDRx0FDV776zHVJKWwoUmKZEcmzO9_f9fGeLB5JLfdlIlZJBEoYBEWW56sYsIPcN1IYMHoi0Iz2aRCHF4TITNZABfoGGfPlN1BkZEHZL-yy6pamgIkrJY0CK0shC19ZBLmeZWQ4zITUZmKqBgKSyFncKvi5Ao8ZUqBoHy0Jqc9lMpzhLN0oFpJZ5o4SBz7Izcqo_cOxX6a1Qy4DIrZAWOaym5svayMmwSMEtoetdYzSc0YAoWIDCQKhdrL6SoNKfC4PSvx9IvTDWjlGKr7WVuTTDorGL7eGy5lKp69Taxqzfj2gQs4vINXEU8XFrcbOwFqjl3rEjDDr1w27UPfiDSZ_kmO3eLBxihU2C-sLMr4rGWWAvK9c6ExcR7k8Ycde9sWu9rEDMV7BxzLqLEN59I0u2tql-knoxRbkJSKZuyrKozGhZIkeiCw0kILNKaAur3ZTHoCPGI8r4dmKcR7FlhW3i2z7F9lBoXpGvoEV-7fF70NYptZnlMdFNSj6d1Et7q0P3R9Sn7OI9QiFy6UWOjoO1ASfApwPg_PGNpIl3TBqWXOyfNH7SR5MGA7gTk3lTblYdj10dbCOUUG6rLqGhb3r9DySQk9u76s6eQM5NB6lHe-_UWRy78oqRjmvYBxg5NbZRYzsfTEmyPccofe1kcrPeSDK6M7YxGqagYIY3hvVeQanEBL5DfgfVtU7hD9iYMWg-trZi0l5bmI_Ge3bE0HVtvdKWIObNszsOvS6hGolqBt7K3VNrfbuuIrfUsGOyCuqsUP7Qp4_2eGjVhDFYFSRoP7rKcE4mosIpn3AnZD360mGsJF5uQj0lIpp5LKEts1Ms8xkUdhAUdqDa0xbQE6v9i5jYWdW2xcaPpMZ2iu34avTEaidVOe4xwLYeA_yshcnPWjL8fymZtzecH7Dh_LgbPrbCQ5QbuX9a_mr9C__Z1hpBDgAA&questId=94095301&phase=1&enemyHash=1_0615_0da0a5d'
	);
	let decodedData = $state(null);
	let fgaCommand = $state('');
	let teamData = $state([]);
	let mcData = $state(null);
	let isError = $state(false);
	let isDarkMode = $state(false);
	let isModal = $state(false);
	let emptySvtList = ['Jeanne', 'Tomoe', 'Meltryllis', '3', '4', '5'];
	$effect(() => {
		if (isModal) {
			document.body.style.overflow = 'hidden';
			document.documentElement.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
			document.documentElement.style.overflow = '';
		}
	});

	// 해아할거
	// 예장이나 스킬 효과로 서번트가 거츠 보유중이면 자폭 보구로 안죽게 변경
	// 사용 방법 추가
	// 만붕이 2스 강퀘 전 후, 앙리 5턴 후 사망

	function toggleBansi() {
		isDarkMode = !isDarkMode;
		if (isDarkMode) {
			document.documentElement.classList.add('dark');
			localStorage.setItem('theme', 'dark');
		} else {
			document.documentElement.classList.remove('dark');
			localStorage.setItem('theme', 'light');
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
			console.log('decodedData :', $state.snapshot(decodedData));

			if (decodedData.team?.mysticCode?.mysticCodeId) {
				mcData = await fetchMCDetails(decodedData.team.mysticCode.mysticCodeId);
				console.log('mcData :', $state.snapshot(mcData));
			}

			// 서번트 api
			const team = [
				...decodedData.team.onFieldSvts, // [0, 1, 2]
				...decodedData.team.backupSvts // [3, 4, 5]
			];
			teamData = await fetchSvtDetails(team);
			console.log('teamData :', $state.snapshot(teamData));

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
		let swapList = delegate?.replaceMemberIndexes ? [...delegate.replaceMemberIndexes] : [];
		// 스킬에 선택 옵션이 있을 경우
		let skillSelectList = delegate?.skillActSelectSelections ? [...delegate.skillActSelectSelections] : [];
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
						// 해당 서번트가 사용하는 스킬
						// const currentSkillId = svtInfo.skillIds[action.skill];
						// const exactSkill = svtInfo.details.skills.find((s) => s.id === currentSkillId);
						// needsEnemyTarget = exactSkill?.functions?.some((f) => f.funcTargetType === 'enemy');

						// 무조건 강퀘 적용
						const slotSkills = svtInfo.details.skills.filter((s) => s.num === action.skill + 1);
						const latestSkill = slotSkills[slotSkills.length - 1]; // 배열의 가장 마지막(최신) 스킬 선택
						needsEnemyTarget = latestSkill?.functions?.some((f) => f.funcTargetType === 'enemy');
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

					if (isOrderChange && swapList.length > 0) {
						const swap = swapList.shift();
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
						// 해당 서번트가 사용한 스킬
						// const currentSkillId = svtInfo.skillIds[action.skill];
						// const exactSkill = svtInfo.details.skills.find((s) => s.id === currentSkillId);
						// const isTargeting = exactSkill.functions.some((f) => f.funcTargetType === 'ptOne');

						// 무조건 강퀘 적용
						const slotSkills = svtInfo.details.skills.filter((s) => s.num === action.skill + 1);
						const latestSkill = slotSkills[slotSkills.length - 1]; // 배열의 가장 마지막(최신) 스킬 선택
						const isTargeting = latestSkill?.functions?.some((f) => f.funcTargetType === 'ptOne');

						// 하베트롯(404200) 3스킬 -> 턴 종료 시 자폭
						if (svtInfo.svtId === 404200 && action.skill === 2) {
							delayedActions.push({ type: 'death', svtIdx: action.svt });
						}
						// 종토리(1102200) 3스킬 -> 턴 종료 시 자폭
						if (svtInfo.svtId === 1102200 && action.skill === 2) {
							delayedActions.push({ type: 'death', svtIdx: action.svt });
						}
						// 만붕이(403900) 2스킬 -> 턴 종료 시 자폭
						if (svtInfo.svtId === 403900 && action.skill === 1) {
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
				let isNyoboCnt = 0;
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
							// 뇨보는 보구 두번 사용시 사망
							if (svtInfo.id === '605200' && isNyoboCnt < 1) {
								isNyoboCnt++;
							} else {
								svtDeath(atk.svt);
							}
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
		fncConvertBtn();
		const savedTheme = localStorage.getItem('theme');
		if (
			savedTheme === 'dark' ||
			(!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
		) {
			isDarkMode = true;
			document.documentElement.classList.add('dark');
		}
	});
</script>

<div
	class="min-h-screen bg-gray-100 p-2 pt-5 transition-colors duration-300 md:p-5 dark:bg-gray-900"
>
	<div class="container mx-auto max-w-5xl">
		<div
			class="flex flex-col space-y-3 rounded-2xl bg-white p-5 shadow-lg transition-colors duration-300 dark:bg-gray-800 dark:shadow-gray-900/50"
		>
			<div class="flex items-end justify-between gap-3">
				<div>
					<h1 class="mb-1 text-3xl font-bold text-gray-800 transition-colors dark:text-gray-100">
						FGO Converter
					</h1>
					<div class="text-2xl text-gray-500 transition-colors dark:text-gray-400">
						칼데아앱(Chaldea)의 공유 URL을 폰닉(FGA)용 텍스트로 변환합니다.
					</div>
				</div>

				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="h-30 min-h-20 w-30 min-w-20 cursor-pointer transition-transform hover:scale-105 active:scale-90"
					onclick={toggleBansi}
				>
					<img
						src="{base}/images/bansi1_no_bg.png"
						alt="Bansi Light Mode"
						class="h-full w-full object-contain dark:hidden"
					/>

					<img
						src="{base}/images/bansi3_no_bg.png"
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
			{#if decodedData}
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
						<h3 class="text-sm font-bold text-gray-400">압축 해제된 DELEGATE JSON 데이터</h3>
						<button
							onclick={copyToClipboardAll}
							class="rounded bg-gray-700 px-2 py-1 text-xs text-gray-200 transition-colors hover:bg-gray-600"
						>
							복사하기 📑
						</button>
					</div>

					<div class="max-h-50 overflow-auto text-xs text-green-400">
						<pre>{JSON.stringify(decodedData?.delegate, null, 2)}</pre>
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
			{/if}

			{#if isError}
				<div class="rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/30 dark:text-red-400">
					⚠️ 올바른 링크인지 확인해주세요.
				</div>
			{/if}

			<div class="custom-scrollbar mt-4 flex flex-nowrap gap-3 overflow-x-auto pb-2">
				<div
					class="flex h-[168px] min-w-[110px] flex-1 flex-col items-center rounded-xl border border-blue-100 bg-blue-50/30 p-2 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-700/50"
				>
					{#if mcData}
						<img
							src={mcData?.extraAssets?.item?.female || mcData?.extraAssets?.item?.male}
							alt={mcData?.name || ''}
							class="h-full w-full rounded-lg object-cover"
						/>
					{:else}
						<img
							src="{base}/images/bansi_mystic_code.png"
							alt="bansi_mystic_code"
							class="h-full w-full rounded-lg object-cover"
						/>
					{/if}
				</div>

				{#if teamData.length === 0}
					{#each emptySvtList as svtName, idx (idx)}
						<div
							class="flex h-[168px] min-w-[110px] flex-1 flex-col items-center rounded-xl border border-blue-100 bg-blue-50/30 p-2 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-700/50"
						>
							<img
								src="{base}/images/{svtName}.png"
								alt={svtName}
								class="h-full w-full rounded-lg object-cover"
							/>
						</div>
					{/each}
				{:else}
					{#each teamData as item, idx (idx)}
						<div
							class="flex h-[168px] min-w-[110px] flex-1 flex-col items-center rounded-xl border border-blue-100 bg-blue-50/30 p-2 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-700/50"
						>
							{#if item && item.details}
								<div
									class="relative mb-2 h-26 w-full shrink-0 overflow-hidden rounded-lg bg-white dark:bg-gray-800"
								>
									<img
										src={item.details.extraAssets?.faces?.ascension?.[4] ||
											item.details.extraAssets?.faces?.ascension?.[1]}
										alt={item.details.name}
										class="h-full w-full object-cover transition-opacity hover:opacity-80"
									/>
								</div>
								<div class="relative h-10 w-full shrink-0">
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
									class="mb-2 flex h-26 w-full shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-xs text-gray-300 dark:border-gray-600 dark:text-gray-500"
								>
									Empty
								</div>
								<div class="h-10 w-full shrink-0 rounded bg-gray-100 dark:bg-gray-600"></div>
							{/if}
						</div>
					{/each}
				{/if}
			</div>

			<div
				class="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-5 transition-colors dark:border-gray-600 dark:bg-gray-800"
			>
				<div class="flex items-end justify-between">
					<h2 class="mb-2 text-lg font-bold text-blue-800 dark:text-blue-300">FGA 커맨드</h2>
				</div>
				<div
					class="flex cursor-pointer items-center rounded border border-gray-200 bg-white p-3 font-mono break-all text-blue-600 transition-colors dark:border-gray-700 dark:bg-gray-900 dark:text-blue-400"
					onclick={() => {
						navigator.clipboard.writeText(fgaCommand);
						alert('커맨드가 복사되었습니다!');
					}}
				>
					<div class="flex-1">
						{fgaCommand}
					</div>
					<div class="ms-3">📑</div>
				</div>
			</div>
			<div class="text-red-600 transition-colors dark:text-red-400">
				⚠️ 주의사항 ⚠️
				<ul class="list-disc pl-5">
					<li>오류로 인한 사과 손실은 책임지지 않지만 제보는 감사합니다.</li>
					<li>반복 프리 퀘스트 외 특수 기믹이 있는 퀘스트나 스토리에 사용을 권장하지 않습니다.</li>
					<li>스킬은 무조건 강화 퀘스트가 적용된 스킬로 계산합니다.</li>
					<li>앙리 마유의 3 스킬의 사망 로직은 계산하지 않습니다. 사용에 주의해 주세요.</li>
					<li>예장이나 스킬 효과로 인한 거츠를 계산하지 않습니다.(추후 업데이트 예정)</li>
					<li>
						<div class="flex">
							<div>
								오더 체인지, 자폭, 후퇴 서번트를 사용 할 경우 전투 시뮬레이터 파티 구성시에 사용하지
								않는 서번트라도 편성하는걸 추천드립니다.<span
									class="ms-1 cursor-pointer text-gray-700 transition-colors dark:text-gray-300"
									onclick={() => (isModal = true)}
								>
									설명
								</span>
							</div>
						</div>
					</li>
				</ul>
			</div>
		</div>
		<ul class="mt-1 space-y-1 text-end text-sm text-gray-500">
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
</div>
{#if isModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
		onclick={() => (isModal = false)}
	>
		<div
			class="w-11/12 max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800 dark:text-white"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-bold">오더 체인지, 자폭, 후퇴 편성 주의</h2>
				<button
					class="ml-3 cursor-pointer text-lg text-black text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
					onclick={() => (isModal = false)}
				>
					✕
				</button>
			</div>

			<div
				class="max-h-[70vh] overflow-y-auto pr-2 text-sm leading-relaxed text-black dark:text-gray-300"
			>
				<div class="flex flex-col gap-1">
					<div>시뮬레이터 파티 구성시</div>
					<img src="{base}/images/sample1.png" class="w-150" />
					<div>위 와 같은 화면으로 사용하는 서번트 외 자리를 비워두게 되는데</div>
					<img src="{base}/images/sample2.png" class="w-150" />
					<div>보통 인게임 파티 편성시 코스트가 남으면 아무 서번트나 배치하게 됩니다.</div>
					<div>이를 오더 체인지로 확인해보면</div>
					<img src="{base}/images/sample3.png" class="w-150" />
					<img src="{base}/images/sample4.png" class="w-150" />
					<div>후열 서번트 배치가 아예 달라지는걸 확인할 수 있습니다.</div>
					<div>
						오더 체인지, 자폭, 후퇴 서번트를 사용 할 경우 전투 시뮬레이터 파티 구성시에 사용하지
						않는 서번트도 편성하는걸 추천드립니다.
					</div>
				</div>
			</div>

			<div class="mt-4 flex justify-end">
				<button
					class="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
					onclick={() => (isModal = false)}
				>
					확인
				</button>
			</div>
		</div>
	</div>
{/if}

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
