import fs from 'fs';
import path from 'path';

const DATA_FILE_PATH = path.join(process.cwd(), 'public', 'data', 'local-info.json');
const POSTS_DIR = path.join(process.cwd(), 'src', 'content', 'posts');

const fallbackImages = [
  'https://commons.wikimedia.org/wiki/Special:FilePath/Ulsan_129.30972E_35.52012N.jpg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Shade%20Of%20Taehwagang%20(71978891).jpeg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Ulsan%20taehwaru.jpg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/%EA%B0%84%EC%A0%88%EA%B3%B6%ED%92%8D%EA%B2%BD%20-%20panoramio.jpg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Bangudae_Petroglyphs_from_Ulsan_(5329613206).jpg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Ulsan-banner.jpg',
];

// ── 카테고리별 섹션 템플릿 ──────────────────────────────────
const SECTION_TEMPLATES = {
  복지경제: {
    sections: [
      '핵심 요약',
      '이런 분께 해당돼요',
      '얼마나, 어떻게 받나요',
      '신청 방법',
      '놓치기 쉬운 포인트',
      '문의 및 관련 링크',
    ],
    imageLabels: ['대표 이미지', '요약 이미지', '대상 이미지', '신청 이미지', '주의 이미지', '마무리 이미지'],
  },
  생활정보: {
    sections: [
      '한눈에 보기',
      '이게 뭔가요',
      '어디서',
      '이용 방법',
      '꿀팁',
      '관련 링크',
    ],
    imageLabels: ['대표 이미지', '요약 이미지', '설명 이미지', '위치 이미지', '꿀팁 이미지', '마무리 이미지'],
  },
  행사축제: {
    sections: [
      '행사 요약',
      '언제, 어디서',
      '프로그램',
      '참여 방법',
      '주의사항',
      '문의',
    ],
    imageLabels: ['대표 이미지', '행사 이미지', '일정 이미지', '프로그램 이미지', '참여 이미지', '마무리 이미지'],
  },
  명소관광: {
    sections: [
      '한눈에 보기',
      '어떤 곳인가요',
      '찾아가는 법',
      '주변 볼거리',
      '꿀팁',
      '관련 링크',
    ],
    imageLabels: ['대표 이미지', '전경 이미지', '위치 이미지', '주변 이미지', '꿀팁 이미지', '마무리 이미지'],
  },
};

function resolveTemplateType(category) {
  const cat = (category || '').trim();
  if (['복지', '경제', '혜택'].includes(cat)) return '복지경제';
  if (['행사', '축제', '문화'].includes(cat)) return '행사축제';
  if (['명소', '관광', '야외활동'].includes(cat)) return '명소관광';
  return '생활정보'; // 생활, 정보, 기타 등
}

function getTemplate(category) {
  return SECTION_TEMPLATES[resolveTemplateType(category)];
}

