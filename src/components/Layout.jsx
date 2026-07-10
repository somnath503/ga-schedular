// import { Link, useLocation, useNavigate } from 'react-router-dom';
// import { Calendar, LayoutDashboard, ArrowLeft } from 'lucide-react';
// import { useState, useEffect } from 'react';
// import { Download } from 'lucide-react'; 
// export default function Layout({ children }) {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [scrollProgress, setScrollProgress] = useState(0);

//   const isHome = location.pathname === '/';

//   const [deferredPrompt, setDeferredPrompt] = useState(null);

//   useEffect(() => {
//     window.addEventListener('beforeinstallprompt', (e) => {
//       e.preventDefault();
//       setDeferredPrompt(e);
//     });
//   }, []);

//   const handleInstall = () => {
//     if (deferredPrompt) {
//       deferredPrompt.prompt();
//       deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
//     }
//   };


//   // Calculate scroll progress for the animated top bar
//   useEffect(() => {
//     const handleScroll = () => {
//       const totalScroll = document.documentElement.scrollTop;
//       const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
//       const scroll = `${totalScroll / windowHeight}`;
//       setScrollProgress(scroll);
//     };

//     window.addEventListener('scroll', handleScroll);
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, []);

//   return (
//     <div className="min-h-screen flex flex-col font-sans relative">
//       {/* Animated Scroll Progress Bar */}
//       <div 
//         className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 z-[60] transition-all duration-150 ease-out"
//         style={{ width: `${scrollProgress * 100}%` }}
//       />

//       <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm mt-1">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
//           <div className="flex items-center space-x-6">
//             {!isHome && (
//               <button 
//                 onClick={() => navigate(-1)}
//                 className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
//                 aria-label="Go back"
//               >
//                 <ArrowLeft className="w-5 h-5" />
//               </button>
//             )}
//             <Link to="/" className="flex items-center space-x-2 text-blue-600 hover:opacity-80 transition">
//               <Calendar className="w-7 h-7" />
//               <span className="font-extrabold text-xl tracking-tight text-slate-800">GA Scheduler</span>
//             </Link>
//           </div>
          
//           <nav className="flex space-x-6 items-center">
//             {deferredPrompt && (
//               <button 
//                 onClick={handleInstall}
//                 className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-blue-700 bg-blue-50 px-2.5 sm:px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition shadow-sm"
//               >
//                 <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
//                 <span className="hidden sm:inline">Install App</span>
//                 <span className="sm:hidden">Install</span>
//               </button>
//             )}``
//             <Link 
//               to="/config" 
//               className={`text-sm font-semibold flex items-center space-x-1 ${location.pathname === '/config' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'} transition-colors`}
//             >
//               <LayoutDashboard className="w-4 h-4" />
//               <span>Workspace</span>
//             </Link>
//           </nav>
          

//         </div>
//       </header>
//       <main className="flex-1 w-full relative">
//         {children}
//       </main>
//     </div>
//   );
// }

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, LayoutDashboard, ArrowLeft, Download } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);

  const isHome = location.pathname === '/';

  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
    }
  };

  // Calculate scroll progress for the animated top bar
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = `${totalScroll / windowHeight}`;
      setScrollProgress(scroll);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      {/* Animated Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 z-[60] transition-all duration-150 ease-out"
        style={{ width: `${scrollProgress * 100}%` }}
      />

      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm mt-1">
        {/* Adjusted to handle extreme portrait views */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          
          {/* LEFT SIDE: Logo & Back Button (Flex-1 ensures it takes available space and truncates if needed) */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 overflow-hidden">
            {!isHome && (
              <button 
                onClick={() => navigate(-1)}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition shrink-0"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <Link to="/" className="flex items-center gap-1.5 sm:gap-2 text-blue-600 hover:opacity-80 transition min-w-0">
              <Calendar className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" />
              {/* Truncate ensures long text gets ... on tiny screens */}
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-800 truncate">
                GA Scheduler
              </span>
            </Link>
          </div>
          
          {/* RIGHT SIDE: Navigation & Install Button */}
          <nav className="flex items-center gap-3 sm:gap-6 shrink-0">
            
            {/* Install Button */}
            {deferredPrompt && (
              <button 
                onClick={handleInstall}
                className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-blue-100 transition shadow-sm shrink-0 active:scale-95 whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 shrink-0" /> 
                <span>Install<span className="hidden sm:inline"> App</span></span>
              </button>
            )}
            
            {/* Workspace Button */}
            <Link 
              to="/config" 
              className={`text-xs sm:text-sm font-semibold flex items-center gap-1.5 shrink-0 ${location.pathname === '/config' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'} transition-colors whitespace-nowrap`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {/* Hide the word "Workspace" on portrait mobile to save space, show icon only */}
              <span className="hidden sm:inline">Workspace</span>
            </Link>

          </nav>

        </div>
      </header>
      <main className="flex-1 w-full relative">
        {children}
      </main>
    </div>
  );
}