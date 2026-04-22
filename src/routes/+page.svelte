<script>
	import { dev } from '$app/environment';
	import pako from 'pako';
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { i18n } from '$lib/i18n.js';

	let isLoading = $state(false);
	let url = $state('');
	let decodedData = $state(null);
	let fgaCommand = $state('');
	let testCommand = $state('');
	let svtData = $state([]);
	let mcData = $state(null);
	let isError = $state(false);
	let isDarkMode = $state(false);
	let isModal = $state(false);
	let isManual = $state(false);
	let language = $state('KR');
	let emptySvtList = ['Jeanne', 'Tomoe', 'Meltryllis', 'Mari', 'Tenochtitlan', 'Ereshkigal'];
	let t = $derived(i18n[language] || i18n['KR']);

	const svtSkillMap = [
		['a', 'b', 'c'],
		['d', 'e', 'f'],
		['g', 'h', 'i']
	];
	const masterSkill = ['j', 'k', 'l'];
	$effect(() => {
		if (isModal) {
			document.body.style.overflow = 'hidden';
			document.documentElement.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
			document.documentElement.style.overflow = '';
		}
	});
	$effect(() => {
		if (isManual) {
			document.body.style.overflow = 'hidden';
			document.documentElement.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
			document.documentElement.style.overflow = '';
		}
	});
	$effect(() => {
		if (language) {
			localStorage.setItem('language', language);
		}
	});

	// TO DO
	// 예장이나 스킬 효과로 서번트가 거츠 보유중이면 자폭 보구로 안죽게 변경
	// 던전 입장시 타겟 지정, 타겟 변경 없을시 tn 커맨드 제거

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

				// 서번트가 사용하는 보구, 스킬
				const activeNP = data.noblePhantasms?.find((np) => np.id === svt.tdId) || null;
				const activeSkills = svt.skillIds
					? svt.skillIds.map((skillId) => {
							return data.skills?.find((s) => s.id === skillId) || null;
						})
					: [];

				let svtImg;
				if (svt.limitCount <= 4) {
					svtImg = data.extraAssets?.faces?.ascension?.[Math.max(1, svt.limitCount)] || '';
				} else {
					svtImg = data.extraAssets?.faces?.costume?.[svt.limitCount] || '';
				}

				return {
					...svt,
					details: data,
					ceDetails: ceData,
					activeNP,
					activeSkills,
					svtImg
				};
			} catch (err) {
				console.error(`서번트(ID: ${svt.svtId}) 로드 실패:`, err);
				return { ...svt, details: null, ceDetails: null, activeNP: null, activeSkills: null };
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
			decodedData = null;
			fgaCommand = '';
			svtData = [];
			mcData = null;
			isLoading = true;
			isError = false;

			const urlObj = new URL(url.trim());
			let dataParam = urlObj.searchParams.get('data');

			// url에 data 없으면
			if (!dataParam) {
				isError = true;
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
			svtData = await fetchSvtDetails(team);
			fgaCommand = fncConvert(decodedData.actions, decodedData.delegate);
			if (!dev) {
				const params = new URLSearchParams();
				team.forEach((svt) => {
					if (svt && svt.svtId) {
						params.append('svtId', svt.svtId);
					}
				});
				console.log(params.toString());
				fetch(
					`https://n8n.kstr.dev/webhook/6daee07e-8a2e-4a5e-982e-f07ee83c900f?${params.toString()}`
				).catch((err) => {
					console.warn('카운트 API 호출 실패(무시됨):', err);
				});
			}
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
			alert('URL에 등록된 전투 데이터가 없습니다.');
			return '';
		}
		let command = '';
		let delayedActions = [];
		// 던전마다 몹 배치가 다르므로 시작 몹 타겟은 설정하지 않음. 스킬 쓸때만 타겟이 적이면 그것만 계산
		let currentEnemyTarget = null;
		// 서번트 교체가 있었을경우 해당 위치 미리 저장
		let swapList = delegate?.replaceMemberIndexes ? [...delegate.replaceMemberIndexes] : [];
		// 스킬에 선택 옵션이 있을 경우
		let skillSelectList = delegate?.skillActSelectSelections
			? [...delegate.skillActSelectSelections]
			: [];
		let tdTypeChangeList = delegate?.tdTypeChanges ? [...delegate.tdTypeChanges] : [];
		let frontSvtList = [svtData[0], svtData[1], svtData[2]];
		let backSvtList = [svtData[3], svtData[4], svtData[5]];

		const replaceSvt = (fieldIdx, isRetreat = false) => {
			const retreatingSvt = isRetreat ? frontSvtList[fieldIdx] : null;
			const nextIdx = backSvtList.findIndex((b) => b !== null && b !== undefined);

			if (nextIdx !== -1) {
				frontSvtList[fieldIdx] = backSvtList[nextIdx];
				backSvtList[nextIdx] = null;
			} else {
				frontSvtList[fieldIdx] = null;
			}

			let newBackList = backSvtList.filter((b) => b !== null && b !== undefined);
			if (isRetreat) newBackList.push(retreatingSvt);
			while (newBackList.length < 3) newBackList.push(null);
			backSvtList = newBackList;
		};

		actions.forEach((action) => {
			let enemyTargetCmd = '';
			if (action.type === 'skill') {
				// 타겟검사
				let needsEnemyTarget = false;
				if (action.svt === undefined && mcData) {
					const skillData = mcData.skills[action.skill];
					needsEnemyTarget = skillData?.functions?.some((f) => f.funcTargetType === 'enemy');
				} else {
					const svtInfo = frontSvtList[action.svt];
					if (svtInfo?.details?.skills && svtInfo?.activeSkills) {
						const latestSkill = svtInfo.activeSkills[action.skill];
						needsEnemyTarget = latestSkill?.functions?.some((f) => f.funcTargetType === 'enemy');
					}
				}
				// 타겟이 있거나 타겟 바꼈으면 커맨드 추가
				if (
					needsEnemyTarget &&
					action.options?.enemyTarget !== undefined &&
					action.options.enemyTarget !== currentEnemyTarget
				) {
					currentEnemyTarget = action.options.enemyTarget;
					enemyTargetCmd = `t${3 - currentEnemyTarget}`;
				}

				// 스킬커맨드생성
				let skillActionCmd = '';
				if (action.svt === undefined && mcData) {
					// 마스터 스킬
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

						skillActionCmd += `x${fieldIdx + 1}${relativeBackupIdx}`;

						const temp = frontSvtList[fieldIdx];
						frontSvtList[fieldIdx] = backSvtList[backupIdx];
						backSvtList[backupIdx] = temp;
					} else {
						skillActionCmd += masterSkill[action.skill];
						if (isTargeting && action.options?.playerTarget !== undefined) {
							skillActionCmd += action.options.playerTarget + 1;
						}
					}
				} else {
					// 서번트 스킬
					const svtInfo = frontSvtList[action.svt];
					if (svtInfo?.details?.skills) {
						const latestSkill = svtInfo.activeSkills[action.skill];
						const isTargeting = latestSkill?.functions?.some((f) => f.funcTargetType === 'ptOne');

						// 하베트롯(404200) 3스킬 -> 턴 종료 시 자폭
						if (svtInfo.svtId === 404200 && action.skill === 2) {
							delayedActions.push({ type: 'death', svtIdx: action.svt });
						}
						// 종토리(1102200) 3스킬 -> 턴 종료 시 자폭
						else if (svtInfo.svtId === 1102200 && action.skill === 2) {
							delayedActions.push({ type: 'death', svtIdx: action.svt });
						}
						// 만붕이(403900) 2스킬 -> 턴 종료 시 자폭
						else if (svtInfo.svtId === 403900 && action.skill === 1) {
							delayedActions.push({ type: 'death', svtIdx: action.svt });
						}
						// 수영복 클로에(1101600) 2스킬 -> 턴 종료 시 후퇴
						else if (svtInfo.svtId === 1101600 && action.skill === 1) {
							delayedActions.push({ type: 'retreat', svtIdx: action.svt });
						}

						let skillCmd = svtSkillMap[action.svt][action.skill];
						let optionCmd = '';
						let targetCmd =
							isTargeting && action.options?.playerTarget !== undefined
								? (action.options.playerTarget + 1).toString()
								: '';

						if (latestSkill?.script?.SelectAddInfo) {
							const optionCount = latestSkill.script.SelectAddInfo[0]?.btn?.length || 0;
							if (optionCount > 0) {
								const choiceIdx = skillSelectList.shift();
								if (choiceIdx !== undefined) {
									const options = [];
									const alphabet = ['A', 'B', 'C', 'D', 'E'];
									for (let i = 0; i < optionCount; i++) {
										options.push(`[Ch${optionCount}${alphabet[i]}]`);
									}
									optionCmd = options[choiceIdx] || '';

									// 수영복 시키 2스
									if (svtInfo.svtId === 2301100 && action.skill === 1) {
										if (choiceIdx === 0) {
											svtInfo.activeNP = { ...svtInfo.activeNP, effectFlags: ['attackEnemyAll'] };
										} else {
											svtInfo.activeNP = { ...svtInfo.activeNP, effectFlags: ['attackEnemyOne'] };
										}
									}
									// UDK 바게스트 3스
									else if (svtInfo.svtId === 204900 && action.skill === 2) {
										if (choiceIdx === 0) {
											svtInfo.activeNP = { ...svtInfo.activeNP, effectFlags: ['attackEnemyAll'] };
										} else {
											svtInfo.activeNP = { ...svtInfo.activeNP, effectFlags: ['attackEnemyOne'] };
										}
									}
								}
							}
						}

						// 어린슈 2스킬은 선택 타입에 따라 타깃지정하는방식
						if (svtInfo.svtId === 1100900 && action.skill === 1) {
							const changeType = tdTypeChangeList.shift();
							if (changeType !== undefined) {
								// 1: Arts -> 2, 2: Buster -> 3, 3: Quick -> 1
								const typeMap = { 1: '2', 2: '3', 3: '1' };
								targetCmd = typeMap[changeType] || '';
							}
						}
						// 에미야 3스킬 보구 색상 변경
						else if (svtInfo.svtId === 200100 && action.skill === 2) {
							const changeType = tdTypeChangeList.shift();
							if (changeType !== undefined) {
								// 1: Arts -> 7, 2: Buster -> 8
								// 타깃선택 스킬은 아니지만 옵션 붙이는 용도로 targetCmd 변수 사용
								const typeMap = { 1: '7', 2: '8' };
								targetCmd = typeMap[changeType] || '';
							}
						}
						// BB두바이 3스킬 보구 타입 변경
						else if (svtInfo.svtId === 2300600 && action.skill === 2) {
							const changeType = tdTypeChangeList.shift();
							if (changeType !== undefined) {
								// 1: CCC(광역보구) -> 7, 2: GGG(버프보구) -> 8
								// 타깃선택 스킬은 아니지만 옵션 붙이는 용도로 targetCmd 변수 사용
								const typeMap = { 1: '7', 2: '8' };
								targetCmd = typeMap[changeType] || '';
								if (targetCmd == 7) {
									svtInfo.activeNP = { ...svtInfo.activeNP, effectFlags: ['attackEnemyAll'] };
								} else {
									svtInfo.activeNP = { ...svtInfo.activeNP, effectFlags: ['support'] };
								}
							}
						}
						// 프톨레마이오스 3스킬 보구 타입 변신
						else if (svtInfo.svtId === 205000 && action.skill === 2) {
							if (svtInfo.activeNP?.effectFlags?.includes('attackEnemyOne')) {
								svtInfo.activeNP = { ...svtInfo.activeNP, effectFlags: ['attackEnemyAll'] };
							} else {
								svtInfo.activeNP = { ...svtInfo.activeNP, effectFlags: ['attackEnemyOne'] };
							}
						}
						// 멜루진 3스킬 보구 타입 변신 (단일 -> 광역 고정)
						else if (svtInfo.svtId === 304800 && action.skill === 2) {
							if (svtInfo.activeNP?.effectFlags?.includes('attackEnemyOne')) {
								svtInfo.activeNP = { ...svtInfo.activeNP, effectFlags: ['attackEnemyAll'] };
							}
						}
						if (optionCmd && targetCmd) {
							skillActionCmd += `${skillCmd}(${optionCmd}${targetCmd})`;
						} else {
							skillActionCmd += skillCmd + optionCmd + targetCmd;
						}
					}
				}
				command += enemyTargetCmd + skillActionCmd;
			} else if (action.type === 'attack') {
				// 타겟검사
				let needsEnemyTarget = false;
				action.attacks.forEach((atk) => {
					if (!atk.isTD) {
						needsEnemyTarget = true;
					} else {
						const svtInfo = frontSvtList[atk.svt];
						if (svtInfo?.activeNP?.effectFlags?.includes('attackEnemyOne')) {
							needsEnemyTarget = true;
						}
					}
				});
				// 타겟이 있거나 타겟 바꼈으면 커맨드 추가
				if (
					needsEnemyTarget &&
					action.options?.enemyTarget !== undefined &&
					action.options.enemyTarget !== currentEnemyTarget
				) {
					currentEnemyTarget = action.options.enemyTarget;
					enemyTargetCmd = `t${3 - currentEnemyTarget}`;
				}

				// 공격커맨드생성
				let atkCnt = 0; // 보구 전 평타 횟수
				let npCommand = ''; // 보구 커맨드 문자열
				let isNyoboCnt = 0;
				let attackActionCmd = '';

				action.attacks.forEach((atk) => {
					if (!atk.isTD) {
						// 보구를 안 썼을 때만 평타 횟수 추가
						if (npCommand === '') atkCnt++;
					} else {
						npCommand += atk.svt + 4;
						const svtInfo = frontSvtList[atk.svt];
						const currentNP = svtInfo?.activeNP;

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
								atk.svt;
								replaceSvt(atk.svt, false);
							}
						}
						// 진궁으로 발사
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
									replaceSvt(atk.svt, false);
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
							replaceSvt(atk.svt, true);
						}
					}
				});
				if (atkCnt > 0 && atkCnt < 3) {
					attackActionCmd += `n${atkCnt}`;
				}
				attackActionCmd += npCommand;
				attackActionCmd += ',#,';
				command += enemyTargetCmd + attackActionCmd;

				// 예약해둔 지연스킬 발동(자폭, 후퇴) 일괄 실행
				if (delayedActions.length > 0) {
					delayedActions.forEach((delAct) => {
						if (delAct.type === 'death') {
							replaceSvt(delAct.svtIdx, false);
						} else if (delAct.type === 'retreat') {
							replaceSvt(delAct.svtIdx, true);
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

	function toggleLight() {
		isDarkMode = !isDarkMode;
		if (isDarkMode) {
			document.documentElement.classList.add('dark');
			localStorage.setItem('theme', 'dark');
		} else {
			document.documentElement.classList.remove('dark');
			localStorage.setItem('theme', 'light');
		}
	}

	function copyToClipboard(json) {
		if (!decodedData) return;

		// 텍스트로 변환 (들여쓰기 2칸 적용)
		const text = JSON.stringify(json, null, 2);

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
		if (dev) {
			url =
				// 'https://link.chaldea.center/laplace/share?data=GH4sIAHQQz2kA_91XUW-bMBD-L35mkk0Chby12apV6l7W7KmKKgcuwYoxFAxaFPW_784Q2q5a2q5Luk2JuNxx5-_u8_kgW5Yrc9YonbJJPBp5TJblTj3hHrttoLZssmWKLGMeR5FAc5nJGthEeAwM5JvPss7YhIkbHo7GN6EQo3CxYHceK0qrClPTArlaZXYzzaQybGKrBjyWqlouNHxqwSDGUuoajWWhjD1rlkuMMo3WHqtV3mhp4VQNTg71K9q-lZ0XYlmQOQEZmcMuNN_UViXTIgWXwqBdYDU-FaKhBY2FcErWnCvQ6VVrEfp6y-rWOr-AC8HJV-XKTouGkh1jWmul9UVKvr6I4iAQni9iHgacpEA5750uW3JCOPedO5LBpJ3ZWd0Hb9j0HlGQetmySYDQKISPOUi7Pi8adOGUUVY6RTglcVXhHp1EsVMvKd-zCuR64A2NLQUjg7eNKsWDne2i9NMY7SKQn7opy6Kys02JbLJlpbAG5rFVJQ2R1gfceQNzIR_7-4mLeRAgX8SaEyfB77Pm0AbSRJd4_IAz8e6cmcLAXsZo55-hzPeDiMhCGXcy5MHbes3n_k-9Fv0LtGENC5msm_LJiY04F881nh-6jht1YrzvuPZMuVUP1mDitUSJF7eXm4V0mWNIChpWODkJxpV7mtgrtO2u3bymVvEE1l5BqWUCXyBfQHVhUvgOdPvaxx6i5eQQsWW2S8OtinnUlILoSUX-Hj0OcNUNVDNZrQC9eD_SdzpGURFFTgTjTZtVUGcFPZaI1zs6MvvRxFHR-BHQ-Itq8_842nFrO0aX-IfuEmktDibm9T-G4eSgE1lhyAdcTtWzj7t3oaRS-G4i9f1UQLfuXIv-AeFSenW0T3PyiJS-ZgP5m9H4gdH-o5p-3ZTi4G3Fj3pS-V_fxO-00fz9N3pOwFOEm7m_a90byg8vbpLGhg4AAA%3D%3D&questId=94098810&phase=1&enemyHash=1_0634_61136bb';
				// 'https://link.chaldea.center/laplace/share?data=GH4sIABlY0mkA_72X32_aMBDH_xc_Z5JtEkp4W9mqVepeVqY9VKgyyUEsnB9NHDSE-r_vzk7Tqt3aQUsE4rA5-3v38fmAPct1cd5qk7JpPBoFTFXVw_BMBOyuhcay6Z5pmgkF52LEA1ZlqgE2RQcoIN99U03Gpkzc8vEkul0my5iPFbsPWFlZXRYNbZDrdWZ3s0zpgk1t3ULAUt2opYGvWyhQY6VMg5NVqQt73q5WuKpojQlYo_PWKAufde_kVH_g3M_Ke6GWBZWTUKFyeFia7xqrk1mZgguhH11iNlJgIga2YDARTsEWFxpMer21KH2zZ83Wkl_EoxEnV51rOytbijXEqDbamMuUXKUcTaKIB2hjb0OOdtE5XW3JCdXcc-EYQ5H6aTfrHviBTXtBQaOrrWNs0MQYgbKbi7KlaCmerHoySFxKcchHceyGVxTteQ1q80Ab57bOHfHdtboSj8farTIv1hi_AuE0bVWVtZ3vKkTJirIAFrB1rQri1Z3LfdBDi7mQr0OLPSsUD50R4-OJObWeWOTjnrxF7ABEvpo-kI-MOI_fqCouuasmLkVnZXg8I694cFmdHlJS5jli8teSgp-EnEd4es5yb8djb-NufHZGmT3ni1NLlWza6vkdlhNsXG_UI5djKkQ-8iZ8Rz16uXex7hqdh_0fqDt_0nlJelVrDPdvBek2opcFLkrBwBqbKqmoxP4CatnXOJl0Xfzmkwg-CUyzhsqoBL5DvoT6skjhN9DHNwSBdlL9ij2zPgYHEkNoSJ13YN27J18SuOsO6rmq1-C9XKN_Mqb4y5xY4sBmNTRZSV9WhPCe7tframIANTlobnLQ3MSguT2qydOoKWuxXbCge9O3DLdJompcghXPdDP_0ne_WuNvCGUebyi6-Wsmqf8MWMyHQBFHqB1-0OIj0IuToz8ehhz0gF9DLwbtjWLQ4hUf3j9OlNu_i1geVcTBya7AwUkuSHiGcnP3t8r_XPgDgqeXKS4OAAA%3D&questId=94100130&phase=1&enemyHash=1_0685_bcb906a';
				// 'https://link.chaldea.center/laplace/share?data=GH4sIAElZ0mkA_9WU24rbMBCG30XXKsinrO27Ju3ShVy16VUJizaexCKyrLUkQwh5947kA8kubKEsS5uEyCP-mX_82ZozaYRaOiErUhZJQgnXegrznJJnB8aS8kxEEDD_iSjRNTdAStSDgub0jZualCR6ZAmLHmOep4ssIxdKWm1Fq4wv0IhDbU-rmgtFSts5oKQShj9J-NqDQo89lwY3dSuUXbr9HrOUk5ISIxonuYXPYhYF1--491MPKvSywBtvpHgDU2pzMlbsVm0FoYU5eqgmhYQeJCmZb1bdC5DVj96i9a8zMb31uphleNOoFI2wq9b5XhGBOQopHyovjeM8zjJGcU3GNVpkbDuK1r0XRYyGH-7aaq4b-Wjdh4oSlwKNuD3etw63gm2tr4Jd6LxIGUvSEK59U8sO-HGCinu-XIaQnp3Q0fzwpiT5KkWGBCRgnNZtZzcnjbzIvhOgKkLJoePKYxnxX-jMZsHS-CWb9IZNwTKPpGCLYbnL_ggmFP2XwahWwZtYEpbmL7GwGyx5vkiRR57fDUv-GgvF78wkVPwPmeANPPHd0enxVIVDN_9tsUwFEg54ktEaI74bBwaePztUDkywtOmvKOLxuZkuWvITdBveHWBQhQlxFfu-2sYzw8DWHZi69VPOo7r4Rze6cWuxX0LHi3kSBOg73mHKJ7wSZvNlhtgJHCtcztPJywYssQfwsW2yv2gzet82t954hXabMJKHN-E3e_X5HGoGAAA%3D&questId=93000001&phase=3&enemyHash=1_0301_2a84655';
				'https://chaldea.center/laplace/share?data=GH4sIAAAAAAACA9WW32-bMBDH_5d7vkk2hJb4bc1WrVKftuypiioXrsGKMS42SFHE_z7ZEJqte2jXdtOSKOTI937wueOSA9TKXHRKlyCWaYogrT2aeY7w0JHzIA6gooCFR4JgK-kIRIpAhur9F-kqEMBvWcb47R0_XyzOcxgQGutVY1wIUKtt5ferSioDwrcdIZTKyTtNn3syHsS91I4QbKOMv-ju7x0I02mN4FTdaenpo5pFMetX6em7HVUDgidZh0RG1nR0rffOq2LVlBRLmK2rEkTKEDT1pEFwFmo1l4p0-a33DsTNAVzvgyxjPGFBqmrlV00XSl0guJ3S-qoM0vwszzKO-XKRMUzScNhMgus-CDjD-NpEvGTK8TTD8Rm_8OWcLAnWdQ-CI-geRM4QpN9dNl2oNNRS2ROjoOtQ2kVLcjcDKmgKQA-dsvzYwZGKfqoPefiA4Dprm9av95ZAgGkMAcK2lSZwmdQDznA4Z3z5Kx32E50kXWYBT5IuzxZZEo7n2bMJ8QnSTGjMyN8MEXsRIvZyRP_z_LwTnA3CnSx2nZ3utRh1ftsMCCVp2kof7toBQRbTFrk5gB8jRzqAAfLjwMUrPlk5Vss9tWvZbmlUxbVxYoe6mhpEHGFfteSqJqy-AGYIPfxdtuS9s0nvZbEDnD7M2ygGKWRbxgFSbv3psV2t8qqQ-vGEbMuxCck0iyfe6fO9-VPv5CXem3-G6AM_1jn-2LzjReKr2vPXESWvmqLkVVOU_FF73hTRJiRetcqv4x-GcSX9ABKO6jgICQAA&questId=93000002&phase=3&enemyHash=1_0501_b174478';
			fncConvertBtn();
		}
		const savedTheme = localStorage.getItem('theme');
		if (
			savedTheme === 'dark' ||
			(!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
		) {
			isDarkMode = true;
			document.documentElement.classList.add('dark');
		}
		const savedLang = localStorage.getItem('language');
		if (savedLang) {
			language = savedLang;
		} else {
			const browserLang = navigator.language.toLowerCase();
			if (browserLang.startsWith('ko')) {
				language = 'KR';
			} else if (browserLang.startsWith('ja')) {
				language = 'JP';
			} else {
				language = 'EN';
			}
		}
	});
</script>

<div
	class="min-h-screen bg-gray-100 p-2 pt-5 transition-colors duration-300 md:p-5 dark:bg-gray-900"
>
	<div class="container mx-auto max-w-5xl">
		<div
			class="flex flex-col space-y-4 rounded-2xl bg-white p-5 shadow-lg transition-colors duration-300 dark:bg-gray-800"
		>
			<div class="grid grid-cols-[1fr_auto] grid-rows-[1fr_auto] gap-x-3 gap-y-2">
				<h1
					class="col-start-1 row-start-1 flex flex-wrap items-end gap-2 self-end text-3xl font-bold text-gray-900 transition-colors dark:text-gray-100"
				>
					<span class="leading-none">FGO Converter</span>
					<select
						class="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
						bind:value={language}
					>
						<option value="KR">KR</option>
						<option value="JP">JP</option>
						<option value="EN">EN</option>
					</select>
				</h1>

				<div
					class="text-1xl col-span-2 row-start-2 self-start text-gray-600 transition-colors md:col-span-1 md:col-start-1 dark:text-gray-400"
				>
					<span>{t.desc}</span>
					<button
						class="text-md inline-flex cursor-pointer items-center justify-center rounded-md bg-blue-100 px-2.5 py-1 font-semibold text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
						onclick={() => (isManual = !isManual)}
					>
						{t.btnDesc}
					</button>
				</div>

				<div
					class="col-start-2 row-start-1 max-h-30 min-h-20 max-w-30 min-w-20 cursor-pointer self-end transition-transform hover:scale-105 active:scale-90 md:row-span-2 md:self-end"
					onclick={toggleLight}
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

			<input
				type="text"
				bind:value={url}
				placeholder="https://link.chaldea.center/laplace/share?data=..."
				class="w-full rounded-lg border border-gray-300 p-3 text-gray-900 transition-colors outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
			/>
			<button
				onclick={fncConvertBtn}
				class="w-full cursor-pointer rounded-lg bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700 active:bg-blue-900 dark:bg-blue-500 dark:hover:bg-blue-600"
			>
				{isLoading ? t.loading1 : t.loading2}
			</button>

			{#if isError}
				<div class="rounded-lg bg-red-200 p-3 text-red-600 dark:bg-red-900/30 dark:text-red-400">
					{t.errorText}
				</div>
			{/if}
			<div class="custom-scrollbar flex flex-nowrap gap-2 overflow-x-auto">
				<div
					class="mb-2 flex h-[168px] min-w-[110px] flex-1 flex-col items-center rounded-xl border border-blue-200 bg-blue-50/30 p-2 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-700/50"
				>
					{#if svtData.length === 0 && !mcData}
						<img
							src="{base}/images/bansi_mystic_code.png"
							alt="bansi_mystic_code"
							class="h-full w-full rounded-lg object-cover"
						/>
					{:else if svtData.length > 0 && !mcData}
						<div
							class="mb-2 flex h-full w-full shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-xs text-gray-300 dark:border-gray-600 dark:text-gray-500"
						>
							Empty
						</div>
					{:else if svtData.length > 0 && mcData}
						<img
							src={mcData?.extraAssets?.item?.female || mcData?.extraAssets?.item?.male}
							alt={mcData?.name || ''}
							class="h-full w-full rounded-lg object-cover"
							onclick={() => console.log('mcData :', $state.snapshot(mcData))}
						/>
					{/if}
				</div>

				{#if svtData.length === 0}
					{#each emptySvtList as svtName, idx (idx)}
						<div
							class="flex h-[168px] min-w-[110px] flex-1 flex-col items-center rounded-xl border border-blue-200 bg-blue-50/30 p-2 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-700/50"
						>
							<img
								src="{base}/images/{svtName}.png"
								alt={svtName}
								class="h-full w-full rounded-lg object-cover"
							/>
						</div>
					{/each}
				{:else}
					{#each svtData as item, idx (idx)}
						<div
							class="flex h-[168px] min-w-[110px] flex-1 flex-col items-center rounded-xl border border-blue-100 bg-blue-50/30 p-2 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-700/50"
						>
							{#if item && item.details}
								<div
									class="relative mb-2 h-26 w-full shrink-0 overflow-hidden rounded-lg bg-white dark:bg-gray-800"
								>
									<img
										src={item.svtImg || `${base}/images/nunnos.png`}
										alt={item.details.name}
										onclick={() => console.log('svtData :', $state.snapshot(item))}
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
				class="rounded-xl border border-blue-200 bg-blue-50/30 p-3 transition-colors dark:border-gray-600 dark:bg-gray-700/50"
			>
				<div class="flex items-end justify-between">
					<h2 class="mb-2 text-lg font-bold text-gray-900 dark:text-gray-100">
						{t.commandText}
					</h2>
				</div>
				<div
					class="mb-2 flex cursor-pointer items-center rounded border border-gray-200 bg-white p-3 font-mono break-all text-gray-900 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
					onclick={() => {
						navigator.clipboard.writeText(fgaCommand);
						alert(t.clipboardAlert);
					}}
				>
					<div class="flex-1">
						{fgaCommand}
					</div>
					 <button
						class="ms-3 text-md inline-flex cursor-pointer items-center justify-center rounded-md bg-blue-100 px-2.5 py-1 font-semibold text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
					>
						{t.copy}
					</button>
				</div>
			</div>
			{#if dev}
				<div
					class="flex flex-col gap-2 rounded-xl border border-blue-200 bg-blue-50/30 p-3 transition-colors dark:border-gray-600 dark:bg-gray-700/50"
				>
					<!-- 개발 시작 -->
					<div class="flex items-end justify-between">
						<h2 class="mb-2 text-lg font-bold text-gray-900 dark:text-gray-100">
							커맨드를 기반으로 작성된 시뮬레이터 화면
						</h2>
					</div>
					<div
						class="flex cursor-pointer items-center rounded border border-gray-200 bg-white p-3 font-mono break-all text-gray-900 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
					></div>
					<input
						type="text"
						placeholder="비교용"
						bind:value={testCommand}
						class="w-full rounded-lg bg-gray-900 p-3 break-all {fgaCommand === testCommand
							? 'text-green-400'
							: 'text-red-400'}"
					/>
					<div class="relative rounded-lg bg-gray-900 p-4">
						<div class="mb-2 flex items-center justify-between">
							<h3 class="text-sm font-bold text-gray-400">압축 해제된 전체 JSON 데이터</h3>
							<button
								onclick={copyToClipboard(decodedData)}
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
								onclick={copyToClipboard(decodedData.delegate)}
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
								onclick={copyToClipboard(decodedData.actions)}
								class="rounded bg-gray-700 px-2 py-1 text-xs text-gray-200 transition-colors hover:bg-gray-600"
							>
								복사하기 📑
							</button>
						</div>

						<div class="max-h-50 overflow-auto text-xs text-blue-400">
							<pre>{JSON.stringify(decodedData?.actions, null, 2)}</pre>
						</div>
					</div>
				</div>
			{/if}
			<div class="text-red-600 transition-colors dark:text-red-400">
				{t.warningTitle}
				<ul class="list-disc pl-5">
					{#each t.warnings as warning}
						<li>{warning}</li>
					{/each}

					<li>
						<div>{t.unsupportedTitle}</div>
						{#each t.unsupportedList as item}
							<div>{item}</div>
						{/each}
					</li>

					<li>
						<span>{t.orderChangeWarning}</span>
						<button
							class="text-md inline-flex cursor-pointer items-center justify-center rounded-md bg-blue-100 px-2.5 py-1 font-semibold text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
							onclick={() => (isModal = true)}
						>
							{t.detailsBtn}
						</button>
					</li>
				</ul>
			</div>
		</div>
		<ul class="mt-1 space-y-1 text-end text-sm text-gray-500">
			<li>
				<a
					href="https://docs.google.com/forms/d/e/1FAIpQLSchVZotqT9RRD2tYW_sjOiu2lKgIGfv8xl0sFmyH7Aod2oQVg/viewform?usp=header"
					target="_blank"
					rel="noopener noreferrer"
					class="transition-colors hover:text-gray-800 hover:underline dark:hover:text-gray-300"
				>
					Feedback & Bug Report
				</a>
			</li>
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
				<h2 class="text-xl font-bold">
					{t.warningTitle}
				</h2>
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
				<div class="flex flex-col gap-2">
					<div>
						<img src="{base}/images/svt.png" class="w-150" alt="svt" />
					</div>
				</div>
			</div>

			<div class="mt-4 flex justify-end">
				<button
					class="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
					onclick={() => (isModal = false)}
				>
					{t.btnOk}
				</button>
			</div>
		</div>
	</div>
{/if}
{#if isManual}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
		onclick={() => (isManual = false)}
	>
		<div
			class="w-11/12 max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800 dark:text-white"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-bold">
					{t.bntHow}
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
					<div>{t.manualGuide.step1_title}</div>
					<img src="{base}/images/manual1.png" class="w-150" alt="sample1" />
					<div>{t.manualGuide.step1_desc}</div>

					<br />

					<div>{t.manualGuide.step2_title}</div>
					<img src="{base}/images/manual2.png" class="w-150" alt="sample2" />
					<div>{t.manualGuide.step2_desc}</div>
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
