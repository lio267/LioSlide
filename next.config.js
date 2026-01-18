/** @type {import('next').NextConfig} */
const nextConfig = {
  // 서버 컴포넌트에서 사용할 외부 패키지
  serverExternalPackages: ['pptxgenjs'],
  // API 타임아웃 확장 (PPT 생성에 시간이 걸릴 수 있음)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
