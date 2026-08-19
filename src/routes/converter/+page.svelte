<script>
	import { browser, dev } from '$app/environment';
	import pako from 'pako';
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { globalState } from '$lib/globalState.svelte.js';
	import { i18n } from '$lib/i18n.js';
	let t = $derived(i18n[globalState.language] || i18n['KR']);
	import Modal from '$lib/components/modal.svelte';

	let isLoading = $state(false);
	let url = $state('');
	let decodedData = $state(null);
	let fgaCommand = $state('');
	// 턴 구분자(,#,) on/off 상태. index i는 commandSegments[i]와 [i+1] 사이의 구분자.
	let turnSeparatorStates = $state([]);
	let commandSegments = $derived(fgaCommand ? fgaCommand.split(',#,') : []);
	let finalCommand = $derived(
		commandSegments.reduce((acc, seg, i) => {
			if (i === 0) return seg;
			return acc + (turnSeparatorStates[i - 1] ? ',#,' : ',') + seg;
		}, '')
	);
	$effect(() => {
		turnSeparatorStates =
			commandSegments.length > 0 ? new Array(commandSegments.length - 1).fill(true) : [];
	});
	function toggleTurnSeparator(idx) {
		turnSeparatorStates[idx] = !turnSeparatorStates[idx];
	}
	// 턴 구분자 말풍선 표시 여부. 기본값 켜짐, 로컬스토리지에 저장해 다음 방문에도 유지
	let showSeparatorTooltip = $state(true);
	function toggleSeparatorTooltip() {
		showSeparatorTooltip = !showSeparatorTooltip;
		if (browser) {
			localStorage.setItem('converter_show_wave_tooltip', showSeparatorTooltip ? '1' : '0');
		}
	}
	let svtData = $state([]);
	let mcData = $state(null);
	let isError = $state(false);
	let isWarningsModal = $state(false);
	let isManualModal = $state(false);
	let emptySvtList = ['Jeanne', 'Tomoe', 'Meltryllis', 'Mari', 'Tenochtitlan', 'Ereshkigal'];
	let showGuide1 = $state(false);
	let showGuide2 = $state(false);

	const svtSkillMap = [
		['a', 'b', 'c'],
		['d', 'e', 'f'],
		['g', 'h', 'i']
	];
	const masterSkill = ['j', 'k', 'l'];
	$effect(() => {
		if (browser) {
			if (isManualModal || isWarningsModal) {
				document.body.style.overflow = 'hidden';
				document.documentElement.style.overflow = 'hidden';
			} else {
				document.body.style.overflow = '';
				document.documentElement.style.overflow = '';
			}
		}
	});

	// TO DO

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
			// if (!dev) {
			fetch('https://fgo.uenic31.workers.dev/api/count', {
				method: 'POST'
			}).catch((err) => {
				console.warn('카운트 API 호출 실패(무시됨):', err);
			});
			// }
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
						// 앙리마유(1100100) 3스킬 -> 5턴 타이머 부여
						else if (svtInfo.svtId === 1100100 && action.skill === 2) {
							svtInfo.deathTimer = 5;
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

				// 턴 종료시(attack 후) 전열 서번트들의 deathTimer -1
				frontSvtList.forEach((svt, idx) => {
					if (svt && svt.deathTimer !== undefined) {
						svt.deathTimer -= 1;
						if (svt.deathTimer <= 0) {
							delayedActions.push({ type: 'death', svtIdx: idx });
							delete svt.deathTimer;
						}
					}
				});

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
		const savedShowTooltip = localStorage.getItem('converter_show_wave_tooltip');
		if (savedShowTooltip !== null) {
			showSeparatorTooltip = savedShowTooltip === '1';
		}
		if (dev) {
			url =
				// 'https://link.chaldea.center/laplace/share?data=GH4sIADQdE2oA_91XzWojRxB-lz5XoH_nR7dIu8safIqcUzBLr6YtNZ4_z_QIhBEkh1yWvEIgh0BeIIe8U7zvkOqe0Uhe_8Cy60kIsjXuorqqvu-rKsm3pLDlvLN5RmapEEB0XR-OSQrkpjOtI7NbYr1FMhFzyoHUG90aMmNATGmK3VvdbsiMsHdUUvVOXmVZLGOyB1LVzlZl6wMUdr1xu8VG25LMXNMZIJlt9fvcvN6aEnNc6bxFY13Z0s27qyu8VXZ5DqS1RZdrZ761o1PI-h3avq97L8zljC58olIXWBq5--PHv3_76e7XPz_-_Mvdh98_fviLACl2rbOrRZWZUNJ4OkN0kgLJzdbkZBb50ss31uTZcuuwkB9uSbt13iuiklPvaQvrFlXnK8dje23z_CzzrilVSlFIadQ_YnxcDh7nW-_BKIQftLpsDMr86XwbWM3xkWJY7a7fVB2aqM-5qU8OK3PuS5g3Rl-PvKBxG-oxN52t2UG4nsf8ob_PQxFs29V11biLXe2pK6vSoHojZk5F-ilmeQ9zlCqhGERpwBylcfQAM-BrBBwijoBVX0jy3wEsKE2fV5mLJPFY8ZlKhM4RkHxGaJwrU2a9mUL_OumAPuPICO8rZfSEEn5KCR8oOQtjiWymDxjqZ6wnKAS6T9F4K39wZ0j9OE0YUjfZ0jWmXLuNKY-AFA2_iGlVFYUus36yvEPQ4_iWSEojnDf_VDzcyHXbziuM_Eo77WtcNxhhXpXZa1_20pOKy6Ncm6P2453lTacb07cZBwESFEQQQwJpEABbjwMTwCQwBSwCFgNLgKXAUUG8w1E_4BK4Ah4Bj4EnwFMQFAQDgSEFCAlCgYhAxCASECkgAMlAcpCYUYJUICOQMcgEZIpMALaF4qAEKCxIgYpAxaASUClEOCU4LxyhB6CLR7AcaFk67azfVMG436P9vV5dd_Wwm-6Te4myZSY3a9yOyCOe9GpYwrjFXK9k6FGUEvs9NFt_9i1-srHrXO9Mc6Gbtem9wtY9nNHXF14VflPhwW2w6k3lPzn8vO79OD2fjb1wthfFpJ1DDQgMf4yfESGIn5CAz7YXr4792lgUUedHA7r1oyW8qBNSzyfIRidtKzpZW93PNgWTbFIm2aRMssmYnE6v_9lCfXrV8cOqE0-uuuFbyLjp-PA16-TyN-OiHJyf3pOP3JafkfpzliyfdMmyryrHlzH6RWK-lBz_IkFftcxLn3iB6S7Cv6sh3f4fEaSFoYYPAAA%3D&questId=94137202&phase=1&enemyHash=1_0405_4fdd747';
				'https://link.chaldea.center/laplace/share?data=GH4sIAGlehWoA_91X227bOBD9Fz5PAV4l0W-122ID5GmdfVoEBWsxNhHdIlEGjMD_vkNKlp3mAhRt1GLhxAoHw5k558yMnUdSumrZuyInCy0EENM0p2OmgTz0tvNk8UhcsEgmUk45kGZnOksWDIitbHn4y3Q7siDsK5VUfZV3eZ7KlByB1I13ddWFAKXb7vxhtTOuIgvf9hZI7jrzrbCf97bCHHem6NDY1K7yy_7uDm9VfVEA6VzZF8bbj25yiln_Rts_zeCFubw1ZUhUmdKerpaHzrvNqs5tLGE6XSEaSYEUdm8LskhCqdUXZ4t8vfeY-N9H0u198Eqo5DR4utL5Vd2HSvHY3buiuMqDq6ZKKQqaJsMjxcft6HG9Dx6MQvxBq8-noCycrveRxQIfGsMaf_-l7tFEQ85dc3HY2OtQwrK15n7iAY37WI996F3DTkIN4Ivn_iEPRbBd3zR1628ODRJDqrqyqNaEmVOhv8csn2BOtBKKQaIj5kSnyTPMgK8JcIw4AVZDIdmfA1hQqt9WmYssC1jxqSVC5whIviE0zpGt8sFMYXhddMCQcWKED5UyekEJv6SEj5RcxTFENvUzhoaZGgiKgZ5SNN0qnt0ZU79ME4Y0bb72ra22fmerMyBF4y9i2tRlaap8mKzgEPU4v2WS0gTnLTwVjzcK03XLGiN_Mt6EGrctRljWVf45lL0OpOKyqLb2rP10Z_3Qm9YObcZBgAQFCaSQgY4CYOtxYAKYBKaAJcBSYBkwDRwVxDsc9QMugSvgCfAUeAZcg6AgGAgMKUBIEApEAiIFkYHQgAAkA8lBYkYJUoFMQKYgM5AamQBsC8VBCVBYkAKVgEpBZaA0JDglOC8coUegqxewnGhZe-Nd2FTReDyi_ZvZ3PfNuJueknuLsuW2sFvchsgjnsxmXLq4xfygZOxRlBL7PTbbcA4tfrGhm8IcbHtj2q0dvOKWPZ3RNxRel2FT4cHvsOpdHT4pwrwewzi9nY29c7Z3xWS8Rw0IjH9MnxExSJiQiM91N5_O_do6FNEUZwO6DaMlgqgzUs9nyEZnbSs6W1s9zTYHk2xWJtmsTLLZmJxPr__ZQn191fHTqhOvrrrxW8i06fj4Nevi8odpUY7Or-_JF27LH0j9I0uWz7pk2S-V4-cY_Skx30uO30jQLy3zNiReYbqb-O9pTHf8D5nLat12DwAA&questId=94137202&phase=1&enemyHash=1_0405_4fdd747';
			// fncConvertBtn();
		}
	});
