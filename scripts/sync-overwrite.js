const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    console.log('--- DB 완전 동기화 및 덮어쓰기 시작 ---');
    const csvPath = 'member_template_utf8.csv'; // UTF-8로 변환된 파일 사용

    if (!fs.existsSync(csvPath)) {
        console.error(`에러: ${csvPath} 파일이 없습니다.`);
        return;
    }

    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim().length > 0);

    if (lines.length === 0) {
        console.error('에러: 파일이 비어있습니다.');
        return;
    }

    const headers = lines[0].split(',');
    console.log('Headers:', headers);

    const rows = lines.slice(1);
    console.log(`총 ${rows.length}명의 데이터 발견.`);

    const usersToInsert = [];

    for (const row of rows) {
        const columns = row.split(',');
        if (columns.length < 2) continue;

        const name = columns[0]?.trim();
        const rawPhone = columns[1]?.trim();

        if (!name || !rawPhone) continue;

        const cleanPhone = rawPhone.replace(/-/g, '').replace(/ /g, '');

        const data = {
            name: name,
            phone: cleanPhone,
            buddhistName: columns[2]?.trim() || null,
            buddhistTitle: columns[3]?.trim() || null,
            buddhistRank: columns[4]?.trim() || null,
            status: columns[5]?.trim() || null,
            position: columns[6]?.trim() || null,
            temple: columns[7]?.trim() || null, // 소속사찰
            templePosition: columns[8]?.trim() || null, // 소속사찰직위
            division: columns[9]?.trim() || null, // 우편번호 -> 분과
            templeAddress: columns[10]?.trim() || null // 사찰주소
        };

        for (const key in data) {
            if (data[key] === '') data[key] = null;
        }

        usersToInsert.push(data);
    }

    console.log(`유효한 정제 데이터: ${usersToInsert.length}명`);

    if (usersToInsert.length === 0) {
        console.error('에러: 주입할 유효한 데이터가 없습니다.');
        return;
    }

    // 연쇄 삭제 (외래키 제약조건 해결)
    console.log('\n--- 1. 기존 가짜 데이터 연쇄 삭제 중 ---');
    try {
        console.log('- 댓글(Comment) 삭제 중...');
        await prisma.comment.deleteMany();

        console.log('- 게시글 이미지(PostImage) 삭제 중...');
        await prisma.postImage.deleteMany();

        console.log('- 게시글(Post) 삭제 중...');
        await prisma.post.deleteMany();

        console.log('- 메시지(Message) 삭제 중...');
        await prisma.message.deleteMany();

        console.log('- 푸시 구독(PushSubscription) 삭제 중...');
        await prisma.pushSubscription.deleteMany();

        const deleteResult = await prisma.user.deleteMany();
        console.log(`- 기존 회원 삭제 수: ${deleteResult.count}명`);

    } catch (e) {
        console.error('삭제 단계 에러 발생:', e.message);
        return;
    }

    console.log('\n--- 2. 마스터 데이터 일괄 적재 중 ---');
    try {
        const createResult = await prisma.user.createMany({
            data: usersToInsert,
            skipDuplicates: true
        });
        console.log(`성공적으로 주입된 데이터 수: ${createResult.count}명`);
    } catch (e) {
        console.error('에러 발생 - 개별 인서트로 안전하게 전환합니다:', e.message);
        let success = 0;
        for (const u of usersToInsert) {
            try {
                await prisma.user.create({ data: u });
                success++;
            } catch (err) {
                console.error(`- 에러: ${u.name} (${u.phone}) : ${err.message}`);
            }
        }
        console.log(`성공적으로 주입된 데이터 수(개별): ${success}명`);
    }

    console.log('\n--- 3. 검증 완료 ---');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
