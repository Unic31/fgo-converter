export const i18n = {
	KR: {
		desc: '칼데아앱(Chaldea)의 공유 URL을 폰닉(FGA)용 커맨드로 변환합니다.',
		btnDesc: '사용방법',
		loading1: '아틀라스원과 통신 중...',
		loading2: '변환하기',
		errorText: '⚠️ 올바른 링크인지 확인해주세요.',
		commandText: '변환된 커맨드',
		clipboardAlert: '클립보드에 저장되었습니다!',
		warningTitle: '⚠️ 주의사항 ⚠️',
		warnings: [
			'영어와 일본어는 AI를 사용하여 번역되었으며 어색하거나 부자연스러운 표현이 있을 수 있습니다.',
			'오류로 인한 사과 손실은 책임지지 않지만 제보는 감사합니다.',
			'반복 프리 퀘스트 외 특수 기믹이 있는 퀘스트나 스토리에 사용을 권장하지 않습니다.'
		],
		unsupportedTitle: '현재 계산하지 않는 로직(추후 업데이트 예정)',
		unsupportedList: [
			'앙리 마유 - 3스킬(사용 후 5턴 뒤 사망)',
			'만드리카르도 - 2스킬(강화 전 - 공격 후 사망 / 강화 후 - 공격 턴 종료 후 사망)',
			'예장, 스킬 효과로 인한 거츠'
		],
		orderChangeWarning:
			'오더 체인지, 자폭, 후퇴 서번트를 사용 할 경우 전투 시뮬레이터 파티 구성시에 사용하지 않는 서번트라도 편성하는걸 추천드립니다.',
		detailsBtn: '설명',
		orderChangeTitle: '오더 체인지, 자폭, 후퇴 편성 주의',
		orderChangeGuide: {
			step1:
				'시뮬레이터 파티 구성시 위 와 같은 화면으로 사용하는 서번트 외 자리를 비워두게 되는데',
			step2: '보통 인게임 파티 편성시 코스트가 남으면 아무 서번트나 배치하게 됩니다.',
			step3:
				'이를 오더 체인지로 확인해보면 후열 서번트 배치가 아예 달라지는걸 확인할 수 있습니다.',
			step4:
				'오더 체인지, 자폭, 후퇴 서번트를 사용 할 경우 전투 시뮬레이터 파티 구성시에 사용하지 않는 서번트도 편성하는걸 추천드립니다.'
		},
		btnOk: '확인',
		bntHow: '사용방법',
		manualGuide: {
			step1_title: '1. 이미 등록된 전투 시뮬레이터 가져오기',
			step1_desc: '꼭!! 두번째 링크 클릭해서 URL 복사',
			step2_title: '2. 직접 테스트한 전투 시뮬레이터 등록하고 가져오기',
			step2_desc: '서버가 아닌 기기에 해당 팀에 등록하고 가져오는 방법입니다.'
		},
		errorTitle: '확인된 에러내용(조치중)',
		errorContent: {
			error1: '전열 서번트 편성시 1번과 3번자리에는 서번트를 편성하고 2번자리는 비워둔 파티를 커맨드로 변환하면 스킬사용이 무시되는 이슈 발생',
		}
	},
	JP: {
		desc: 'カルデアアプリ(Chaldea)の共有URLをFGA用コマンドに変換します。',
		btnDesc: '使い方',
		loading1: 'アトラス院と通信中...',
		loading2: '変換する',
		errorText: '⚠️ 正しいリンクかご確認ください。',
		commandText: '変換されたコマンド',
		clipboardAlert: 'クリップボードにコピーしました！',
		warningTitle: '⚠️ 注意事項 ⚠️',
		warnings: [
			'英語および日本語の翻訳にはAIを使用しているため、不自然な表現が含まれる場合があります。',
			'エラーによるリンゴの損失については責任を負いかねますが、バグ報告は歓迎いたします。',
			'周回用のフリークエスト以外の、特殊なギミックがあるクエストやストーリーでの使用は推奨しません。'
		],
		unsupportedTitle: '現在対応していないロジック（今後のアップデートで対応予定）',
		unsupportedList: [
			'アンリマユ - スキル3（使用後5ターン経過で戦闘不能）',
			'マンドリカルド - スキル2（強化前：攻撃後に戦闘不能 / 強化後：攻撃ターン終了時に戦闘不能）',
			'概念礼装やスキル効果によるガッツ'
		],
		orderChangeWarning:
			'オーダーチェンジ、自爆、退却するサーヴァントを使用する場合、戦闘シミュレーターのパーティ編成時には使用しないサーヴァントも編成しておくことを推奨します。',
		detailsBtn: '詳細',
		orderChangeTitle: 'オーダーチェンジ、自爆、退却編成時の注意',
		orderChangeGuide: {
			step1:
				'シミュレーターでのパーティ編成時、上の画面のように使用するサーヴァント以外の枠を空けておくことが多いですが、',
			step2:
				'実際のゲーム内でコストが余っている場合、適当なサーヴァントを配置することがあります。',
			step3:
				'これをオーダーチェンジ画面で確認すると、控えサーヴァントの配置が全く異なっていることがわかります。',
			step4:
				'オーダーチェンジ、自爆、退却するサーヴァントを使用する場合、戦闘シミュレーターのパーティ編成時にも使用しないサーヴァントを編成しておくことを推奨します。'
		},
		btnOk: '確認',
		bntHow: '使い方',
		manualGuide: {
			step1_title: '1. 登録済みの戦闘シミュレーターからURLを取得する',
			step1_desc: '必ず！！2番目のリンクをクリックしてURLをコピーしてください',
			step2_title: '2. 自分でテストした戦闘シミュレーターを保存して読み込む',
			step2_desc: 'サーバー上ではなく、端末の編成スロットに保存してから読み込む方法です。'
		},
		errorTitle: '既知の不具合（対応中）',
		errorContent: {
			error1: '前衛サーヴァント編成時、1番と3番の枠にサーヴァントを配置し、2番の枠を空けたパーティをコマンドに変換すると、スキルの使用が無視される（スキップされる）問題。',
		}
	},
	EN: {
		desc: 'Converts the shared URL of Chaldea to a command for FGA.',
		btnDesc: 'How to use',
		loading1: 'Communicating with Atlas Academy...',
		loading2: 'Convert',
		errorText: '⚠️ Please check if the link is valid.',
		commandText: 'Converted Command',
		clipboardAlert: 'Copied to clipboard!',
		warningTitle: '⚠️ Disclaimer ⚠️',
		warnings: [
			'English and Japanese translations are generated using AI and may contain unnatural phrasing.',
			'We are not responsible for any loss of Golden Apples caused by errors, but bug reports are highly appreciated.',
			'We do not recommend using this for Story quests or quests with special gimmicks. Please use it mainly for repeatable Free Quests.'
		],
		unsupportedTitle: 'Currently unsupported logic (Planned for future updates):',
		unsupportedList: [
			'Angra Mainyu - 3rd Skill (Death 5 turns after use)',
			'Mandricardo - 2nd Skill (Pre-upgrade: Death after attacking / Post-upgrade: Death at the end of the attacking turn)',
			'Guts effects granted by Craft Essences (CE) or Skills'
		],
		orderChangeWarning:
			"When using Order Change, self-sacrifice, or retreating Servants, we recommend filling all empty slots in the battle simulator's party setup, even with unused Servants.",
		detailsBtn: 'Details',
		orderChangeTitle: 'Caution: Order Change, Sacrifice & Retreat',
		orderChangeGuide: {
			step1:
				'When setting up your party in the simulator, you usually leave the slots for unused Servants empty like the screen above.',
			step2:
				'However, in the actual game, players often fill empty slots with random Servants if they have leftover Cost.',
			step3:
				'If you check this on the Order Change screen, you will notice that the backline placement is completely different.',
			step4:
				'When using Order Change, self-sacrifice, or retreating Servants, we highly recommend filling the empty slots in the simulator to match your in-game party.'
		},
		btnOk: 'OK',
		bntHow: 'How to use',
		manualGuide: {
			step1_title: '1. Import an already saved battle simulator',
			step1_desc: 'Make sure to click the SECOND link to copy the URL!',
			step2_title: '2. Save and import a custom battle simulator',
			step2_desc:
				'This method saves the team setup locally on your device rather than on the server before importing.'
		},
		errorTitle: 'Known Issues (Work in Progress)',
		errorContent: {
			error1: 'When converting a party where frontline Servants are placed in slots 1 and 3 while slot 2 is left empty, an issue occurs where skill usages are ignored.',
		}
	}
};