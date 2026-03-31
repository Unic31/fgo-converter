<script>
	import pako from 'pako';
	import { onMount } from 'svelte';

	let isLoading = $state(false);
	// sample
	let url = $state(
		'https://link.chaldea.center/laplace/share?data=GH4sIAE0gy2kA_9WWTYvbMBCG_4vOKkiO7Ti5NWmXLuTUpqcSFq2txCKyrLVlQwj5752RHW_Ykq-yhS0E5BGjmXcejaTsSaHMrFE6I9PJaESJsPZoJgklL42sHZnuicKZkMEk45TYXNSSTOFLGlnsvok6J1PCn1jC2FMSpixNOTlQUlqnSlNjgEJtcreb50IZMnVVIynJVC2etfzaSgM51kLXMGlLZdysWa9hlWm0pqRWRaOFk5_V4OSzfoe5n7bzglxOigITGVHI49JiVzuVzstMegmD9QjVBJxRomUrNRTCUKx5UFJnP1oHqX_tSd069BuzkDF0VYVy87JBrSGo2iqtHzN0TcaTMGJ0HAcjGIBQFLFV77Fo0QNS-R_MumwIytFatJ6jhmECWYTbPpQNKsKcuT0xUi8bNoGNQm8uUNGskmJ7JApzGC4CQi-Nsvxk57pF-o8l2i-A8uvG2rJyy50FWGRdKWkyQsmmEgaZ9OwPdAATMD66AiaKAQifAA8ajILrWHzI4Igl6tTFHwiLKY28COX_6Jb-GPVcbsLSL_FcbsUCBTyLdNvYt2eKc8ajy5gCPu76hntCOPLrpLrAd6M6y4a9ZdPdK2fAsPv7BQSzyWUScRIjgDgZh34A8wYMEPXjY8AwK_DOpJYbuM4hPFgi7V8NaBjXBRDOQSMR2n8MzeRrS0UFkj7Bl6qXX4ZDXym47YV-LQXcOj0BdubJ22S12MlqKaqNdK-v2tGG4lF3WSBBMFxeyTov8Y1EcAfczasy2bvLZH8v07cOqPTKgr6VfISz2YJ_ASV4dyh3y1xh4jmkW_q_D11f_gblDkuTFgkAAA%3D%3D&questId=94098801&phase=1&enemyHash=1_0800_84c0cc1'
		// 'https://link.chaldea.center/laplace/share?data=GH4sIAFqAymkA_-2W3WvbMBDA_xc9ayD5I3HytmQrC3QvW_ZUQlHtSywi26oth4XS_313suOZlPWLrWwwCMgn7vOnOyl3rNDlotUmY_NZGHKmrD2JScLZbQuNY_M7pmknErgpJGc2Vw2wOX5BCcXxk2pyNmfyWiRCXCdRKtJUsnvOKut0VTbkoNC73B2XudIlm7u6Bc4y3agbAx8PUGKMrTINbtpKl27RbrdoVbbGcNboojXKwXs9KPmoX3Dvm-20MJYDVVCgUhVwMi2OjdPpssrApzBIK6wmkIIzAwcwWIigZMsLDSb7enAY-uqONQdHelMRCUGqutBuWbWUa4RZ7bUxq4xUk-ksigWfToIQFyQUx2LTa1weSAND-R_uumxwKkm6PHiOBpcZRlFuf1G1lBHFzO1ISH3aeAgijLx4SRktalD7E1HcI3cxErpttZWjk-uMzAMT4w2w_Ka1tqrd-mgRFiurEhhnu1qVRKQnf88HLBKTmj3OZZJMkASfJNPILyg-xaXz-k-D-d8vIyxYwI1K9609n6oAbwr5OKaZCLBh-EyE3RI93T6d1xdzGoPpb5iOjDgH010r5qE-xRHPbhbvZjxKcvI4iyCIQ-oZXKMgDmiN4-dMEzo-x5H8bTg2qJiBgR1e6OS5BmtUCp-huIF6VWbwHai8Kyx_Q7oq7V8VbCfXefYUWE_DJzp6etDbEeq1qnfguiLo-RjJlE9VUKOg4PIamryiJ5CA3NNo91GUc9jMjPcfQ0N7J6mq0eQdQtbN-sMwYbXGN0eZnyRRrcMR0HT8iTTPYARvDUO-AoZ8IxjyrWEEr-oMfm4tTsYn5V9bh4P10JXyJda_9SA2FHmJ4db-71k38D8AHWkqN3YKAAA%3D&questId=94098801&phase=1&enemyHash=1_0800_84c0cc1'
		// 'https://link.chaldea.center/laplace/share?data=GH4sIABp3ymkA_9WW227bMAyG30XXGiD5EDu-W7MVK9CrLbsagkKJlViILLuWbCAo-u4j5cNadM3WJu0wJIgtieRPf6Tk3JFSmYtW6Zxk8zCkRNT1OEw4JbettI5kd0ThTMTmacrmlNSFsJJkYCCNLA9fhC1IRvgNi0N2k4TbZJuvyT0lVe1UZSwGKNWucIdFIZQhmWtaSUmurFhr-bmTBjS2QluYrCtl3EW73YKXabWmxKqy1cLJj2oy8qpfYe573VuBlpOiRCEjSjm6lgfr1GZR5dKnMI2u4Gl4wCjRspMa7hkmay6V1Pm3zoH0jztiO4d2EYsChqaqVG5RtZhrBFntldZXOZqm6TyOGU3nLPIXPovZarC47tCCM-q_Kw9Ymryf9rP-Awsun9Q4jq47ksUgC5cU5IXbX1YtporJFPWDwcY_D1QngRRweI2pXjRS7CdiMNn1BbttVc0flLR30k9dUJkDF9vWddW45aEGisRURhJKdo0wiGqwvqcPeIXsOK84jDmN0hlCi9IkPoUWaAX_M60Ye-YorWTGsa2SWRD7S3hCd3m1qbt4n_X8BF79Rh5wxX_Fq3fxuOInvLaNgvx_QwweYS02-7Yetqff39PPCgLlUssdHAkgDiOxGU4e2Miuj-2JQWiLUYOBIMnYo2Oq1uIgm6VodtL5NX_UjGMghnlVJVKDRVc00hYVHpcI6x4Le1yNv6ta8A5q_B-pvVHdhHPQZ4QON9OrwAfdiAZcPkA4ZZefpvZvFLxXhP51fIBZ39AcG_fNobBXtRc7B5TgVVDoSUhHbz56h6PzaPy8d_CigrCTu_RYQfgZyv_nvXA-leBtVJ5vLn72HffiNFcovAC5pf972b-MfgLkfmgDNgsAAA%3D%3D&questId=94098809&phase=1&enemyHash=1_0530_73f7fdb'
		// 'https://link.chaldea.center/laplace/share?data=GH4sIAM4jymkA_81XbW_aMBD-L_6cSXZeCd9WtmqVui8b-1ShyZArsXCcNHGioar_fWfnpVS0GdCCJhDOOXd-7p57SXgkmVBXtZAJmcae5xBeFL0YMYc81FBpMn0kwuz4NJ5MGHVIkfIKyBQVQEG2_carlEwJ-01Dz_8dMuaFyyV5ckheaJGryhyQiXWqt7OUC0WmuqzBIYmo-FLC1wYUYtxzWeFmkQulr-r7e7RStZQOqURWS67hsxiULOoP3PtVtFqIpYFnBkjxDHrTbFtpsZrlCVgXBukGo3FNIBIakBgINc6qawEy-dlohL57JFWjrV5AKaNGV2RCz_LaOOujWxsh5U1idKM4DgLq-F7o2yUKArboNG4bo4FY9ruwDINK2m27az94QyfPcMyItw2KiNsYB9EBrjfXeW0FlNJiR1jZkDBBXhxb8dY4e1UC3_Rs415_EDzUomA7aW2t5J5NB43kVHVR5KWebwukkqhcAXHIuuTK8NXl5ckZSAupH41z5rIoNKThihd2naB8Km0WcJQ1d4S1aLLPWldqHW2vkNYayX0TC308ZwHF6hmvs5CZAotCN7CLF55OmEUbCGOt1_GBVfYaXy-qLDiIr50iCw7lCwNY8tWmLvb6dPLPPo2pa0otpl67-GP8de04edGOh_L0ZiHtdV87qN6oosM7zx5jfhZokoCENU5Hg1FCIfkKvkO2hPJGJfAHTKB3LtaC0eWrbkQjk7rFsHwgSGXOpx0_9mpnnuOpWyjnvFxDq2Vnci8jT8bDPDNc4U2dllCluXmuGIqeTNmPo7ELoLEBzb0o2iWYdA9CYx-Oxi6K5p4HjWuNM4Y43cUwZyzgipdo8gmPE9X8yzD4SoEvF1w-9zuqtU3LuiFvXXiH9YDt98a98mDdnTYYu2ZenjUfx-eBvrt_2AXQTusf-hE1dlqVLC5KyrlTcPygpGcdJvT_SXQ_DugJ1uPz4OggFwZ4hnBz--erfRf5C6A3qhVUDgAA&questId=94098810&phase=1&enemyHash=1_0634_61136bb'
		// 'https://link.chaldea.center/laplace/share?data=GH4sIAO4RymkA_82X32-bMBDH_xc_M8kGTH68rdmqVepetuypiionuMGKMRRMtKjq_747m5Ko1UiTdqxKFGNzvu_dh7NNHkiuzEWjdEqmkygKiCjLp-4IuveNrC2ZPhCFIzGdjMeMBqTMRC3JlAVEGpnvvok6I1PCbmkSxbcJY1GyXJLHgBSlVYWp0UGu1pndzTKhDJnaqpEBSVUtllp-3UoDGndC1zBYFsrYi-buDmaZRuuA1CpvtLDys-qMnOoPGPtVeivQslLkKGRELp-m5rvaqtWsSKULoetdQTYhJqLlVmpIhGKw5lJJnf7cWpC-eSD11qJdQuMRRVOVKzsrGow1hqg2SuurFE1DNko4pwG0cOHaMfQXrdH1Fo1AzX0XjrE0qR92o-4DN2zaCTLsXW8dYw3NBCIQdnNZNBgtxpOVB52VSwke0Gg8cd1rjPaikmLzRBvG0B0HeveNKtnBU_WT9Isp2k0ANHVTlkVl57sSQBJTGEkCsq6EQVrtU3kMOmQYU9jPLOIh5yxgHH8jHgHAc3l5tQ5YeBowGo_7gaH1C2J-1l-IUXo6Mk5j3k9slDAwCUZJyF0DyM4uMad2com9vqb86ntrQUG4S7HaNOXzJRmOKWX9tCY0xKU4oZFv4j5aHor3-iYq7fbksdDjVFp71Hl9zTg3-7UGISdH9qeQR1g60MYhD7Hl_CgO7_g5jvFHw7EAw1RquYbTAD1XstRiJb_LfCmrK5PK3xLTu4G0F2grVu2RBOVkvWdHAVzX6DVsqbiAD84v8LqT1VxUa2n3J99BH-MqciwYmGizStZZodvt6RFXer8aG1Qt7FGj76A2jMpHJfj-akPUIh00NzpobmzQKmGD5fZPVYS1cPySoL3ojmDnZCUqmPIJrlQ9_9K9EFQKXrGF3u_9YOY38AjP8wHRn1LE9D2g0DOgsJOg0DevNTaA2nm7Fh10_6eD7v__sbyCwVbs0SQXKDwDubn7p-5f3_4AC4maL4EQAAA%3D&questId=94098810&phase=1&enemyHash=1_0634_61136bb'
		// 'https://link.chaldea.center/laplace/share?data=GH4sIANpNyWkA_9VXUW_aMBD-L37OJDsECLytbNWQ2MvGnipUuclBLBwnjR00VPW_784JFJVC2dRGnYRwztx3392X8yU8sFyZq1rplI1HvV7AZFnuzDgO2H0N1rHxA1O0E3Hc5CJgZSYtsDFegYF8-03ajI2ZuOUx57dxlPAkEewxYEXpVGEsBcjVKnPbSSaVYWNX1RCwVFl5p-HrBgxyLKW2uFkWyrirerlElKm1DphVea2lg89q7-RZf-Der7LxQi4HMiciI3PYQfOtdSqZFCn4FPbWFKsJBQ-Yhg1oLIRTsuZagU5_bhxS3zwwu3HkN-QR5-SqcuUmRU25RpjVWmk9Tck1Ho6iPg-Gg7CHCyrU7_NF6zHbkAdS-Q_uunQfVJA123gdNS4jZJFufV3UlBFxZuWBkfi08SbwXuTNGWV0VYFc7xTFPQrXR4Xua1WKgzvXgPQRRHsAlm_rsiwqN9-WKBZbVgpMygK2qqQhTVrtH4P_TJi2Y1plLhKmhXhljoQxhYGzsghManRel0E8QCWCQTyM_ILma7o0UT9yx5wQBiu4k8m6Lp-fK6xI9M_rFIrhiIQKhW8dWkX_Eqkw8F9LdbJp-HNtmtlyomP4xR3jw9DXAiEpaFjhQCMOlxISR6VZga8QS6ug1DKB75DfQTU1Kfz2P92IgC8IL5N20qLAruH1GiGxJU7eauavDsYyRt1CNZfVCtArbEfrzkZfyrrIST80XFaBzQp6PJBsj9T259lEp2xhB2xhp0qKi9jEm7OJTtnC92GTzuHoYUF7sR8_Pkgiq9QPHGXnX56OfKXwHUHqpw10aw5y2A75A3R4OVocoz-JHbydxee4F11LJF4vsk37hRr3YH4xuHcM_ggCnTj7Yads730au6npXefY6UYO_6GdxNu204KIJ0g3939SmheAP2JGBAd8DQAA&questId=94098801&phase=1&enemyHash=1_0800_84c0cc1'
	);
	let decodedData = $state(null);
	let fgaCommand = $state('');
	let teamData = $state([]);
	let mcData = $state(null);
	let isError = $state(false);
	let isDarkMode = $state(false);

	// 해아할거
	// 몹 타겟 변경
	// 특수 스킬, 보구 서번트들 예외사항 추가
	// 예장이나 스킬 효과로 서번트가 거츠 보유중이면 자폭 보구로 안죽게 변경
	// 커맨드 제일 마지묵 ,#, 제거

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
		console.log(actions.length);
		if (actions.length <= 0) {
			alert('등록된 전투 데이터가 없습니다.');
			return '';
		}
		let command = '';

		// 스킬 지연 발동 배열
		let delayedActions = [];
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

		// 아라쉬, 진궁, 하베트롯 등 죽음으로 인한 서번트 교체
		const svtDeath = (deadSvtIdx) => {
			// 후열 가장 먼저 대기 중인(null이 아닌) 서번트를 찾음
			const nextIdx = backSvtList.findIndex((b) => b !== null && b !== undefined);

			if (nextIdx !== -1) {
				// 죽은 서번트 자리 데이터를 후열 서번트 데이터로 교체
				frontSvtList[deadSvtIdx] = backSvtList[nextIdx];
				backSvtList[nextIdx] = null; // 해당 후열 서번트는 필드로 나갔으므로 일단 비움

				// 빈자리를 없애고 대기열 서번트들을 앞으로 당김
				let newBackList = backSvtList.filter((b) => b !== null);

				// 배열 길이를 다시 3으로 맞춤 (빈 자리는 null)
				while (newBackList.length < 3) {
					newBackList.push(null);
				}
				backSvtList = newBackList;
			} else {
				// 후열에 대기중인 서번트가 없으면 전열 빈자리 그대로 둠
				frontSvtList[deadSvtIdx] = null;
			}
		};

		// 미스트레인, 수영복 클로에 등 후퇴로 인한 서번트 교체
		const svtRetreat = (retreatSvtIdx) => {
			// 후퇴할 서번트 저장
			const retreatingSvt = frontSvtList[retreatSvtIdx];

			// 후열 가장 먼저 대기 중인(null이 아닌) 서번트를 찾음
			const nextIdx = backSvtList.findIndex((b) => b !== null && b !== undefined);
			if (nextIdx !== -1) {
				// 대기열 첫 번째 서번트를 빈 전열 자리로 이동
				frontSvtList[retreatSvtIdx] = backSvtList[nextIdx];
				backSvtList[nextIdx] = null; // 나간 자리는 일단 비움

				// 남은 서번트들을 앞으로 당기고(null 제거), 후퇴한 서번트를 맨 뒤에 넣음
				let newBackList = backSvtList.filter((b) => b !== null);
				newBackList.push(retreatingSvt);

				// 배열 길이를 다시 3으로 맞춤 (빈 자리는 null)
				while (newBackList.length < 3) {
					newBackList.push(null);
				}
				backSvtList = newBackList;
			} else {
				// 후열 없으면 위치 교체 없음
			}
		};
		actions.forEach((action) => {
			let isOrderChange = false;
			let isMCTargeting = false;
			let isTargeting = false;
			if (action.type === 'skill') {
				if (action.svt === undefined && mcData) {
					const skillData = mcData.skills[action.skill];
					// 오더체인지
					isOrderChange = skillData.functions.some((f) => f.funcType === 'replaceMember');
					// 타겟있는스킬
					isMCTargeting = skillData.functions.some((f) => f.funcTargetType === 'ptOne');

					if (isOrderChange && swaps.length > 0) {
						const swap = swaps.shift();
						command += `x${swap[0] + 1}${swap[1] + 1}`;
						const fieldIdx = swap[0];
						const backupIdx = swap[1];
						const temp = frontSvtList[fieldIdx];
						frontSvtList[fieldIdx] = backSvtList[backupIdx];
						backSvtList[backupIdx] = temp;
					} else {
						command += masterSkill[action.skill];
						if (isMCTargeting && action.options?.playerTarget !== undefined) {
							command += action.options.playerTarget + 1;
						}
					}
				} else {
					const svtInfo = frontSvtList[action.svt];

					if (svtInfo?.details?.skills) {
						const skillSlot = action.skill + 1;
						// n번째 스킬의 강화 스킬 리스트
						const slotSkills = svtInfo.details.skills.filter((s) => s.num === skillSlot);
						// 가장 최신(마지막) 적용
						const latestSkill = slotSkills[slotSkills.length - 1];

						isTargeting = latestSkill.functions.some((f) => f.funcTargetType === 'ptOne');

						// 하베트롯(404200) 3스킬 -> 턴 종료 시 자폭
						if (svtInfo.id === 404200 && action.skill === 2) {
							delayedActions.push({ type: 'death', svtIdx: action.svt });
						}

						// 수영복 클로에(1101600) 2스킬 -> 턴 종료 시 후퇴
						if (svtInfo.id === 1101600 && action.skill === 1) {
							delayedActions.push({ type: 'retreat', svtIdx: action.svt });
						}
					}

					command += svtSkillMap[action.svt][action.skill];
					if (isTargeting && action.options?.playerTarget !== undefined) {
						command += action.options.playerTarget + 1;
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
						const currentNP = svtInfo.details.noblePhantasms.find((np) => np.id === svtInfo.tdId);

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

			<img
				src={isDarkMode ? '/images/bansi3_no_bg.png' : '/images/bansi1_no_bg.png'}
				alt="Theme Toggle"
				class="h-30 w-30 cursor-pointer transition-transform hover:scale-105 active:scale-95"
				onclick={toggleBansi}
			/>
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
			{isLoading ? '데이터를 불러오는 중...' : '변환하기'}
		</button>

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
