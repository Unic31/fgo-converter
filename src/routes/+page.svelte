<script>
	import { dev } from '$app/environment';
	import pako from 'pako';
	import { onMount } from 'svelte';
	import { base } from '$app/paths';

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
				// 무조건 강화퀘스트 적용된 보구, 스킬
				// const currentNP = data.noblePhantasms?.find((np) => np.id === svt.tdId);
				// const targetNpNum = currentNP ? currentNP.npNum : 1;
				// const sameTypeNpList = data.noblePhantasms?.filter((np) => np.npNum === targetNpNum) || [];
				// const activeNP = sameTypeNpList[sameTypeNpList.length - 1];
				// const activeSkills = [1, 2, 3].map((num) => {
				// 	const slotSkills = data.skills?.filter((s) => s.num === num) || [];
				// 	return slotSkills[slotSkills.length - 1];
				// });
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
				const cntRes = await fetch(
					`https://n8n.kstr.dev/webhook/6daee07e-8a2e-4a5e-982e-f07ee83c900f`
				)
					.then((res) => res.json())
					.catch((err) => {
						console.warn('카운트 API 호출 실패(무시됨):', err);
						return 0;
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
				if (atkCnt > 0) {
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
				'https://link.chaldea.center/laplace/share?data=GH4sIAGd30mkA_8WWUW_bIBDHvwvPTAIcN3XelmzVKvVpy56mqKIxiVEwpgZbiqp-991B4mWN2m7d5ilR8J3u-B8_OJwHUms777QpyazIMkqkc0dzmlNy3ykfyOyB6BjAMi6YoMRV0isyg3hlVb3_JH1FZoTfsiLPb9lE5GpTkkdKGhd0Yz1OUOttFfaLSmpLZqHtFCWl9vLOqI-9sqCxkcaD0zXahnm32UCW7YyhxOu6MzKo93oIiqqfwffVpSjQCkrWKGRlrY6p9d4HvV40pYolDNY1rEZcMEqM6pUhM86wWHullSm_9AGkvz0Q3weMy1meMQzVtQ6LpsNawfQ7bcx1iaFCZJd5ziiMRRonDMbVIeimxyDOaPyuImNly-QGF2X4AX8oBz2O1k0PlYEwDAUoyrC7ajosFsup3ImxVjdY3bxVcjdAAmcfS1X3nXb8uIuJjDmPRx3k4DvnmjYs9w6okU2roVhCybaVFuEc4h_pQEjkjBWvIGKCRTRM8MMoJs8gepVQ0vttRJhaTNh0cnlGLJ3HBIyzM2RDljnLMSnjDJttrHoR2pSJy6fM0Jf9DC6b5sgrm16kYXpGrQA-xcAmTiuOaPJU4MUvosmK4g1oUtYfo4El3Mn1rnOHBozndPhZwTSlMmoLTQ_aYMn14W6BVg1p5kgFpvb9yQGMTycXkTNyr9qlbLcqRcXL5MTGupoaDxQYoWqVrxq8EBHWI-7gy2p8BDU-6tr4qGsTo63tn65JhgCnmdDDw_BKiZOsZQsp70Ba--WHoclaDe8naX7c4BCWmkZge4x4iMXYUPiboNCnSNkx-Rj8fHY2ZPM3Za9G7QUxSi-wsbdd_Idt_6sbt0LlBcgt49_P9Cr7Dp8cfKNWCwAA&questId=93031202&phase=3&enemyHash=1_0955_0425efd';
			// fncConvertBtn();
			console.log(mcData);
			console.log(svtData);
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
			class="flex flex-col space-y-3 rounded-2xl bg-white p-5 shadow-lg transition-colors duration-300 dark:bg-gray-800"
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
					{#if language == 'KR'}
						<span>칼데아앱(Chaldea)의 공유 URL을 폰닉(FGA)용 커맨드로 변환합니다.</span>
						<button
							class="text-md inline-flex items-center justify-center rounded-md bg-blue-100 px-2.5 py-1 font-semibold text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
							onclick={() => (isManual = !isManual)}
						>
							사용방법
						</button>
					{:else if language == 'JP'}
						<span>カルデアアプリ(Chaldea)の共有URLをFGA用コマンドに変換します。</span>
						<button
							class="text-md inline-flex items-center justify-center rounded-md bg-blue-100 px-2.5 py-1 font-semibold text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
							onclick={() => (isManual = !isManual)}
						>
							使い方
						</button>
					{:else}
						<span>Converts the shared URL of Chaldea to a command for FGA.</span>
						<button
							class="text-md inline-flex items-center justify-center rounded-md bg-blue-100 px-2.5 py-1 font-semibold text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
							onclick={() => (isManual = !isManual)}
						>
							How to use
						</button>
					{/if}
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
				{#if language == 'KR'}
					{isLoading ? '아틀라스원과 통신 중...' : '변환하기'}
				{:else if language == 'JP'}
					{isLoading ? 'アトラス院と通信中...' : '変換する'}
				{:else}
					{isLoading ? 'Communicating with Atlas Academy...' : 'Convert'}
				{/if}
			</button>

			{#if isError}
				<div class="rounded-lg bg-red-200 p-3 text-red-600 dark:bg-red-900/30 dark:text-red-400">
					{#if language == 'KR'}
						⚠️ 올바른 링크인지 확인해주세요.
					{:else if language == 'JP'}
						⚠️ 正しいリンクかご確認ください。
					{:else}
						⚠️ Please check if the link is valid.
					{/if}
				</div>
			{/if}
			<div class="custom-scrollbar flex flex-nowrap gap-2 overflow-x-auto pb-2">
				<div
					class="flex h-[168px] min-w-[110px] flex-1 flex-col items-center rounded-xl border border-blue-200 bg-blue-50/30 p-2 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-700/50"
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
										src={item.svtImg}
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
						{#if language == 'KR'}
							변환된 커맨드
						{:else if language == 'JP'}
							変換されたコマンド
						{:else}
							Converted Command
						{/if}
					</h2>
				</div>
				<div
					class="mb-2 flex cursor-pointer items-center rounded border border-gray-200 bg-white p-3 font-mono break-all text-gray-900 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
					onclick={() => {
						navigator.clipboard.writeText(fgaCommand);
						alert('클립보드에 저장되었습니다!');
					}}
				>
					<div class="flex-1">
						{fgaCommand}
					</div>
					<div class="ms-3">📑</div>
				</div>

				{#if dev}
					<!-- 개발 시작 -->
					<div class="flex items-end justify-between">
						<h2 class="mb-2 text-lg font-bold text-gray-900 dark:text-gray-100">
							{#if language == 'KR'}
								커맨드를 기반으로 작성된 시뮬레이터 화면
							{:else if language == 'JP'}
								コマンドを基に作成されたシミュレーター画面
							{:else}
								Simulator view generated from the commands
							{/if}
						</h2>
					</div>
					<div
						class="flex cursor-pointer items-center rounded border border-gray-200 bg-white p-3 font-mono break-all text-gray-900 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
					></div>
				{/if}
				{#if dev}
					<br />
					<input
						type="text"
						placeholder="비교용"
						bind:value={testCommand}
						class="w-full cursor-pointer items-center rounded border border-gray-200 bg-white p-3 font-mono break-all text-blue-600 transition-colors dark:border-gray-700 dark:bg-gray-900 dark:text-blue-400"
					/>
					{#if fgaCommand == testCommand}
						<div
							class="w-full cursor-pointer items-center rounded border border-gray-200 bg-white p-3 font-mono break-all text-blue-600 transition-colors dark:border-gray-700 dark:bg-gray-900 dark:text-blue-400"
						>
							두개 같음
						</div>
					{:else}
						<div
							class="w-full cursor-pointer items-center rounded border border-gray-200 bg-white p-3 font-mono break-all text-red-600 transition-colors dark:border-gray-700 dark:bg-gray-900 dark:text-red-400"
						>
							두개 다름
						</div>
					{/if}
				{/if}
			</div>
			{#if dev}
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
			{/if}
			<div class="text-red-600 transition-colors dark:text-red-400">
				{#if language === 'KR'}
					⚠️ 주의사항 ⚠️
					<ul class="list-disc pl-5">
						<li>
							영어와 일본어는 AI를 사용하여 번역되었으며 어색하거나 부자연스러운 표현이 있을 수
							있습니다.
						</li>
						<li>오류로 인한 사과 손실은 책임지지 않지만 제보는 감사합니다.</li>
						<li>
							반복 프리 퀘스트 외 특수 기믹이 있는 퀘스트나 스토리에 사용을 권장하지 않습니다.
						</li>
						<li>
							<div>현재 계산하지 않는 로직(추후 업데이트 예정)</div>
							<div>앙리 마유 - 3스킬(사용 후 5턴 뒤 사망)</div>
							<div>
								만드리카르도 - 2스킬(강화 전 - 공격 후 사망 / 강화 후 - 공격 턴 종료 후 사망)
							</div>
							<div>예장, 스킬 효과로 인한 거츠</div>
						</li>
						<li>
							<div class="flex">
								<div>
									오더 체인지, 자폭, 후퇴 서번트를 사용 할 경우 전투 시뮬레이터 파티 구성시에
									사용하지 않는 서번트라도 편성하는걸 추천드립니다.<span
										class="ms-1 cursor-pointer text-gray-700 transition-colors dark:text-gray-300"
										onclick={() => (isModal = true)}
									>
										설명
									</span>
								</div>
							</div>
						</li>
					</ul>
				{:else if language === 'JP'}
					⚠️ 注意事項 ⚠️
					<ul class="list-disc pl-5">
						<li>
							英語および日本語の翻訳にはAIを使用しているため、不自然な表現が含まれる場合があります。
						</li>
						<li>
							エラーによるリンゴの損失については責任を負いかねますが、バグ報告は歓迎いたします。
						</li>
						<li>
							周回用のフリークエスト以外の、特殊なギミックがあるクエストやストーリーでの使用は推奨しません。
						</li>
						<li>
							<div>現在対応していないロジック（今後のアップデートで対応予定）</div>
							<div>アンリマユ - スキル3（使用後5ターン経過で戦闘不能）</div>
							<div>
								マンドリカルド - スキル2（強化前：攻撃後に戦闘不能 /
								強化後：攻撃ターン終了時に戦闘不能）
							</div>
							<div>概念礼装やスキル効果によるガッツ</div>
						</li>
						<li>
							<div class="flex">
								<div>
									オーダーチェンジ、自爆、退却するサーヴァントを使用する場合、戦闘シミュレーターのパーティ編成時には使用しないサーヴァントも編成しておくことを推奨します。<span
										class="ms-1 cursor-pointer text-gray-700 transition-colors dark:text-gray-300"
										onclick={() => (isModal = true)}
									>
										詳細
									</span>
								</div>
							</div>
						</li>
					</ul>
				{:else}
					⚠️ Disclaimer ⚠️
					<ul class="list-disc pl-5">
						<li>
							English and Japanese translations are generated using AI and may contain unnatural
							phrasing.
						</li>
						<li>
							We are not responsible for any loss of Golden Apples caused by errors, but bug reports
							are highly appreciated.
						</li>
						<li>
							We do not recommend using this for Story quests or quests with special gimmicks.
							Please use it mainly for repeatable Free Quests.
						</li>
						<li>
							<div>Currently unsupported logic (Planned for future updates):</div>
							<div>Angra Mainyu - 3rd Skill (Death 5 turns after use)</div>
							<div>
								Mandricardo - 2nd Skill (Pre-upgrade: Death after attacking / Post-upgrade: Death at
								the end of the attacking turn)
							</div>
							<div>Guts effects granted by Craft Essences (CE) or Skills</div>
						</li>
						<li>
							<div class="flex">
								<div>
									When using Order Change, self-sacrifice, or retreating Servants, we recommend
									filling all empty slots in the battle simulator's party setup, even with unused
									Servants.<span
										class="ms-1 cursor-pointer text-gray-700 transition-colors dark:text-gray-300"
										onclick={() => (isModal = true)}
									>
										Details
									</span>
								</div>
							</div>
						</li>
					</ul>
				{/if}
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
				<h2 class="text-xl font-bold">
					{#if language === 'KR'}
						오더 체인지, 자폭, 후퇴 편성 주의
					{:else if language === 'JP'}
						オーダーチェンジ、自爆、退却編成時の注意
					{:else}
						Caution: Order Change, Sacrifice & Retreat
					{/if}
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
				<div class="flex flex-col gap-1">
					{#if language === 'KR'}
						<div>시뮬레이터 파티 구성시</div>
					{:else if language === 'JP'}
						<div>シミュレーターでのパーティ編成時、</div>
					{:else}
						<div>When setting up your party in the simulator,</div>
					{/if}
					<img src="{base}/images/sample1.png" class="w-150" alt="sample1" />

					{#if language === 'KR'}
						<div>위 와 같은 화면으로 사용하는 서번트 외 자리를 비워두게 되는데</div>
					{:else if language === 'JP'}
						<div>このように使用するサーヴァント以外の枠を空けておくことが多いですが、</div>
					{:else}
						<div>you usually leave the slots for unused Servants empty like this.</div>
					{/if}
					<img src="{base}/images/sample2.png" class="w-150" alt="sample2" />

					{#if language === 'KR'}
						<div>보통 인게임 파티 편성시 코스트가 남으면 아무 서번트나 배치하게 됩니다.</div>
						<div>이를 오더 체인지로 확인해보면</div>
					{:else if language === 'JP'}
						<div>
							実際のゲーム内でコストが余っている場合、適当なサーヴァントを配置することがあります。
						</div>
						<div>これをオーダーチェンジ画面で確認すると、</div>
					{:else}
						<div>
							However, in the actual game, players often fill empty slots with random Servants if
							they have leftover Cost.
						</div>
						<div>If you check this on the Order Change screen,</div>
					{/if}
					<img src="{base}/images/sample3.png" class="w-150" alt="sample3" />
					<img src="{base}/images/sample4.png" class="w-150" alt="sample4" />

					{#if language === 'KR'}
						<div>후열 서번트 배치가 아예 달라지는걸 확인할 수 있습니다.</div>
						<div>
							오더 체인지, 자폭, 후퇴 서번트를 사용 할 경우 전투 시뮬레이터 파티 구성시에 사용하지
							않는 서번트도 편성하는걸 추천드립니다.
						</div>
					{:else if language === 'JP'}
						<div>控えサーヴァントの配置が全く異なっていることがわかります。</div>
						<div>
							オーダーチェンジ、自爆、退却するサーヴァントを使用する場合、戦闘シミュレーターのパーティ編成時にも使用しないサーヴァントを編成しておくことを推奨します。
						</div>
					{:else}
						<div>you will notice that the backline placement is completely different.</div>
						<div>
							When using Order Change, self-sacrifice, or retreating Servants, we highly recommend
							filling the empty slots in the simulator to match your in-game party.
						</div>
					{/if}
				</div>
			</div>

			<div class="mt-4 flex justify-end">
				<button
					class="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
					onclick={() => (isModal = false)}
				>
					{#if language === 'KR'}
						확인
					{:else if language === 'JP'}
						確認
					{:else}
						OK
					{/if}
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
					{#if language === 'KR'}
						사용방법
					{:else if language === 'JP'}
						使い方
					{:else}
						How to use
					{/if}
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
					{#if language === 'KR'}
						<div>1. 이미 등록된 전투 시뮬레이터 가져오기</div>
					{:else if language === 'JP'}
						<div>1. 登録済みの戦闘シミュレーターからURLを取得する</div>
					{:else}
						<div>1. Import an already saved battle simulator</div>
					{/if}

					<img src="{base}/images/manual1.png" class="w-150" alt="sample1" />

					{#if language === 'KR'}
						<div>꼭!! 두번째 링크 클릭해서 URL 복사</div>
					{:else if language === 'JP'}
						<div>必ず！！2番目のリンクをクリックしてURLをコピーしてください</div>
					{:else}
						<div>Make sure to click the SECOND link to copy the URL!</div>
					{/if}

					<br />

					{#if language === 'KR'}
						<div>2. 직접 테스트한 전투 시뮬레이터 등록하고 가져오기</div>
					{:else if language === 'JP'}
						<div>2. 自分でテストした戦闘シミュレーターを保存して読み込む</div>
					{:else}
						<div>2. Save and import a custom battle simulator</div>
					{/if}

					<img src="{base}/images/manual2.png" class="w-150" alt="sample2" />

					{#if language === 'KR'}
						<div>서버가 아닌 기기에 해당 팀에 등록하고 가져오는 방법입니다.</div>
					{:else if language === 'JP'}
						<div>サーバー上ではなく、端末の編成スロットに保存してから読み込む方法です。</div>
					{:else}
						<div>
							This method saves the team setup locally on your device rather than on the server
							before importing.
						</div>
					{/if}
				</div>
			</div>

			<div class="mt-4 flex justify-end">
				<button
					class="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
					onclick={() => (isManual = false)}
				>
					{#if language === 'KR'}
						확인
					{:else if language === 'JP'}
						確認
					{:else}
						OK
					{/if}
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
