import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // 정적 HTML로 내보내기 (HTML/CSS/JS 파일 형태로 만듦)
  images: {
    unoptimized: true, // 이미지 최적화 기능 끄기 (Cloudflare 배포 시 필요)
  },
  trailingSlash: true, // 주소 끝에 빗금(/) 붙이기 규칙 (Cloudflare 정적 호스팅 폴더 기반 서빙 최적화를 위해 원복)
};

export default nextConfig;
