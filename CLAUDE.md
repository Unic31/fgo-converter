# fgo-converter

SvelteKit(Svelte 5) + Tailwind 정적 사이트(GitHub Pages). 클라이언트 전용, 백엔드 없음.
- `/converter`: 칼데아 전투 공유 URL → FGA 명령어 변환
- `/checklist`: 서번트 체크리스트 (5성 보유/보구레벨/성배/그랜드 표시, PNG 저장)
- `/csv`: 범용 칼데아 CSV 편집기 (체크리스트와 무관)
- `src/lib/svtList.js`: 서버별(KR/JP/NA/luckyBag) 5성 collectionNo 목록, `svtClassMap`(ID→클래스 폴더). `updateSvt.js`가 Atlas Academy API로 갱신

## 체크리스트 데이터 규격 (기존 사용자 데이터 호환 — 변경 금지)
- localStorage `multi_accounts` = `{ accountA..D: { name, svt_data } }`, `current_id`, `svt_checklist_settings`
- `svt_data[collectionNo] = { npLv, isGrail, isGrand }`. 미보유 서번트는 항목 없음(또는 npLv 0). 보유 판정은 `npLv >= 1`
- `isGrail`은 성배 개수가 아니라 "성배 15개 이상" boolean, `isGrand`는 수동 토글 가능

## 칼데아 JSON 불러오기 (완료)
- CSV 임포터는 제거, `.json` 파일(칼데아 앱 "사용자 데이터" 내보내기)만 받음. 함수: `parseChaldeaUserdata`, `importJSON` (`checklist/+page.svelte`)
- `users[curUserKey].servants[collectionNo]`만 사용. JSON 키 = 체크리스트 ID(collectionNo)
- 변환: 보유=`cur.favorite`, `npLv=cur.npLv`, `isGrail=cur.grail>=15`, `isGrand=grandSvt`
- 보유 판정은 favorite만 사용하기로 결정: 사용자 계정 483개 전부 favorite과 실제 보유가 일치(너서리 라임은 판매해서 미보유). 계획용으로 미보유 서번트를 즐겨찾기한 계정에서는 틀릴 수 있음
- 대안(필요 시): 승급/유대/스킬/어펜드/성배/보구2↑/의상 중 하나라도 기본값 초과면 보유. 서번트 코인은 `items[svtId*100+1]` (svtId 매핑 필요)
- 칼데아 JSON에는 rarity/name이 없어 `svtList.js`의 5성 ID 목록으로 필터링

## 남은 작업
- 불러오기가 현재 계정 데이터를 통째로 교체함 → 병합(수동 성배/그랜드 표시 유지), 가져온 서번트 0개면 덮어쓰기 방지, 직전 상태 백업 키 저장
- 성배 개수 자체 저장(현재 boolean)은 UI와 같이 바꿔야 해서 보류

## 참고
- 도움말 이미지 `static/images/manual4.png`는 JSON 내보내기 화면(설정→사용자 데이터→다른이름으로 저장)으로 교체 완료, 기존 CSV 버전은 `manual4_csv.png`로 백업
- localStorage는 origin(포트 포함)별로 분리됨. 개발 시 `localhost` 주소가 다르면 데이터가 비어 보임(삭제된 것 아님)
- 샘플 데이터: 다운로드 폴더의 `chaldea-userdata-*.json`, `chaldea_data_*.csv` (CSV는 보유 판정 검증용으로만 참고)
- 검증: `npx svelte-check --threshold error`
