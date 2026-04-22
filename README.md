# FGO Converter (FGO 커맨드 변환기)

<p align="center">
  <a href="https://unic31.github.io/fgo-converter/">
    <img alt="logo" src="https://unic31.github.io/fgo-converter/images/nunnos.png" width="128">
  </a>
</p>
<p align="center">
  <strong>칼데아앱(Chaldea)의 공유 URL을 폰닉(FGA)용 커맨드로 변환합니다.</strong>
</p>
<p align="center">
  <strong>Converts the shared URL of Chaldea to a command for FGA.</strong>
</p>

아래 문구는 AI를 사용하여 번역되었으며 어색하거나 부자연스러운 표현이 있을 수 있음을 참고해 주세요.  
Please note that the text below was translated using AI and may contain awkward or unnatural phrasing.

## 관련 프로젝트 (References)

본 프로젝트는 아래 사이트들의 데이터를 기반으로 제작되었습니다.  
This project is based on the data from the following sites.

- **Chaldea:** [Website](https://chaldea.center/) | [GitHub](https://github.com/chaldea-center/chaldea)
- **FGA (Fate-Grand-Automata):** [Website](https://fate-grand-automata.github.io/) | [GitHub](https://github.com/Fate-Grand-Automata/FGA)
- **Atlas Academy:** [API Docs](https://api.atlasacademy.io/docs) | [GitHub](https://github.com/atlasacademy/fgo-game-data-api)

## 주의사항 (Disclaimer)

- 오류로 인한 사과 손실은 책임지지 않지만 제보는 감사합니다.
- 반복 프리 퀘스트 외 특수 기믹이 있는 퀘스트나 스토리에 사용을 권장하지 않습니다.
- 현재 계산하지 않는 로직(추후 업데이트 예정)
  - 앙리 마유 - 3스킬(사용 후 5턴 뒤 사망)
  - 만드리카르도 - 2스킬(강화 전 - 공격 후 사망 / 강화 후 - 공격 턴 종료 후 사망)
  - 예장, 스킬 효과로 인한 거츠
- We are not responsible for any loss of Golden Apples caused by errors, but bug reports are highly appreciated.
- We do not recommend using this for Story quests or quests with special gimmicks. Please use it mainly for repeatable Free Quests.
- Currently unsupported logic (Planned for future updates):
  - Angra Mainyu - 3rd Skill (Death 5 turns after use)
  - Mandricardo - 2nd Skill (Pre-upgrade: Death after attacking / Post-upgrade: Death at the end of the attacking turn)
  - Guts effects granted by Craft Essences (CE) or Skills

## 피드백 (Feedback)

버그 신고나 기능 요청은 연락 바랍니다. 버그를 신고하실 때는 오류가 발생한 URL을 첨부해 주세요.  
For bug reports or feature requests, please contact me. If you are reporting a bug, please attach the URL where the error occurred.

- **Mail:** [uenic31@gmail.com](mailto:uenic31@gmail.com)
- **Google Form:** [form](https://docs.google.com/forms/d/e/1FAIpQLSchVZotqT9RRD2tYW_sjOiu2lKgIGfv8xl0sFmyH7Aod2oQVg/viewform?usp=header)
- **X (Twitter):** [@u_nic31](https://x.com/u_nic31)

## 쌀먹 (Donation)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/W7W41X3N7F)

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
