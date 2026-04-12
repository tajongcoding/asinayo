import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const POSTS_DIR = path.join(process.cwd(), 'src', 'content', 'posts');

const SECTION_TITLES = [
  '## 1. 왜 중요한가 ❗',
  '## 2. 무엇인가 📘',
  '## 3. 어디서 📍',
  '## 4. 이용 방법 🛠️',
  '## 5. 울산 시민 팁 💡',
];

const IMAGE_LABELS = [
  '🖼️ 대표 이미지',
  '📝 설명 이미지',
  '📝 설명 이미지',
  '🗺️ 지도 이미지',
  '🙌 이용 장면',
  '🌟 마무리 이미지',
];

const SECTION_KEYWORDS = [
  ['왜 중요한가', '개요', '중요', '배경'],
  ['무엇인가', '핵심 내용', '핵심', '지원 내용', '혜택 내용', '정의'],
  ['어디서', '확인할 점', '신청 장소', '접수처', '장소'],
  ['이용 방법', '신청 방법', '절차', '이용 안내', '방법'],
  ['울산 시민 팁', '활용 팁', '꿀팁', '숨은 꿀팁', '팁'],
];

const DEFAULT_SECTIONS = [
  '이 정보는 실제 생활에서 혜택을 놓치지 않기 위해 꼭 확인해야 하는 핵심 내용입니다.',
  '핵심 대상과 지원 내용을 이해하면 필요한 혜택을 빠르게 판단할 수 있습니다.',
  '울산광역시 공식 홈페이지, 구군청 공지, 행정복지센터에서 확인할 수 있습니다.',
  '공고 확인 후 신청 경로를 선택하고, 서류를 준비해 기한 내 제출하면 됩니다.',
  '신청 기한과 준비 서류를 미리 체크하면 처리 속도를 높이고 누락을 줄일 수 있습니다.',
];

function normalizeTitle(title) {
  let t = String(title || '').trim();
  t = t.replace(/\s*\(울산광역시\)\s*/gu, ' ');
  t = t.replace(/^울산광역시\s*울산광역시\s*/u, '울산광역시 ');
  t = t.replace(/\s{2,}/g, ' ').trim();
  return t;
}

function stripHeadingNoise(text) {
  return text
    .toLowerCase()
    .replace(/[0-9]/g, '')
    .replace(/[.#*`~!@%^&()_+\-=\[\]{};:'",.<>/?\\|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractImages(raw) {
  const urls = [];
  const mdMatches = raw.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g);
  for (const m of mdMatches) {
    const u = (m[1] || '').trim();
    if (u) urls.push(u);
  }

  const htmlMatches = raw.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi);
  for (const m of htmlMatches) {
    const u = (m[1] || '').trim();
    if (u) urls.push(u);
  }

  return urls;
}

