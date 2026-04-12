import fs from 'fs';
import path from 'path';

const DATA_FILE_PATH = path.join(process.cwd(), 'public', 'data', 'local-info.json');
const POSTS_DIR = path.join(process.cwd(), 'src', 'content', 'posts');

const fallbackImages = [
  'https://picsum.photos/seed/ulsan-main/1280/720',
  'https://picsum.photos/seed/ulsan-why/1280/720',
  'https://picsum.photos/seed/ulsan-what/1280/720',
  'https://picsum.photos/seed/ulsan-where/1280/720',
  'https://picsum.photos/seed/ulsan-how/1280/720',
  'https://picsum.photos/seed/ulsan-tip/1280/720',
];

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

  const title = `울산광역시 ${normalizedName} 아시나요?`;
  const summary = targetItem.summary || '울산 시민을 위한 핵심 공공 정보를 정리했습니다.';
  const category = targetItem.category || '정보';

  const body = `---
title: ${title}
date: ${today}
summary: ${summary}
category: 정보
tags: [울산, ${category}, 정보]
---

![대표 이미지](${fallbackImages[0]})

## 1. 왜 중요한가
${normalizedName} 정보는 놓치면 혜택을 받지 못할 수 있어 반드시 확인이 필요합니다. 울산 시민이 실제 생활에서 체감할 수 있는 지원과 연결되기 때문에, 시기와 대상 조건을 먼저 파악하는 것이 중요합니다.

![설명 이미지](${fallbackImages[1]})

## 2. 무엇인가
${normalizedName}은 ${category} 분야의 공공 안내 정보입니다.
- 핵심 요약: ${summary}
- 대상: 울산 시민 및 관련 조건 충족자
- 기대 효과: 생활비 절감, 정보 접근성 향상, 신청 누락 방지

![설명 이미지](${fallbackImages[2]})

## 3. 어디서
아래 경로에서 공식 안내를 우선 확인하세요.
- 울산광역시 공식 홈페이지 및 구·군청 공지
- 관할 행정복지센터(주민센터)
- 정책별 전용 접수 페이지(있을 경우)

![지도 이미지](${fallbackImages[3]})

## 4. 이용 방법
1. 공고문에서 신청 대상·기간·제출서류를 확인합니다.
2. 온라인 또는 방문 신청 경로를 선택합니다.
3. 신청 후 접수 확인 문자 또는 접수번호를 보관합니다.
4. 보완 요청이 오면 기한 내 서류를 추가 제출합니다.

![이용 장면](${fallbackImages[4]})

## 5. 울산 시민 팁
- 마감일 직전보다 2~3일 전에 신청하면 오류 대응이 쉽습니다.
- 신분증, 통장사본, 주민등록 관련 서류는 미리 준비해 두세요.
- 비슷한 정책이 동시에 열리는 시기에는 중복 가능 여부를 꼭 확인하세요.

![마무리 이미지](${fallbackImages[5]})

---

**하단 문구**
*본 정보는 울산광역시 및 공공데이터를 참고하여 정리한 콘텐츠입니다.*`;

  return { filename, body };
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

  const section1 = extractSectionBody(content, '## 1. 왜 중요한가') || `${normalizedName} 정보는 놓치면 혜택을 받지 못할 수 있어 반드시 확인이 필요합니다.`;
  const section2 = extractSectionBody(content, '## 2. 무엇인가') || `${normalizedName}은 ${targetItem.category || '정보'} 분야의 공공 안내 정보입니다.`;
  const section3 = extractSectionBody(content, '## 3. 어디서') || '울산광역시 공식 홈페이지, 구·군청 공지, 행정복지센터에서 확인할 수 있습니다.';
  const section4 = extractSectionBody(content, '## 4. 이용 방법') || '공고 확인 → 신청 경로 선택 → 서류 제출 → 접수 확인 순서로 진행합니다.';
  const section5 = extractSectionBody(content, '## 5. 울산 시민 팁') || '신청 기한을 놓치지 않도록 미리 준비하면 혜택을 안정적으로 받을 수 있습니다.';

  const rawTitle = fm.title || `울산광역시 ${normalizedName} 아시나요?`;
  const cleanTitle = normalizeGeneratedTitle(`title: ${rawTitle}`).replace(/^title:\s*/m, '');
  const summary = fm.summary || targetItem.summary || '울산 시민을 위한 핵심 공공 정보를 정리했습니다.';
  const date = today;
  const category = fm.category || '정보';
  const tags = `[울산, ${targetItem.category || category}, 정보]`;

  return `---
title: ${cleanTitle}
date: ${date}
summary: ${summary}
category: ${category}
tags: ${tags}
---

![대표 이미지](${images[0]})

## 1. 왜 중요한가
${section1}

![설명 이미지](${images[1]})

## 2. 무엇인가
${section2}

![설명 이미지](${images[2]})

## 3. 어디서
${section3}

![지도 이미지](${images[3]})

## 4. 이용 방법
${section4}

![이용 장면](${images[4]})

## 5. 울산 시민 팁
${section5}

![마무리 이미지](${images[5]})

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
  const requiredSections = [
    '## 1. 왜 중요한가',
    '## 2. 무엇인가',
    '## 3. 어디서',
    '## 4. 이용 방법',
    '## 5. 울산 시민 팁',
  ];

  let cursor = -1;
  for (const section of requiredSections) {
    const idx = content.indexOf(section);
    if (idx === -1 || idx <= cursor) {
      return false;
    }
    cursor = idx;
  }

  const imageMatches = [...content.matchAll(/!\[([^\]]+)\]\(([^)]+)\)/g)];
  if (imageMatches.length !== 6) {
    return false;
  }

  const expectedLabels = ['대표 이미지', '설명 이미지', '설명 이미지', '지도 이미지', '이용 장면', '마무리 이미지'];
  const labels = imageMatches.map((m) => m[1].trim());
  for (let i = 0; i < expectedLabels.length; i += 1) {
    if (labels[i] !== expectedLabels[i]) {
      return false;
    }
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
  const prompt = `아래 공공서비스 정보를 바탕으로 블로그 글을 작성해줘.

정보: ${JSON.stringify(targetItem, null, 2)}

아래 형식으로 출력해줘. 반드시 이 형식만 출력하고 다른 텍스트는 없이:
---
title: 울산광역시 ${normalizedName} 아시나요?
date: ${new Date().toISOString().slice(0, 10)}
summary: ${targetItem.summary}
category: 정보
tags: [울산, ${targetItem.category}, 정보]
---

![대표 이미지](이미지1_URL)

## 1. 왜 중요한가
(이 정보가 왜 중요한지 시민 눈높이로 설명)

![설명 이미지](이미지2_URL)

## 2. 무엇인가
(정의, 대상, 핵심 혜택을 리스트 포함해 설명)

![설명 이미지](이미지3_URL)

## 3. 어디서
(신청/이용 가능한 장소, 사이트, 기관, 연락처)

![지도 이미지](이미지4_URL)

## 4. 이용 방법
(신청 순서, 준비물, 유의사항을 단계형으로 설명)

![이용 장면](이미지5_URL)

## 5. 울산 시민 팁
(실전 활용 팁, 자주 놓치는 포인트)

![마무리 이미지](이미지6_URL)

---

**하단 문구**
*본 정보는 울산광역시 및 공공데이터를 참고하여 정리한 콘텐츠입니다.*

중요 규칙:
- 이미지 개수는 정확히 6개
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