</script>

<svelte:head>
	<title>페그오 컨버터 (FGO Converter)</title>
	<meta
		name="description"
		content="칼데아앱(Chaldea)의 공유 URL을 폰닉(FGA)용 커맨드로 변환합니다."
	/>
	<meta name="keywords" content="페그오 컨버터, FGO Converter, 칼데아, FGA, 폰닉, 변환기" />

	<meta property="og:title" content="페그오 컨버터 (FGO Converter)" />
	<meta
		property="og:description"
		content="칼데아앱(Chaldea)의 공유 URL을 폰닉(FGA)용 커맨드로 변환합니다."
	/>
	<meta property="og:url" content="https://unic31.github.io/fgo-converter/" />

	<meta property="og:type" content="website" />
	<meta
		property="og:image"
		content="https://unic31.github.io/fgo-converter/images/etc/nunnos.png"
	/>
</svelte:head>

<div class="grid w-full grid-cols-[1fr_auto] grid-rows-[1fr_auto] gap-x-3 gap-y-2">
	<h1 class="col-start-1 row-start-1 flex">
		<span class="my-font self-end text-3xl leading-none">FGO Converter</span>
	</h1>

	<div class="col-span-2 row-start-2 self-start md:col-span-1 md:col-start-1">
		<span class="my-desc-font">{t.desc}</span>
		<button class="my-btn" onclick={() => (isManualModal = !isManualModal)}>
			{t.howtouse}
		</button>
	</div>

	<div
		class="col-start-2 row-start-1 max-h-30 min-h-20 max-w-30 min-w-20 cursor-pointer self-end transition-transform hover:scale-105 active:scale-90 md:row-span-2 md:self-end"
		onclick={() => globalState.toggleDarkMode()}
	>
		<img
			src="{base}/images/etc/bansi1_no_bg.png"
			alt="Bansi Light Mode"
			class="block h-full w-full object-contain dark:hidden"
		/>

		<img
			src="{base}/images/etc/bansi3_no_bg.png"
			alt="Bansi Dark Mode"
			class="hidden h-full w-full object-contain dark:block"
		/>
	</div>