function toSlug(input) {
  return (input || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function normalizeItemName(name) {
  return (name || '')
    .replace(/^울산광역시\s*/u, '')
    .replace(/\s*\(울산광역시\)\s*/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function buildFallbackPost(targetItem) {
  const today = new Date().toISOString().slice(0, 10);
  const safeKeyword = toSlug(targetItem?.name) || 'ulsan-info';
  const filename = `${today}-${safeKeyword}.md`;

  const normalizedName = normalizeItemName(targetItem.name) || targetItem.name;
  const tpl = getTemplate(targetItem.category);
  const tplType = resolveTemplateType(targetItem.category);

  const title = `울산광역시 ${normalizedName} 아시나요?`;
  const summary = targetItem.summary || '울산 시민을 위한 핵심 공공 정보를 정리했습니다.';
  const category = tplType === '복지경제' ? '복지' : tplType === '행사축제' ? '행사' : tplType === '명소관광' ? '명소' : '생활';

  // 카테고리별 기본 본문
  const fallbackBodies = {
    복지경제: [
      `| 항목 | 내용 |\n|---|---|\n| 지원 대상 | ${targetItem.target || '울산 시민'} |\n| 지원 내용 | ${normalizedName} |\n| 신청 기간 | ${targetItem.startDate || '공고 참조'} ~ ${targetItem.endDate || '예산 소진 시까지'} |`,
      `${normalizedName}은 다음 조건에 해당하는 분이 신청할 수 있습니다.\n- 대상: ${targetItem.target || '울산광역시 주민등록 시민'}\n- 관련 분야: ${targetItem.category || '복지'}`,
      `${summary}\n- 지원 형태 및 금액은 공고문을 확인하세요.\n- 타 지원사업과 중복 수혜 가능 여부를 먼저 확인하는 것이 좋습니다.`,
      `1. 공고문에서 신청 대상·기간·제출서류를 확인합니다.\n2. 온라인(정부24, 복지로) 또는 방문 신청 경로를 선택합니다.\n3. 신청 후 접수 확인 문자 또는 접수번호를 보관합니다.\n4. 보완 요청이 오면 기한 내 서류를 추가 제출합니다.`,
      `- 마감일 직전보다 2~3일 전에 신청하면 오류 대응이 쉽습니다.\n- 신분증, 통장사본, 주민등록 관련 서류는 미리 준비해 두세요.\n- 비슷한 정책이 동시에 열리는 시기에는 중복 가능 여부를 꼭 확인하세요.`,
      `- 울산광역시 공식 홈페이지\n- 정부24 (www.gov.kr)\n- 복지로 (www.bokjiro.go.kr)\n- 관할 행정복지센터(주민센터)`,
    ],
    생활정보: [
      `${normalizedName} 정보를 한눈에 정리했습니다.\n- 핵심 요약: ${summary}`,
      `${normalizedName}은 ${targetItem.category || '생활'} 분야의 공공 안내 정보입니다.\n- 대상: 울산 시민 및 관련 조건 충족자\n- 기대 효과: 생활비 절감, 정보 접근성 향상`,
      `아래 경로에서 공식 안내를 우선 확인하세요.\n- 울산광역시 공식 홈페이지 및 구·군청 공지\n- 관할 행정복지센터(주민센터)\n- 정책별 전용 접수 페이지(있을 경우)`,
      `1. 공고문에서 신청 대상·기간·제출서류를 확인합니다.\n2. 온라인 또는 방문 신청 경로를 선택합니다.\n3. 신청 후 접수 확인 문자 또는 접수번호를 보관합니다.\n4. 보완 요청이 오면 기한 내 서류를 추가 제출합니다.`,
      `- 마감일 직전보다 2~3일 전에 신청하면 오류 대응이 쉽습니다.\n- 신분증, 통장사본, 주민등록 관련 서류는 미리 준비해 두세요.`,
      `- 울산광역시 공식 홈페이지\n- 관할 구·군청 공지사항`,
    ],
    행사축제: [
      `${normalizedName} 핵심 정보를 정리했습니다.\n- ${summary}`,
      `- 기간: ${targetItem.startDate || '공지 참조'} ~ ${targetItem.endDate || '공지 참조'}\n- 장소: ${targetItem.location || '울산광역시 일원'}`,
      `다양한 체험·공연·전시 프로그램이 준비되어 있습니다. 상세 일정은 공식 공지를 확인하세요.`,
      `- 누구나 참여 가능 (일부 사전 신청 필요)\n- 현장 등록 또는 온라인 사전 접수\n- 자세한 사항은 공식 안내 페이지 참조`,
      `- 주차 혼잡이 예상되므로 대중교통 이용을 권장합니다.\n- 야외행사의 경우 기상 상황에 따른 일정 변경 가능성을 확인하세요.\n- 어린이 동반 시 안전사고에 유의하세요.`,
      `- 주최 기관 또는 울산광역시 문화관광과\n- 울산광역시 공식 홈페이지`,
    ],
    명소관광: [
      `${normalizedName} 정보를 한눈에 정리했습니다.\n- ${summary}`,
      `울산의 대표적인 볼거리 중 하나로, 사계절 다양한 매력을 느낄 수 있습니다.\n- 위치: ${targetItem.location || '울산광역시 일원'}`,
      `- 자가용: 네비게이션에 "${normalizedName}" 검색\n- 대중교통: 울산 시내버스 이용 (상세 노선은 울산버스정보 참조)\n- 주차장: 현장 공영주차장 이용 가능`,
      `인근에 함께 둘러볼 수 있는 명소를 소개합니다.\n- 주변 관광지 정보는 울산광역시 관광 안내 사이트를 참조하세요.`,
      `- 방문 전 운영시간·휴무일을 꼭 확인하세요.\n- 사진 촬영 명소는 오전 시간대가 적합합니다.\n- 편의시설(화장실, 매점) 위치를 미리 파악해 두세요.`,
      `- 울산광역시 공식 관광 안내 사이트\n- 울산관광 앱`,
    ],
  };

  const bodies = fallbackBodies[tplType] || fallbackBodies['생활정보'];

  // 조립
  let content = `---
title: ${title}
date: ${today}
summary: ${summary}
category: ${category}
tags: [울산, ${targetItem.category || category}, 정보]
---

![${tpl.imageLabels[0]}](${fallbackImages[0]})

`;

  for (let i = 0; i < tpl.sections.length; i++) {
    content += `## ${i + 1}. ${tpl.sections[i]}\n${bodies[i]}\n\n`;
    if (i < tpl.sections.length - 1) {
      content += `![${tpl.imageLabels[i + 1]}](${fallbackImages[i + 1]})\n\n`;
    }
  }

  content += `![${tpl.imageLabels[5]}](${fallbackImages[5]})

---

**하단 문구**
*본 정보는 울산광역시 및 공공데이터를 참고하여 정리한 콘텐츠입니다.*`;

  return { filename, body: content };
}

function normalizeGeneratedTitle(content) {
  return content.replace(/^title:\s*(.+)$/m, (full, rawTitle) => {
    let title = rawTitle.trim();
    title = title.replace(/\s*\(울산광역시\)/g, '');
    title = title.replace(/^울산광역시\s*울산광역시\s*/u, '울산광역시 ');
    title = title.replace(/\s{2,}/g, ' ');
    return `title: ${title}`;
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractSectionBody(content, heading) {
  const pattern = new RegExp(`${escapeRegExp(heading)}\\n([\\s\\S]*?)(?=\\n##\\s[1-5]\\.|\\n---|$)`, 'm');
  const match = content.match(pattern);
  return (match?.[1] || '').trim();
}

function extractImageUrls(content) {
  const urls = [...content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => (m[1] || '').trim()).filter(Boolean);
  return Array.from({ length: 6 }, (_, i) => urls[i] || fallbackImages[i]);
}

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return {};
  }

  const frontmatter = {};
  const lines = match[1].split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || !line.includes(':')) {
      continue;
    }
    const idx = line.indexOf(':');
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    frontmatter[key] = value;
  }

  return frontmatter;
}

function enforceStrictFixedTemplate(content, targetItem, normalizedName) {
  const today = new Date().toISOString().slice(0, 10);
  const fm = extractFrontmatter(content);
  const images = extractImageUrls(content);

  const tpl = getTemplate(targetItem.category);
  const tplType = resolveTemplateType(targetItem.category);

  // 섹션 본문 추출 — 카테고리별 섹션명 + 이전 공통 섹션명도 폴백으로 시도
  const oldSections = ['왜 중요한가', '무엇인가', '어디서', '이용 방법', '울산 시민 팁'];
  const sectionBodies = tpl.sections.map((sec, i) => {
    // 먼저 정확한 섹션명으로 추출 시도
    let body = extractSectionBody(content, `## ${i + 1}. ${sec}`);
    // 없으면 이전 공통 섹션명으로 폴백
    if (!body && oldSections[i]) {
      body = extractSectionBody(content, `## ${i + 1}. ${oldSections[i]}`);
    }
    return body;
  });

  // 기본 폴백 본문 (카테고리별)
  const defaultBodies = {
    복지경제: [
      `| 항목 | 내용 |\n|---|---|\n| 지원 대상 | 울산 시민 |\n| 지원 내용 | ${normalizedName} |\n| 신청 기간 | 공고 참조 |`,
      `${normalizedName} 관련 지원 대상 정보를 정리했습니다.`,
      `지원 금액·내용 및 수령 방법은 공고문을 우선 확인하세요.`,
      `온라인(정부24, 복지로) 또는 관할 행정복지센터에서 신청할 수 있습니다.`,
      `마감일 2~3일 전에 신청하면 오류 대응이 쉽습니다.`,
      `울산광역시 공식 홈페이지 및 구·군청 공지에서 상세 내용을 확인하세요.`,
    ],
    생활정보: [
      `${normalizedName} 정보를 한눈에 정리했습니다.`,
      `${normalizedName}은 ${targetItem.category || '생활'} 분야의 공공 안내 정보입니다.`,
      `울산광역시 공식 홈페이지, 구·군청 공지, 행정복지센터에서 확인할 수 있습니다.`,
      `공고 확인 → 신청 경로 선택 → 서류 제출 → 접수 확인 순서로 진행합니다.`,
      `신청 기한을 놓치지 않도록 미리 준비하면 혜택을 안정적으로 받을 수 있습니다.`,
      `울산광역시 공식 홈페이지에서 관련 정보를 확인하세요.`,
    ],
    행사축제: [
      `${normalizedName} 행사 핵심 정보를 정리했습니다.`,
      `일정 및 장소는 공식 공지를 확인하세요.`,
      `다양한 프로그램이 준비되어 있습니다.`,
      `누구나 참여 가능하며, 사전 신청이 필요할 수 있습니다.`,
      `주차·날씨·준비물 등 현장 주의사항을 미리 확인하세요.`,
      `주최 기관 또는 울산광역시 문화관광과로 문의하세요.`,
    ],
    명소관광: [
      `${normalizedName} 정보를 한눈에 정리했습니다.`,
      `울산의 대표적인 볼거리 중 하나입니다.`,
      `대중교통·자가용 접근 경로를 안내합니다.`,
      `인근에 함께 둘러볼 수 있는 명소를 소개합니다.`,
      `방문 전 알아두면 좋은 실전 팁을 정리했습니다.`,
      `울산광역시 공식 관광 안내 사이트에서 상세 정보를 확인하세요.`,
    ],
  };

  const defaults = defaultBodies[tplType] || defaultBodies['생활정보'];
  const sections = sectionBodies.map((body, i) => body || defaults[i]);

  const rawTitle = fm.title || `울산광역시 ${normalizedName} 아시나요?`;
  const cleanTitle = normalizeGeneratedTitle(`title: ${rawTitle}`).replace(/^title:\s*/m, '');
  const summary = fm.summary || targetItem.summary || '울산 시민을 위한 핵심 공공 정보를 정리했습니다.';
  const date = today;
  const category = fm.category || (tplType === '복지경제' ? '복지' : tplType === '행사축제' ? '행사' : tplType === '명소관광' ? '명소' : '생활');
  const tags = `[울산, ${targetItem.category || category}, 정보]`;

  // 본문 조립: 이미지 6개 위치 고정
  let body = '';
  body += `![${tpl.imageLabels[0]}](${images[0]})\n\n`;
  for (let i = 0; i < tpl.sections.length; i++) {
    body += `## ${i + 1}. ${tpl.sections[i]}\n${sections[i]}\n\n`;
    if (i < tpl.sections.length - 1) {
      body += `![${tpl.imageLabels[i + 1]}](${images[i + 1]})\n\n`;
    }
  }
  body += `![${tpl.imageLabels[5]}](${images[5]})`;

  return `---
title: ${cleanTitle}
date: ${date}
summary: ${summary}
category: ${category}
tags: ${tags}
---

${body}

---

**하단 문구**
*본 정보는 울산광역시 및 공공데이터를 참고하여 정리한 콘텐츠입니다.*`;
}

function normalizeGeneratedDate(content) {
  const today = new Date().toISOString().slice(0, 10);
  if (/^date:\s*.+$/m.test(content)) {
    return content.replace(/^date:\s*.+$/m, `date: ${today}`);
  }
  return content;
}

function isFixedTemplate(content) {
  // 어떤 카테고리 템플릿이든 섹션 6개 + 이미지 6개이면 통과
  const sectionMatches = [...content.matchAll(/^## \d+\.\s+/gm)];
  if (sectionMatches.length < 5 || sectionMatches.length > 6) {
    return false;
  }

  // 섹션 번호가 순서대로인지 확인
  const nums = sectionMatches.map(m => parseInt(m[0].match(/\d+/)[0], 10));
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] <= nums[i - 1]) {
      return false;
    }
  }

  const imageMatches = [...content.matchAll(/!\[([^\]]+)\]\(([^)]+)\)/g)];
  if (imageMatches.length !== 6) {
    return false;
  }

  return true;
}

