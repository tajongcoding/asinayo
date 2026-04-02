import Link from 'next/link';

export default function Header() {
  const menuItems = [
    { name: '홈', path: '/' },
    { name: '울산 아시나요', path: '/blog' },
    { name: '울산 복지 정보', path: '/blog' },
    { name: '울산 경제 정보', path: '/blog' },
    { name: '울산 행사·축제', path: '/blog' },
    { name: '울산 생활 정보', path: '/blog' },
    { name: '울산 명소·관광', path: '/blog' },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-md text-slate-800 border-b border-slate-200 sticky top-0 z-50 transition-all duration-300 shadow-sm">
      <div className="max-w-6xl mx-auto w-full px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Logo */}
        <Link href="/" className="font-extrabold text-2xl tracking-tight flex items-center gap-2 group">
          <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent group-hover:from-indigo-600 group-hover:to-blue-700 transition-all duration-500">
            asinayo.org
          </span>
        </Link>
        
        {/* Navigation */}
        <nav className="flex flex-wrap justify-center md:justify-end gap-x-5 gap-y-3 text-[15px] font-bold text-slate-600">
          {menuItems.map((item, idx) => (
            <Link 
              key={idx} 
              href={item.path} 
              className="hover:text-blue-600 hover:-translate-y-0.5 transition-all duration-300"
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