</div>

<div class="my-div flex w-full items-center gap-2 focus-within:ring-2 focus-within:ring-blue-500">
	<input
		type="text"
		bind:value={url}
		placeholder="https://link.chaldea.center/laplace/share?data=..."
		class="my-desc-font flex-1 outline-none dark:placeholder-gray-400"
	/>

	<button type="button" onclick={() => (url = '')} class="my-desc-font" aria-label="Clear url">
		<svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
	</button>
</div>
<button
	onclick={fncConvertBtn}
	class="w-full cursor-pointer rounded-lg bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700 active:bg-blue-900 dark:bg-blue-500 dark:hover:bg-blue-600"
>
	{isLoading ? t.loading1 : t.loading2}
</button>

{#if isError}
	<div class="rounded-lg bg-red-200 p-3 text-red-600 dark:bg-red-900/30 dark:text-red-400">
		{t.error1}
	</div>
{/if}
<div class="custom-scrollbar flex w-full gap-2 overflow-x-auto pb-2">
	<div class="my-svt-div">
		{#if svtData.length === 0 && !mcData}
			<img
				src="{base}/images/etc/bansi_mystic_code.png"
				alt="bansi_mystic_code"
				class="h-full w-full rounded-lg object-cover"
			/>
		{:else if svtData.length > 0 && !mcData}
			<div
				class="flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-lg text-gray-300 dark:border-gray-600 dark:text-gray-500"
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
			<div class="my-svt-div">
				<img
					src="{base}/images/etc/{svtName}.png"
					alt={svtName}
					class="h-full w-full rounded-lg object-cover"
				/>
			</div>
		{/each}
	{:else}
		{#each svtData as item, idx (idx)}
			<div class="my-svt-div">
				{#if item && item.details}
					<!-- 서번트 -->
					<div class="mb-2 flex-1 overflow-hidden rounded-lg bg-white dark:bg-gray-800">
						<img
							src={item.svtImg || `${base}/images/etc/nunnos.png`}
							alt={item.details.name}
							onclick={() => console.log('svtData :', $state.snapshot(item))}
							class="h-full w-full object-cover transition-opacity hover:opacity-80"
						/>
					</div>
					<!-- 예장 -->
					{#if item.ceDetails}
						<div class="relative h-[28%] w-full shrink-0">
							<img
								src={item.ceDetails.extraAssets?.equipFace?.equip?.[item.ceDetails.id]}
								alt={item.ceDetails.name}
								class="h-full w-full rounded object-cover"
							/>
							{#if item.equip1?.limitBreak}
								<div
									class="absolute -right-1 -bottom-1 h-5 w-5 rounded-full border-2 border-white bg-yellow-400 text-center text-[15px] leading-3.75 text-white dark:border-gray-700"
								>
									★
								</div>
							{/if}
						</div>
					{:else}
						<div
							class="flex h-[28%] w-full shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-lg text-gray-300 dark:border-gray-600 dark:text-gray-500"
						>
							Empty
						</div>
					{/if}
				{:else}
					<div
						class="mb-2 flex w-full flex-1 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-lg text-gray-300 dark:border-gray-600 dark:text-gray-500"
					>
						Empty
					</div>
					<div
						class="flex h-[28%] w-full shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-lg text-gray-300 dark:border-gray-600 dark:text-gray-500"
					>
						Empty
					</div>
				{/if}
			</div>
		{/each}
	{/if}
</div>

<div class="my-div">
	<div class="mb-2 flex items-center gap-2">
		<h2 class="text-lg font-bold text-gray-900 dark:text-gray-100">
			{t.commandText}
		</h2>
		<button
			type="button"
			class="rounded border px-2 py-0.5 text-xs transition-colors {showSeparatorTooltip
				? 'border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-600 dark:bg-blue-900/40 dark:text-blue-300'
				: 'border-gray-300 bg-gray-100 text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400'}"
			onclick={toggleSeparatorTooltip}
		>
			💬 {showSeparatorTooltip ? '웨이브 안내 켜짐' : '웨이브 안내 꺼짐'}
		</button>
	</div>
	<div
		class="flex cursor-pointer items-center rounded border border-gray-200 bg-white p-3 font-mono break-all text-gray-900 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
	>
		<div class="flex flex-1 flex-wrap items-center {showSeparatorTooltip ? 'gap-y-8 py-8' : ''}">
			{#each commandSegments as segment, i (i)}
				<span>{segment}</span>
				{#if i < commandSegments.length - 1}
					<span
						class="relative mx-0.5 inline-block cursor-pointer rounded px-1 select-none {turnSeparatorStates[
							i
						]
							? 'bg-blue-200 text-blue-900 dark:bg-blue-700 dark:text-blue-100'
							: 'bg-red-200 text-red-900 dark:bg-red-700 dark:text-red-100'}"
						onclick={(e) => {
							e.stopPropagation();
							toggleTurnSeparator(i);
						}}
					>
						{turnSeparatorStates[i] ? ',#,' : ','}
						{#if showSeparatorTooltip}
							<span
								class="absolute left-1/2 -translate-x-1/2 rounded px-2 py-1 text-xs whitespace-nowrap text-white {i %
									2 ===
								0
									? 'bottom-full mb-1.5'
									: 'top-full mt-1.5'} {turnSeparatorStates[i]
									? 'bg-blue-600 dark:bg-blue-500'
									: 'bg-red-600 dark:bg-red-500'}"
								onclick={(e) => {
									e.stopPropagation();
									toggleTurnSeparator(i);
								}}
							>
								{turnSeparatorStates[i] ? '다음 웨이브' : '동일 웨이브 다음턴'}
								<span
									class="absolute left-1/2 -translate-x-1/2 border-4 border-transparent {i % 2 === 0
										? 'top-full'
										: 'bottom-full'} {turnSeparatorStates[i]
										? i % 2 === 0
											? 'border-t-blue-600 dark:border-t-blue-500'
											: 'border-b-blue-600 dark:border-b-blue-500'
										: i % 2 === 0
											? 'border-t-red-600 dark:border-t-red-500'
											: 'border-b-red-600 dark:border-b-red-500'}"
								></span>
							</span>
						{/if}
					</span>
				{/if}
			{/each}
		</div>
		<button
			class="my-btn ms-3"
			onclick={() => {
				navigator.clipboard.writeText(finalCommand);
				alert(t.clipboardAlert);
			}}
		>
			{t.copy}
		</button>
	</div>
</div>
{#if dev}
	<div
		class="flex flex-col gap-2 rounded-xl border border-blue-200 bg-blue-50/30 p-3 transition-colors dark:border-gray-600 dark:bg-gray-700/50"
	>
		<div class="flex items-end justify-between">
			<h2 class="mb-2 text-lg font-bold text-gray-900 dark:text-gray-100">
				커맨드를 기반으로 작성된 시뮬레이터 화면
			</h2>
		</div>
		<div
			class="flex cursor-pointer items-center rounded border border-gray-200 bg-white p-3 font-mono break-all text-gray-900 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
		></div>
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
		<li>{t.warnings1}</li>
		<li>
			<div>{t.unsupportedTitle}</div>
			{#each t.unsupportedList as item, idx (idx)}
				<div>{item}</div>
			{/each}
		</li>

		<li>
			<span>{t.orderChangeWarning}</span>
			<button class="my-btn" onclick={() => (isWarningsModal = true)}>
				{t.detailsBtn}
			</button>
		</li>
	</ul>
</div>
<Modal bind:isModal={isWarningsModal} header={t.warningTitle}>
	<img src="{base}/images/manual0.png" alt="svt" />
</Modal>
<Modal bind:isModal={isManualModal} header={t.howtouse}>
	<div class="flex flex-col gap-2">
		<button
			class="w-full cursor-pointer rounded bg-gray-100 p-2 text-left font-bold dark:bg-gray-800"
			onclick={() => (showGuide1 = !showGuide1)}
		>
			{t.converterGuide.guide1}
			{showGuide1 ? '▲' : '▼'}
		</button>

		{#if showGuide1}
			<div class="flex flex-col gap-1 rounded border border-gray-200 p-2 dark:border-gray-700">
				<div>{t.converterGuide.g1}</div>
				<img src="{base}/images/manual1.png" class="w-full" alt="sample1" />
				<div>{t.converterGuide.g2}</div>
				<br />
				<div>{t.converterGuide.g3}</div>
				<img src="{base}/images/manual2.png" class="w-full" alt="sample2" />
				<div>{t.converterGuide.g4}</div>
			</div>
		{/if}

		<button
			class="w-full cursor-pointer rounded bg-gray-100 p-2 text-left font-bold dark:bg-gray-800"
			onclick={() => (showGuide2 = !showGuide2)}
		>
			{t.converterGuide.guide2}
			{showGuide2 ? '▲' : '▼'}
		</button>

		{#if showGuide2}
			<div class="flex flex-col gap-1 rounded border border-gray-200 p-2 dark:border-gray-700">
				<img src="{base}/images/manual5.png" class="w-full" alt="sample3" />
				<img src="{base}/images/manual6.png" class="w-full" alt="sample4" />
			</div>
		{/if}
	</div>
</Modal>
