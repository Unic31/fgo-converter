// 5성은 성배 1개당 레벨 +2: 5개 = Lv100, 15개 = Lv120(최대).
export const GRAIL_100 = 5;
export const GRAIL_120 = 15;

// svt_data[id].grail 은 성배 사용 개수(선택 필드, 없으면 0).
// 예전 데이터에는 개수 없이 isGrail: true 만 있으므로, grail 이 없을 때만 isGrail 을 Lv100(5개)로 본다.
export function getGrail(state) {
	const n = Math.trunc(Number(state?.grail));
	if (Number.isFinite(n) && n > 0) return n;
	return state?.isGrail ? GRAIL_100 : 0;
}

export function grailTier(state) {
	const n = getGrail(state);
	if (n >= GRAIL_120) return 120;
	if (n >= GRAIL_100) return 100;
	return 0;
}
