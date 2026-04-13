/**
 * update-images.mjs
 * posts 폴더의 .md 파일을 순회하며 카테고리별 이미지 URL + 라벨을 교체합니다.
 * 현재 지원: 복지/경제 카테고리
 *
 * 사용법: node scripts/update-images.mjs
 *   --dry-run  : 실제 파일 수정 없이 교체 대상만 출력
 */

import fs from 'fs';
import path from 'path';

const POSTS_DIR = path.join(process.cwd(), 'src', 'content', 'posts');
const BACKUP_DIR = path.join(
  process.cwd(),
  'backups',
  `images-backup-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}`,
);

const DRY_RUN = process.argv.includes('--dry-run');

// ── 카테고리별 섹션 이미지 매핑 ──────────────────────────────
// 각 섹션에 사용할 이미지 URL과 alt 라벨을 정의합니다.
// 복지/경제 카테고리: 6개 이미지 (대표 → 요약 → 대상 → 신청 → 주의 → 마무리)
const IMAGE_MAP = {
  복지경제: [
    { label: '대표 이미지', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ulsan_129.30972E_35.52012N.jpg' },
    { label: '요약 이미지', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Shade%20Of%20Taehwagang%20(71978891).jpeg' },
    { label: '대상 이미지', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/%EC%9A%B8%EC%A3%BC%EA%B5%B0,_Ulsan,_South_Korea_(Unsplash).jpg' },
    { label: '신청 이미지', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ulsan%20taehwaru.jpg' },
    { label: '주의 이미지', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Port_Terminal_Of_Ulsan.JPG' },
    { label: '마무리 이미지', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ulsan-banner.jpg' },
  ],
  생활정보: [
    { label: '대표 이미지', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ulsan_129.30972E_35.52012N.jpg' },
    { label: '요약 이미지', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ulsan%20taehwaru.jpg' },
    { label: '설명 이미지', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Shade%20Of%20Taehwagang%20(71978891).jpeg' },
    { label: '위치 이미지', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/%EC%9A%B8%EC%A3%BC%EA%B5%B0,_Ulsan,_South_Korea_(Unsplash).jpg' },
    { label: '꿀팁 이미지', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ulsan-banner.jpg' },
    { label: '마무리 이미지', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Port_Terminal_Of_Ulsan.JPG' },
  ],
  행사축제: [
    { label: '대표 이미지', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ulsan-banner.jpg' },
    { label: '행사 이미지', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Shade%20Of%20Taehwagang%20(71978891).jpeg' },
    { label: '일정 이미지', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/%EA%B0%84%EC%A0%88%EA%B3%B6%ED%92%8D%EA%B2%BD%20-%20panoramio.jpg' },
    { label: '프로그램 이미지', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ulsan%20taehwaru.jpg' },
    { label: '참여 이미지', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ulsan_129.30972E_35.52012N.jpg' },
    { label: '마무리 이미지', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/%EC%9A%B8%EC%A3%BC%EA%B5%B0,_Ulsan,_South_Korea_(Unsplash).jpg' },
  ],
  명소관광: [
    { label: '대표 이미지', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/%EA%B0%84%EC%A0%88%EA%B3%B6%ED%92%8D%EA%B2%BD%20-%20panoramio.jpg' },
    { label: '전경 이미지', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Bangudae_Petroglyphs_from_Ulsan_(5329613206).jpg' },
    { label: '위치 이미지', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Shade%20Of%20Taehwagang%20(71978891).jpeg' },
    { label: '주변 이미지', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/%EC%9A%B8%EC%A3%BC%EA%B5%B0,_Ulsan,_South_Korea_(Unsplash).jpg' },
    { label: '꿀팁 이미지', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ulsan%20taehwaru.jpg' },
    { label: '마무리 이미지', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ulsan-banner.jpg' },
  ],
};

// ── 카테고리 판별 ────────────────────────────────────────────
function resolveTemplateType(category) {
  const cat = (category || '').trim();
  if (['복지', '경제', '혜택'].includes(cat)) return '복지경제';
  if (['생활', '정보'].includes(cat)) return '생활정보';
  if (['행사', '축제', '문화'].includes(cat)) return '행사축제';
  if (['명소', '관광', '야외활동'].includes(cat)) return '명소관광';
  return null;
}

// ── frontmatter에서 category 추출 ────────────────────────────
function extractCategory(content) {
  const match = content.match(/^category:\s*(.+)$/m);
  return match ? match[1].trim() : '';
}

// ── 이미지 교체 ──────────────────────────────────────────────
function replaceImages(content, imageList) {
  let replaced = 0;
  let index = 0;

  const nextImage = () => {
    const current = imageList[index % imageList.length];
    index += 1;
    return current;
  };

  let result = content.replace(/^!\[[^\]]*\]\((.*)\)\s*$/gm, () => {
    const target = nextImage();
    replaced++;
    return `<img src="${target.url}" alt="${target.label}" style="width:100%; height:auto; aspect-ratio:16/9; object-fit:cover; border-radius:12px; margin: 20px 0;" />`;
  });

  result = result.replace(/<img\b[^>]*>/gi, () => {
    const target = nextImage();
    replaced++;
    return `<img src="${target.url}" alt="${target.label}" style="width:100%; height:auto; aspect-ratio:16/9; object-fit:cover; border-radius:12px; margin: 20px 0;" />`;
  });

  result = result.replace(/\/>\s*\.(?:jpe?g|png|webp|gif)\)/gi, ' />');

  return { content: result, replaced };
}

// ── 메인 ─────────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error(`posts 디렉터리가 없습니다: ${POSTS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
  console.log(`총 ${files.length}개 .md 파일 발견\n`);

  let totalFiles = 0;
  let totalReplaced = 0;
  let skippedFiles = 0;
  const processedList = [];

  // 1) 백업 폴더 생성
  if (!DRY_RUN) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`백업 폴더 생성: ${BACKUP_DIR}\n`);
  } else {
    console.log('[ DRY-RUN 모드 ] 실제 파일은 수정되지 않습니다.\n');
  }

  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // 카테고리 확인
    const category = extractCategory(content);
    const tplType = resolveTemplateType(category);

    if (!tplType) {
      skippedFiles++;
      continue; // 현재 복지경제만 처리
    }

    const imageList = IMAGE_MAP[tplType];
    if (!imageList) {
      skippedFiles++;
      continue;
    }

    // 이미지 교체
    const { content: newContent, replaced } = replaceImages(content, imageList);

    if (replaced === 0) {
      skippedFiles++;
      continue;
    }

    totalFiles++;
    totalReplaced += replaced;
    processedList.push({ file, replaced });

    if (!DRY_RUN) {
      // 백업 저장
      fs.writeFileSync(path.join(BACKUP_DIR, file), content, 'utf-8');
      // 수정본 저장
      fs.writeFileSync(filePath, newContent, 'utf-8');
    }

    console.log(`  ✔ ${file}  (${replaced}개 교체)`);
  }

  // 결과 요약
  console.log('\n════════════════════════════════════════');
  console.log(`  처리 파일:   ${totalFiles}개`);
  console.log(`  교체 이미지: ${totalReplaced}개`);
  console.log(`  스킵 파일:   ${skippedFiles}개`);
  if (!DRY_RUN && totalFiles > 0) {
    console.log(`  백업 위치:   ${BACKUP_DIR}`);
  }
  console.log('════════════════════════════════════════');
}

main();
