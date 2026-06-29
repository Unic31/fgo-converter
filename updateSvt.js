import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { serverServantIds } from './src/lib/svtList.js';

const SVT_LIST_PATH = path.resolve('./src/lib/svtList.js');
const IMAGE_BASE_DIR = path.resolve('./static/images/svt');
const LOG_FILE_PATH = path.resolve('./update_log.txt');

const banList = new Set([83, 149, 151, 152, 168, 240, 333]);

const classMapping = {
    saber: '01_saber',
    archer: '02_archer',
    lancer: '03_lancer',
    rider: '04_rider',
    caster: '05_caster',
    assassin: '06_assassin',
    berserker: '07_berserker',
    ruler: '08_ruler',
    avenger: '09_avenger',
    altergo: '10_altergo',
    foreigner: '11_foreigner',
    mooncancer: '12_mooncancer',
    pretender: '13_pretender',
    beast: '14_beast',
    unbeast: '15_unbeast',
};

async function downloadImage(url, downloadPath) {
    const dir = path.dirname(downloadPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const writer = fs.createWriteStream(downloadPath);
    const response = await axios({ url, method: 'GET', responseType: 'stream' });
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

function getTodayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day}-${hours}:${minutes}`;
}

// svtList.js 파일에 새로운 번호를 안전하게 끼워넣는 함수
function appendIdToFile(server, className, collectionNo) {
    // 1. 클래스명 매핑 (매핑에 없으면 예외 처리용 배열로 보냄)
    const listKey = classMapping[className] || '00_updateSvt';

    // 파일 전체 텍스트 읽어오기
    let content = fs.readFileSync(SVT_LIST_PATH, 'utf-8');

    // 2. 정확한 서버 블록('KR: {' 또는 'JP: {')의 시작 위치 찾기
    const serverRegex = new RegExp(`(?:'|"|\\b)${server}(?:'|")?\\s*:\\s*\\{`);
    const serverMatch = content.match(serverRegex);

    if (!serverMatch) {
        console.error(`❌ [${server}] 서버 블록을 svtList.js에서 찾을 수 없습니다.`);
        return;
    }

    const serverStartIndex = serverMatch.index;

    // 3. 찾은 서버 블록 이후의 텍스트만 잘라내기 (다른 서버의 클래스명과 혼동 방지)
    const contentFromServer = content.substring(serverStartIndex);

    // 4. 잘라낸 텍스트 안에서 해당 클래스의 배열 찾기 (예: '01_saber': [2, 8, 68])
    const classRegex = new RegExp(`(?:'|"|\\b)${listKey}(?:'|")?\\s*:\\s*\\[([^\\]]*)\\]`);
    const classMatch = contentFromServer.match(classRegex);

    if (!classMatch) {
        console.error(`❌ [${server}] 안에 ${listKey} 배열이 존재하지 않습니다.`);
        return;
    }

    // 매칭된 전체 문자열과, 괄호 [] 안의 숫자들 추출
    const originalArrayStr = classMatch[0]; // 예: "'01_saber': [2, 8, 68]"
    const innerNumbers = classMatch[1].trim(); // 예: "2, 8, 68"

    // 안전장치: 이미 번호가 있는지 정규식으로 한 번 더 확인 (예방 차원)
    if (new RegExp(`\\b${collectionNo}\\b`).test(innerNumbers)) return;

    // 5. 기존 숫자들이 있으면 뒤에 쉼표(,)를 붙이고 번호 추가
    const newInner = innerNumbers.length > 0 ? `${innerNumbers}, ${collectionNo}` : `${collectionNo}`;
    const newArrayStr = originalArrayStr.replace(innerNumbers, newInner);

    // 6. 서버 블록 이후의 텍스트에서 딱 한 번만 치환(업데이트)
    const replacedContentFromServer = contentFromServer.replace(originalArrayStr, newArrayStr);

    // 7. 원본 파일 앞부분 + 업데이트된 뒷부분을 합쳐서 저장
    const finalContent = content.substring(0, serverStartIndex) + replacedContentFromServer;

    fs.writeFileSync(SVT_LIST_PATH, finalContent, 'utf-8');
    console.log(`[${server}] svtList.js 업데이트 완료: ${listKey} 배열에 ${collectionNo} 추가`);
}

async function run(server) {
    try {
        const svtObject = serverServantIds[server] || {};
        const existingIds = new Set(Object.values(svtObject).flat());

        console.log(`Fetching [${server}] FGO API data...`);
        const response = await axios.get(`https://api.atlasacademy.io/export/${server}/basic_servant.json`);
        const apiServants = response.data;

        const fiveStarServants = apiServants.filter(svt => svt.rarity === 5);

        let updatedCount = 0;
        let logContents = '';
        const todayStr = getTodayString();

        for (const servant of fiveStarServants) {
            const { collectionNo, className, face } = servant;

            if (banList.has(collectionNo)) continue;
            
            const isExistInServer = existingIds.has(collectionNo);

            if (!isExistInServer) {
                const logMessage = `${todayStr} [${server}] NEW SVT - no: ${collectionNo}, name: ${servant.name}, class: ${className}`;
                console.log(logMessage);
                logContents += logMessage + '\n';

                // 리스트(js 파일)에 번호 추가
                appendIdToFile(server, className, collectionNo);

                // ✅ 2. 누락되었던 이미지 자동 분류 및 다운로드 로직 복구
                if (server === 'JP') {
                    const targetDirName = classMapping[className] || '00_updateSvt';
                    const imagePath = path.join(IMAGE_BASE_DIR, targetDirName, `${collectionNo}.png`);

                    console.log(` -> Downloading face image to: ${targetDirName}/${collectionNo}.png`);
                    await downloadImage(face, imagePath);
                }

                updatedCount++;
            }
        }
        if (updatedCount > 0) {
            fs.appendFileSync(LOG_FILE_PATH, logContents, 'utf-8');
            console.log(`\n[${server}] ${updatedCount}명의 신규 서번트가 있습니다`);
        } else {
            console.log(`\n[${server}] 업데이트할 새로운 5성 서번트가 없습니다.`);
        }
    } catch (error) {
        console.error('스크립트 실행 중 에러 발생:', error);
    }
}
async function main() {
    await run("JP");
    await run("KR");
}
main()