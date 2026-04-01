# FGO Converter (FGO 커맨드 변환기)

<p align="center">
  <a href="https://unic31.github.io/fgo-converter/">
    <img alt="logo" src="https://unic31.github.io/fgo-converter/images/nunnos.png" width="128">
  </a>
</p>

### 칼데아앱(Chaldea)의 공유 URL을 폰닉(FGA)용 텍스트로 변환합니다.

## 해당 사이트를 참고하여 제작되었습니다.

- **Chaldea** https://chaldea.center/ | https://github.com/chaldea-center/chaldea
- **FGA** https://fate-grand-automata.github.io/ | https://github.com/Fate-Grand-Automata/FGA
- **Atlasacademy** https://api.atlasacademy.io/docs | https://github.com/atlasacademy/fgo-game-data-api

## 주의사항

- 오류로 인한 사과 손실은 책임지지 않지만 제보는 감사합니다.
- 반복 프리 퀘스트 외 특수 기믹이 있는 퀘스트나 스토리에 사용을 권장하지 않습니다.
- 스킬은 무조건 강화 퀘스트가 적용된 스킬로 계산합니다.
- 앙리 마유의 3 스킬의 사망 로직은 계산하지 않습니다. 사용에 주의해 주세요.
- 예장이나 스킬 효과로 인한 거츠를 계산하지 않습니다.(추후 업데이트 예정)

## 피드백 (Feedback)

#### 버그신고나 기능요청 등 연락 바랍니다.

- **Mail** uenic31@gmail.com
- **X(Twitter)** @u_nic31

## 기술 스택 (Tech Stack)

- **Framework:** SvelteKit (Svelte 5 Runes)
- **Styling:** Tailwind CSS
- **Deployment:** GitHub Pages (Static Adapter)

## 로컬 실행 방법 (Local Development)

```bash
# 1. 저장소 클론
git clone https://github.com/Unic31/fgo-converter.git

# 2. 폴더 이동
cd fgo-converter

# 3. 패키지 설치
npm install

# 4. 개발 서버 실행
npm run dev
```
