import Link from 'next/link';
import { getAllPosts } from '../lib/posts';

export default function Home() {
  const latestPosts = getAllPosts().slice(0, 6); // 최신 글 6개 가져오기

  const shortcutCards = [
    { title: '복지 정보', icon: '💝', color: 'from-rose-400 to-pink-500', link: '/blog' },
    { title: '경제 정보', icon: '📈', color: 'from-amber-400 to-orange-500', link: '/blog' },
    { title: '행사·축제', icon: '🎉', color: 'from-blue-400 to-indigo-500', link: '/blog' },
    { title: '생활 정보', icon: '🏘️', color: 'from-emerald-400 to-teal-500', link: '/blog' },
    { title: '명소·관광', icon: '📸', color: 'from-violet-400 to-purple-500', link: '/blog' },
  ];

  // 현재 날짜 구하기 (업데이트 날짜 표시용)
  const getLocalDate = () => {
    const today = new Date();
    return `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200">
      {/* 1. 메인 비주얼 (Hero Section) */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-24 md:py-32 flex flex-col items-center justify-center text-center px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 opacity-95"></div>
        {/* Subtle decorative background blur */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-6">
          <div className="inline-block bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium text-blue-200 mb-2">
            실시간 업데이트
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200 drop-shadow-sm leading-tight break-keep">
            울산광역시 아시나요?
          </h1>
          <p className="text-lg md:text-2xl text-slate-300 font-medium max-w-2xl break-keep mt-2">
            복지·경제·행사·생활·관광 정보를 한눈에
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col gap-20 -mt-10 relative z-20">
        
        {/* 2. 바로가기 카드 (Shortcut Cards) */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {shortcutCards.map((card, idx) => (
              <Link
                key={idx}
                href={card.link}
                className="group relative bg-white border border-slate-200 rounded-3xl p-6 flex flex-col items-center text-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden"
              >
                {/* Hover gradient effect background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${card.color} text-3xl flex items-center justify-center shadow-inner mb-4 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  {card.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {card.title}
                </h3>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. 최신 글 노출 (Latest Posts) */}
        <section>
          <div className="flex justify-between items-end mb-10 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔥</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">최신 정보</h2>
            </div>
            <Link href="/blog" className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline transition-all hidden md:block">
              전체보기 →
            </Link>
          </div>

          {latestPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {latestPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col overflow-hidden group"
                >
                  <div className="p-8 flex flex-col h-full relative">
                    {/* Category standard */}
                    <div className="mb-5 flex justify-between items-center">
                       <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                         {post.category}
                       </span>
                       <span className="text-xs text-slate-400 font-medium">
                         {post.date}
                       </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug break-keep">
                      {post.title}
                    </h3>
                    
                    <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3 flex-grow break-keep">
                      {post.summary}
                    </p>

                    {/* Bottom simple divider / read more */}
                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center text-blue-600 font-semibold text-sm group-hover:gap-2 transition-all">
                      자세히 보기 <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
             <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
                <p className="text-slate-500 font-medium">아직 올라온 새로운 글이 없습니다. 곧 추가될 예정입니다!</p>
             </div>
          )}
          
          {/* Mobile view 'read more' */}
          <div className="mt-8 text-center md:hidden">
            <Link href="/blog" className="inline-block bg-slate-100 text-slate-700 font-bold py-3 px-6 rounded-xl hover:bg-slate-200 transition-colors w-full">
              최신 정보 전체보기
            </Link>
          </div>
        </section>

      </div>

      {/* 4. 푸터 영역 */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12 text-center px-6 text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4">
          <p className="text-2xl font-black text-white/90 tracking-widest">
            asinayo.org
          </p>
          <div className="flex gap-4 text-sm font-medium text-slate-500">
            <span>개인정보처리방침</span>
            <span>이용약관</span>
          </div>
          <p className="text-sm opacity-60">
            © {getLocalDate().split('년')[0]} 울산광역시 생활 정보, 아시나요?. All rights reserved. <br/>
            마지막 업데이트: {getLocalDate()}
          </p>
        </div>
      </footer>
    </main>
  );
}
