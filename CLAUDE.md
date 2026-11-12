# fgo-converter

SvelteKit(Svelte 5) + Tailwind 정적 사이트(GitHub Pages). 클라이언트 전용, 백엔드 없음.
- `/converter`: 칼데아 전투 공유 URL → FGA 명령어 변환
- `/checklist`: 서번트 체크리스트 (5성 보유/보구레벨/성배/관위 표시, 데스티니, PNG 저장)
- `src/lib/svtList.js`: 서버별(KR/JP/NA/luckyBag) 5성 collectionNo 목록, `svtClassMap`(ID→클래스 폴더), `destinyMaxId`. `updateSvt.js`가 Atlas Academy API로 갱신

## 체크리스트 데이터 규격 (기존 사용자 저장 데이터를 항상 읽을 수 있어야 함 — 저장 값이 사라지면 안 됨)
- localStorage 키
  - `multi_accounts` = `{ accountA..D: { name, svt_data } }`, `current_id`
  - `svt_checklist_settings`: 화면 옵션(서버, 출력, 크기, 클릭 모드, 보구 상한, 1억DL 테두리, `isDestiny`)
  - `svt_destiny` = `{ [accountId]: { [classFolder]: collectionNo } }` (데스티니 선택, 체크리스트 데이터와 별개라 초기화/불러오기에 영향 없음)
  - `multi_accounts_backup_before_import`: JSON 불러오기 직전 `multi_accounts` 전체 백업(최근 1회)
- `svt_data[collectionNo] = { npLv, grail?, isGrand?, bond? }`. 미보유 서번트는 항목 없음(또는 npLv 0). 보유 판정은 `npLv >= 1`
- `grail`/`isGrand`/`bond`는 해당될 때만 저장하고 없으면 0/false와 같은 뜻. 예전 데이터에는 `isGrail: false, isGrand: false`가 명시돼 있으니 읽을 때 `=== false` 비교 대신 참/거짓으로만 판정하고, 기존 저장값을 일괄 변환하지는 않는다(사용자가 해당 서번트를 건드릴 때 새 형태로 바뀜)
- `grail`은 성배 사용 개수(정수). 5성 기준 5개=Lv100, 15개=Lv120(최대). 표시 단계(없음/`grail100.png`/`grail120.png`)는 `src/lib/grail.js`의 `grailTier`로 계산, 클릭은 없음→5개→15개→없음 순환. **예전 `isGrail: true`(개수 없음)는 5개(grail100)로 해석**하며 `getGrail`/`grailTier`로만 읽는다
- `isGrand`는 수동 토글 가능. `bond`는 인연 포인트 0~16 정수(칼데아 JSON에서는 `servants[id].bond`), 저장만 하고 화면 표시는 아직 없음

## 칼데아 JSON 불러오기
- `.json` 파일(칼데아 앱 "사용자 데이터" 내보내기)만 받음. CSV 임포터는 제거됨. 함수(`checklist/+page.svelte`): `parseChaldeaUserdata`, `importJSON`, `findImportConflicts`, `applyImport`
- `users[curUserKey].servants[collectionNo]`만 사용. JSON 키 = 체크리스트 ID(collectionNo). rarity/name이 없어 `svtList.js`의 5성 ID 목록으로 필터링
- 변환: 보유=`cur.favorite`, `npLv=cur.npLv`, `grail=cur.grail`(0이면 생략), `isGrand=grandSvt`, `bond=servants[id].bond`
- 보유 판정은 favorite만 사용하기로 결정: 사용자 계정 483개 전부 favorite과 실제 보유가 일치(너서리 라임은 판매해서 미보유). 계획용으로 미보유 서번트를 즐겨찾기한 계정에서는 틀릴 수 있음
  - 대안(필요 시): 승급/유대/스킬/어펜드/성배/보구2↑/의상 중 하나라도 기본값 초과면 보유. 서번트 코인은 `items[svtId*100+1]` (svtId 매핑 필요)
- 현재 계정 데이터를 불러온 데이터로 교체한다. 단,
  - 가져온 보유 서번트가 0개면 덮어쓰지 않음
  - 보구레벨 하락(미보유로 들어오는 경우 포함), 성배 개수 감소(`getGrail` 기준), 관위 해제/같은 클래스의 다른 서번트로 관위 교체가 있으면 '불러오기 확인' 모달에서 항목별로 기존 유지/불러온 값을 고름(기본 기존 유지)
  - 기존 유지 시: 보구는 기존 npLv(미보유로 들어온 서번트는 기존 상태 통째로), 성배는 기존 개수를 `grail`로 저장, 관위는 기존 관위를 남기고 같은 클래스에 새로 들어온 관위는 받지 않음

## 데스티니 (체크리스트 옵션 '데스티니(KR)')
- 클래스 14칸(7×2)에 계정별로 서번트 1명씩 선택(`svt_destiny`). 선택 후보는 JP 목록 중 `destinyMaxId` 이하
- '데스티니 저장' 버튼은 데스티니 영역만 PNG로 저장(`saveDestinyImage`). 캡처 시 고정 폭을 주고 위쪽 여백(`mt-8`)을 없애야 아래가 잘리지 않음. 빈 칸은 캡처에서 숨김

## 남은 작업
- 인연 화면 표시·구역 터치(성배/관위/인연) 개편은 보류 상태
- 사용방법 모달의 터치 구역 안내 이미지 `static/images/manual3.png`는 구역 개편 시 함께 교체

## 참고
- 도움말 이미지 `static/images/manual4.png`는 JSON 내보내기 화면(설정→사용자 데이터→다른이름으로 저장), 기존 CSV 버전은 `manual4_csv.png`로 백업
- localStorage는 origin(포트 포함)별로 분리됨. 개발 시 `localhost` 주소가 다르면 데이터가 비어 보임(삭제된 것 아님)
- 샘플 데이터: 다운로드 폴더의 `chaldea-userdata-*.json`, `chaldea_data_*.csv` (CSV는 보유 판정 검증용으로만 참고)
- 이미지 저장은 `html-to-image`의 `toPng`(공통 함수 `capturePng`)
- 다국어: 화면 문구는 `src/lib/i18n.js`의 KR/JP/EN에 같은 키로 추가하고 `t.키`로 읽는다. 값 자리는 `{이름}`(체크리스트는 `fmt`, 링크·아이콘을 끼울 땐 `splitTpl`). dev 전용 영역(컨버터 디버그 패널, Dev 사이드바)과 SEO용 `<title>`/meta는 한국어 유지
- 검증: `npx svelte-check --threshold error`