function buildOutputFilename(rawFilename, normalizedName) {
  const today = new Date().toISOString().slice(0, 10);
  let keyword = '';

  if (rawFilename) {
    const clean = rawFilename.replace(/\.md$/i, '').trim();
    const parts = clean.split('-');
    if (parts.length >= 4) {
      keyword = parts.slice(3).join('-').trim();
    }
  }

  if (!keyword) {
    keyword = toSlug(normalizedName);
  }

  if (!keyword) {
    keyword = 'ulsan-info';
  }

  return `${today}-${keyword}.md`;
}

function resolveUniqueFilePath(filename) {
  const ext = path.extname(filename) || '.md';
  const base = path.basename(filename, ext);
  let candidate = path.join(POSTS_DIR, `${base}${ext}`);
  let index = 2;

  while (fs.existsSync(candidate)) {
    candidate = path.join(POSTS_DIR, `${base}-${index}${ext}`);
    index += 1;
  }

  return candidate;
}

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) {
      continue;
    }

    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim();

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvLocal();

  console.log('최신 공공서비스 데이터 확인 중...');
  
  if (!fs.existsSync(DATA_FILE_PATH)) {
    console.error('local-info.json 파일이 없습니다.');
    process.exit(1);
  }

  const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
  const localData = JSON.parse(fileContent);

  // events와 benefits 배열에서 가장 최근 항목 추출 (앞에 추가되었으므로 첫 번째 항목)
  // 사용자가 '배열의 마지막'이라고 했으나, fetch-public-data.js에서 unshift로 앞에 추가했음
  // 확실하게 하기 위해 최신 항목(index 0)을 타겟으로 함. (혹은 구조상 push되었다면 마지막 요소)
  const allItems = [
    ...(localData.events || []),
    ...(localData.benefits || [])
  ];

  if (allItems.length === 0) {
    console.log('데이터가 없습니다.');
    process.exit(0);
  }

  // 우리는 fetch-public-data.js에서 unshift를 사용했으므로 0번 인덱스가 최신입니다.
  // 하지만 프롬프트의 '마지막 항목'이라는 말을 존중하여 배열의 마지막 요소를 선택할 수도 구문할 수 있습니다.
  // 가장 확실한 방법은 "아직 마크다운 파일 내용에 name이 포함되지 않은 첫 번째 항목"을 찾는 것입니다.
  let targetItem = null;

  const existingFiles = fs.existsSync(POSTS_DIR) ? fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md')) : [];
  const existingContents = existingFiles.map(f => fs.readFileSync(path.join(POSTS_DIR, f), 'utf-8'));

  // 최신 항목(unshift 기준 가장 앞)부터 글 작성 여부 확인
  for (const item of allItems) {
    const isAlreadyPosted = existingContents.some(content => content.includes(item.name));
    if (!isAlreadyPosted) {
      targetItem = item;
      break; // 작성되지 않은 가장 최신 항목 1개 선택
    }
  }

  if (!targetItem) {
    console.log('이미 작성된 글입니다 (모든 데이터의 블로그 글이 존재현합니다).');
    process.exit(0);
  }

  console.log(`블로그 글 생성 대상: ${targetItem.name}`);

  const normalizedName = normalizeItemName(targetItem.name) || targetItem.name;

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.error('GEMINI_API_KEY 환경변수가 없습니다.');
    process.exit(1);
  }

  console.log('Gemini AI로 블로그 글 작성 중...');

  const tpl = getTemplate(targetItem.category);
  const sectionBlock = tpl.sections.map((sec, i) => {
    const imgLabel = tpl.imageLabels[i + 1] || '설명 이미지';
    const sectionText = `## ${i + 1}. ${sec}\n(해당 내용에 맞게 자세히 작성)`;
    if (i < tpl.sections.length - 1) {
      return `${sectionText}\n\n![${imgLabel}](이미지${i + 2}_URL)`;
    }
    // 마지막 섹션 뒤에는 이미지 없이 (마무리 이미지는 맨 아래)
    return sectionText;
  }).join('\n\n');

  const prompt = `아래 공공서비스 정보를 바탕으로 블로그 글을 작성해줘.

정보: ${JSON.stringify(targetItem, null, 2)}

아래 형식으로 출력해줘. 반드시 이 형식만 출력하고 다른 텍스트는 없이:
---
title: 울산광역시 ${normalizedName} 아시나요?
date: ${new Date().toISOString().slice(0, 10)}
summary: ${targetItem.summary}
category: ${resolveTemplateType(targetItem.category) === '복지경제' ? '복지' : resolveTemplateType(targetItem.category) === '행사축제' ? '행사' : resolveTemplateType(targetItem.category) === '명소관광' ? '명소' : '생활'}
tags: [울산, ${targetItem.category}, 정보]
---

![${tpl.imageLabels[0]}](이미지1_URL)

${sectionBlock}

![${tpl.imageLabels[5]}](이미지${tpl.sections.length + 1}_URL)

---

**하단 문구**
*본 정보는 울산광역시 및 공공데이터를 참고하여 정리한 콘텐츠입니다.*

중요 규칙:
- 이미지 개수는 정확히 6개, 위에 명시된 위치에만 배치
- 섹션 제목은 반드시 위 문구 그대로 사용
- 이미지와 텍스트 순서도 반드시 유지
- 이미지 URL은 실제 접근 가능한 고품질 16:9 주소 사용

마지막 줄에 FILENAME: YYYY-MM-DD-keyword 형식으로 파일명도 출력해줘. 키워드는 영문으로.`;

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
  const geminiRes = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!geminiRes.ok) {
    console.warn(`Gemini API 호출 실패: ${geminiRes.status}. 템플릿 기반 폴백으로 생성합니다.`);
    const fallback = buildFallbackPost(targetItem);
    const fallbackPath = resolveUniqueFilePath(fallback.filename);
    if (!fs.existsSync(POSTS_DIR)) {
      fs.mkdirSync(POSTS_DIR, { recursive: true });
    }
    fs.writeFileSync(fallbackPath, fallback.body, 'utf-8');
    console.log(`성공적으로 템플릿 기반 글이 작성되었습니다: ${path.basename(fallbackPath)}`);
    process.exit(0);
  }

  const geminiData = await geminiRes.json();
  let text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

  if (!text) {
    console.warn('Gemini 응답이 비어있어 템플릿 기반 폴백으로 생성합니다.');
    const fallback = buildFallbackPost(targetItem);
    const fallbackPath = resolveUniqueFilePath(fallback.filename);
    if (!fs.existsSync(POSTS_DIR)) {
      fs.mkdirSync(POSTS_DIR, { recursive: true });
    }
    fs.writeFileSync(fallbackPath, fallback.body, 'utf-8');
    console.log(`성공적으로 템플릿 기반 글이 작성되었습니다: ${path.basename(fallbackPath)}`);
    process.exit(0);
  }

  // 마크다운 블록 제거 (```markdown, ``` 등)
  text = text.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();

  // 응답에서 마크다운 및 FILENAME 라인 분리
  const lines = text.split('\n');
  let filename = '';
  let contentLines = [];

  for (const line of lines) {
    if (line.trim().startsWith('FILENAME:')) {
      // "FILENAME: 2026-03-25-keyword" 형태에서 파일명 추출
      filename = line.replace('FILENAME:', '').trim();
      if (!filename.endsWith('.md')) {
        filename += '.md';
      }
    } else {
      contentLines.push(line);
    }
  }

  let finalContent = contentLines.join('\n').trim();
  finalContent = enforceStrictFixedTemplate(finalContent, targetItem, normalizedName);
  finalContent = normalizeGeneratedDate(finalContent);

  if (!isFixedTemplate(finalContent)) {
    console.warn('생성 결과가 고정 템플릿을 벗어나 템플릿 기반 폴백으로 대체합니다.');
    const fallback = buildFallbackPost(targetItem);
    const fallbackPath = resolveUniqueFilePath(fallback.filename);
    if (!fs.existsSync(POSTS_DIR)) {
      fs.mkdirSync(POSTS_DIR, { recursive: true });
    }
    fs.writeFileSync(fallbackPath, fallback.body, 'utf-8');
    console.log(`성공적으로 템플릿 기반 글이 작성되었습니다: ${path.basename(fallbackPath)}`);
    process.exit(0);
  }

  filename = buildOutputFilename(filename, normalizedName);

  // 파일 생성
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }

  const filePath = resolveUniqueFilePath(filename);

  try {
    // 프론트매터 아래 본문 끝에 혹시 추가적인 구문이 있다면 그걸 포함해서 저장
    fs.writeFileSync(filePath, finalContent, 'utf-8');
    console.log(`성공적으로 블로그 글이 작성되었습니다: ${path.basename(filePath)}`);
  } catch (ignore) {
    console.error('마크다운 파일 저장 실패:');
    process.exit(1);
  }
}

main().catch(console.error);
