import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { serverServantIds } from './src/lib/svtList.js';

const SVT_LIST_PATH = path.resolve('./src/lib/svtList.js');
const IMAGE_BASE_DIR = path.resolve('./static/images/svt5');
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
    alterego: '10_alterego',
    foreigner: '11_foreigner',
    mooncancer: '12_mooncancer',
    pretender: '13_pretender',
    beast: '14_beast',
    unbeast: '15_unbeast',
};

// 다운로드가 끝난 뒤에만 파일을 쓴다(실패 시 빈 파일이 남지 않도록)
async function downloadImage(url, downloadPath) {
    const dir = path.dirname(downloadPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const response = await axios({ url, method: 'GET', responseType: 'arraybuffer', timeout: 30000 });
    fs.writeFileSync(downloadPath, Buffer.from(response.data));
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
        return `\n서버 블록을 svtList.js에서 찾을 수 없습니다.`
    }

    const serverStartIndex = serverMatch.index;

    // 3. 찾은 서버 블록 이후의 텍스트만 잘라내기 (다른 서버의 클래스명과 혼동 방지)
    const contentFromServer = content.substring(serverStartIndex);

    // 4. 잘라낸 텍스트 안에서 해당 클래스의 배열 찾기 (예: '01_saber': [2, 8, 68])
    const classRegex = new RegExp(`(?:'|"|\\b)${listKey}(?:'|")?\\s*:\\s*\\[([^\\]]*)\\]`, 'i');
    const classMatch = contentFromServer.match(classRegex);

    if (!classMatch) {
        return `\n${listKey} 배열이 존재하지 않습니다.`
    }

    // 매칭된 전체 문자열과, 괄호 [] 안의 숫자들 추출
    const originalArrayStr = classMatch[0]; // 예: "'01_saber': [2, 8, 68]"
    const innerNumbers = classMatch[1].trim(); // 예: "2, 8, 68"

    // 안전장치: 이미 번호가 있는지 정규식으로 한 번 더 확인 (예방 차원)
    if (new RegExp(`\\b${collectionNo}\\b`).test(innerNumbers)) return '';

    // 5. 기존 숫자들이 있으면 뒤에 쉼표(,)를 붙이고 번호 추가
    const newInner = innerNumbers.length > 0 ? `${innerNumbers}, ${collectionNo}` : `${collectionNo}`;
    const newArrayStr = originalArrayStr.replace(innerNumbers, newInner);

    // 6. 서버 블록 이후의 텍스트에서 딱 한 번만 치환(업데이트)
    const replacedContentFromServer = contentFromServer.replace(originalArrayStr, newArrayStr);

    // 7. 원본 파일 앞부분 + 업데이트된 뒷부분을 합쳐서 저장
    const finalContent = content.substring(0, serverStartIndex) + replacedContentFromServer;

    fs.writeFileSync(SVT_LIST_PATH, finalContent, 'utf-8');
    return `\nsvtList.js 업데이트 완료: ${listKey} 배열에 ${collectionNo} 추가`
}