function splitSections(raw) {
  const lines = raw.split(/\r?\n/);
  const indices = [];

  for (let i = 0; i < lines.length; i += 1) {
    if (/^##\s+/.test(lines[i])) {
      indices.push(i);
    }
  }

  const sections = [];
  for (let i = 0; i < indices.length; i += 1) {
    const start = indices[i];
    const end = i + 1 < indices.length ? indices[i + 1] : lines.length;
    const heading = lines[start].replace(/^##\s+/, '').trim();
    const body = lines.slice(start + 1, end).join('\n').trim();
    if (body) {
      sections.push({ heading, body });
    }
  }

  return sections;
}

function cleanBodyFragment(text) {
  return String(text || '')
    // remove markdown images and html images
    .replace(/^!\[[^\]]*\]\([^)]*\)\s*$/gm, '')
    .replace(/<img[^>]*>/gi, '')
    // remove repeated separators/footer lines
    .replace(/^---\s*$/gm, '')
    .replace(/^\*\*하단 문구\*\*\s*$/gm, '')
    .replace(/^\*본 정보는 울산광역시 및 공공데이터를 참고하여 정리한 콘텐츠입니다\.\*\s*$/gm, '')
    // remove old heading/quote wrappers mixed into body fragments
    .replace(/^\s*>\s*###.*$/gm, '')
    .replace(/^\s*>\s*-.*$/gm, '')
    .replace(/^\s*#{2,3}\s+.*$/gm, '')
    // normalize blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildFixedSections(raw) {
  const sourceSections = splitSections(raw);
  const used = new Set();
  const picked = [];

  for (const keywords of SECTION_KEYWORDS) {
    let foundIdx = -1;

    for (let i = 0; i < sourceSections.length; i += 1) {
      if (used.has(i)) continue;
      const normalized = stripHeadingNoise(sourceSections[i].heading);
      if (keywords.some((k) => normalized.includes(stripHeadingNoise(k)))) {
        foundIdx = i;
        break;
      }
    }

    if (foundIdx === -1) {
      for (let i = 0; i < sourceSections.length; i += 1) {
        if (!used.has(i)) {
          foundIdx = i;
          break;
        }
      }
    }

    if (foundIdx !== -1) {
      used.add(foundIdx);
      picked.push(cleanBodyFragment(sourceSections[foundIdx].body));
    } else {
      picked.push('');
    }
  }

  return picked.map((v, i) => (v && v.trim() ? v.trim() : DEFAULT_SECTIONS[i]));
}

function normalizeDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const text = String(value || '').trim();
  if (!text) return new Date().toISOString().slice(0, 10);
  const isoMatch = text.match(/\d{4}-\d{2}-\d{2}/);
  if (isoMatch) {
    return isoMatch[0];
  }
  return new Date().toISOString().slice(0, 10);
}

function buildFixedContent(fileName, data, rawBody) {
  const slug = fileName.replace(/\.md$/i, '');
  const existingImages = extractImages(rawBody);
  const images = Array.from({ length: 6 }, (_, i) => existingImages[i] || `https://picsum.photos/seed/${slug}-${i + 1}/1280/720`);
  const sections = buildFixedSections(rawBody);

  const title = normalizeTitle(data.title || '울산광역시 생활 정보 아시나요?');
  const summary = String(data.summary || '울산 시민을 위한 핵심 공공 정보를 정리했습니다.').trim();
  const category = String(data.category || '정보').trim();
  const tags = Array.isArray(data.tags) && data.tags.length > 0 ? data.tags : ['울산', category, '정보'];
  const date = normalizeDate(data.date);

  const newData = {
    ...data,
    title,
    date,
    summary,
    category,
    tags,
  };

  const body = [
    `![${IMAGE_LABELS[0]}](${images[0]})`,
    '',
    SECTION_TITLES[0],
    sections[0],
    '',
    `![${IMAGE_LABELS[1]}](${images[1]})`,
    '',
    SECTION_TITLES[1],
    sections[1],
    '',
    `![${IMAGE_LABELS[2]}](${images[2]})`,
    '',
    SECTION_TITLES[2],
    sections[2],
    '',
    `![${IMAGE_LABELS[3]}](${images[3]})`,
    '',
    SECTION_TITLES[3],
    sections[3],
    '',
    `![${IMAGE_LABELS[4]}](${images[4]})`,
    '',
    SECTION_TITLES[4],
    sections[4],
    '',
    `![${IMAGE_LABELS[5]}](${images[5]})`,
    '',
    '---',
    '',
    '**하단 문구**',
    '*본 정보는 울산광역시 및 공공데이터를 참고하여 정리한 콘텐츠입니다.*',
  ].join('\n');

  return matter.stringify(body, newData);
}

function main() {
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));

  for (const file of files) {
    const fullPath = path.join(POSTS_DIR, file);
    const raw = fs.readFileSync(fullPath, 'utf-8');
    const parsed = matter(raw);
    const rewritten = buildFixedContent(file, parsed.data || {}, parsed.content || '');
    fs.writeFileSync(fullPath, rewritten, 'utf-8');
  }

  console.log(`Normalized ${files.length} posts to fixed template.`);
}

main();
