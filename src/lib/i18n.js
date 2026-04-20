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
			'시뮬레이터 파티 편성시 서번트와 서번트 사이에 빈자리가 있는 전투 데이터를 커맨드로 변환할 경우 에러가 발생할 수 있습니다. ',
		detailsBtn: '설명',
		btnOk: '확인',
		bntHow: '사용방법',
		manualGuide: {
			step1_title: '1. 이미 등록된 전투 시뮬레이터 가져오기',
			step1_desc: '꼭!! 두번째 링크 클릭해서 URL 복사',
			step2_title: '2. 직접 테스트한 전투 시뮬레이터 등록하고 가져오기',
			step2_desc: '서버가 아닌 기기에 해당 팀에 등록하고 가져오는 방법입니다.'
		},
		copy: '복사'
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
		orderChangeWarning: 'シミュレーターでのパーティ編成時、サーヴァントとサーヴァントの間に空き枠がある状態の戦闘データをコマンドに変換すると、エラーが発生する可能性があります。',
		detailsBtn: '詳細',
		btnOk: '確認',
		bntHow: '使い方',
		manualGuide: {
			step1_title: '1. 登録済みの戦闘シミュレーターからURLを取得する',
			step1_desc: '必ず！！2番目のリンクをクリックしてURLをコピーしてください',
			step2_title: '2. 自分でテストした戦闘シミュレーターを保存して読み込む',
			step2_desc: 'サーバー上ではなく、端末の編成スロットに保存してから読み込む方法です。'
		},
		copy: 'コピー'
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
		orderChangeWarning: 'When setting up your party in the simulator, converting battle data with an empty slot between Servants into a command may cause an error.',
		detailsBtn: 'Details',
		btnOk: 'OK',
		bntHow: 'How to use',
		manualGuide: {
			step1_title: '1. Import an already saved battle simulator',
			step1_desc: 'Make sure to click the SECOND link to copy the URL!',
			step2_title: '2. Save and import a custom battle simulator',
			step2_desc:
				'This method saves the team setup locally on your device rather than on the server before importing.'
		},
		copy: 'Copy'
	}
};