async function run(server) {
    let logContents = `${getTodayString()} - [${server}]`;
    let isError = false;
    let updatedCount = 0;
    try {
        const svtObject = serverServantIds[server] || {};
        const existingIds = new Set(Object.values(svtObject).flat());

        const response = await axios.get(`https://api.atlasacademy.io/export/${server}/basic_servant.json`);
        const apiServants = response.data;

        const fiveStarServants = apiServants.filter(svt => svt.rarity === 5);


        for (const servant of fiveStarServants) {
            let { id, collectionNo, name, className, face } = servant;
            className = className.toLowerCase();

            if (banList.has(collectionNo)) continue;

            const isExistInServer = existingIds.has(collectionNo);

            if (!isExistInServer) {
                logContents += `\nNEW SVT - id:${id}, no: ${collectionNo}, name: ${name}, class: ${className}`;

                // 리스트(js 파일)에 번호 추가
                const appendLog = appendIdToFile(server, className, collectionNo);
                logContents += appendLog;

                // ✅ 2. 누락되었던 이미지 자동 분류 및 다운로드 로직 복구
                if (server === 'JP') {
                    const targetDirName = classMapping[className] || '00_updateSvt';
                    const imagePath = path.join(IMAGE_BASE_DIR, targetDirName, `${collectionNo}.png`);
                    logContents += `\n서번트 이미지 저장: ${targetDirName}/${collectionNo}.png`;
                    await downloadImage(face, imagePath);
                }

                updatedCount++;
            }
        }
    } catch (error) {
        isError = true;
        const errorContents = `스크립트 실행 중 에러 발생: ${error.message}`
        logContents += `\n${errorContents}`;
        console.error(errorContents);
    } finally {
        if (updatedCount > 0 || isError) {
            logContents += `총 ${updatedCount}건 업데이트 완료.\n`;
            fs.appendFileSync(LOG_FILE_PATH, logContents, 'utf-8');
            console.log(`[${server}] 업데이트 완료`);
        } else {
            console.log(`[${server}] 새로운 5성 서번트가 없습니다.`);
        }
    }
}
// 4성 서번트 이미지(JP 기준)를 static/images/svt4/<클래스>/<collectionNo>.png 로 받는다.
// svtList.js는 건드리지 않고, 이미 받은 이미지는 건너뛴다. 서번트별 에러는 모아서 따로 기록한다.
const IMAGE_4STAR_DIR = path.resolve('./static/images/svt4');
const ERROR_4STAR_LOG_PATH = path.resolve('./update_svt4_errors.txt');

async function run4Star() {
    const server = 'JP';
    let logContents = `${getTodayString()} - [${server} 4성]`;
    const errors = [];
    let downloadedCount = 0;
    let skippedCount = 0;
    try {
        const response = await axios.get(`https://api.atlasacademy.io/export/${server}/basic_servant.json`);
        const fourStarServants = response.data.filter(svt => svt.rarity === 4);

        for (const servant of fourStarServants) {
            const { id, collectionNo, name, face } = servant;
            const className = String(servant.className || '').toLowerCase();
            const label = `id:${id}, no: ${collectionNo}, name: ${name}, class: ${className}`;

            const targetDirName = classMapping[className];
            // svt4에는 비스트/언비스트 폴더를 두지 않는다
            if (!targetDirName || targetDirName === '14_beast' || targetDirName === '15_unbeast') {
                errors.push(`[클래스 폴더 없음] ${label}`);
                continue;
            }
            if (!face) {
                errors.push(`[이미지 URL 없음] ${label}`);
                continue;
            }

            const imagePath = path.join(IMAGE_4STAR_DIR, targetDirName, `${collectionNo}.png`);
            if (fs.existsSync(imagePath) && fs.statSync(imagePath).size > 0) {
                skippedCount++;
                continue;
            }

            try {
                await downloadImage(face, imagePath);
                downloadedCount++;
                logContents += `\n서번트 이미지 저장: svt4/${targetDirName}/${collectionNo}.png (${name})`;
            } catch (error) {
                errors.push(`[다운로드 실패] ${label} - ${error.message} (${face})`);
            }
        }
    } catch (error) {
        errors.push(`[목록 조회 실패] ${error.message}`);
    } finally {
        if (downloadedCount > 0) {
            logContents += `\n총 ${downloadedCount}건 저장 완료.\n`;
            fs.appendFileSync(LOG_FILE_PATH, logContents, 'utf-8');
        }
        if (errors.length > 0) {
            const errorContents = `${getTodayString()} - [${server} 4성] 에러 ${errors.length}건\n${errors.join('\n')}\n`;
            fs.appendFileSync(ERROR_4STAR_LOG_PATH, errorContents, 'utf-8');
            console.error(errorContents);
        }
        console.log(`[${server} 4성] 저장 ${downloadedCount}건, 이미 있음 ${skippedCount}건, 에러 ${errors.length}건`);
    }
}

async function main() {
    // `node updateSvt.js 4star` 로 실행하면 4성 이미지만 받는다
    if (process.argv[2] === '4star') {
        await run4Star();
        return;
    }
    await run("JP");
    await run("KR");
    await run("NA");
    await run4Star();
}
main()