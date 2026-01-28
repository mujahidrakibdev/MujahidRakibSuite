import React, { useState } from 'react';
import { Github, Twitter, Globe, Terminal } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { YouTubeScraper } from './tools/YouTubeScraper';
import { ElevenLabsTool } from './tools/ElevenLabsTool';

type View = 'home' | 'transcript' | 'analysis' | 'elevenlabs';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 relative flex flex-col">
      
      {/* Background Glow Effects - Persistent */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] animate-blob mix-blend-screen"></div>
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[100px] animate-blob animation-delay-4000 mix-blend-screen"></div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6 relative z-10 flex-grow w-full flex flex-col">
        
        {/* Top Bar with Brand (Only visible on home) */}
        {currentView === 'home' && (
          <div className="flex items-center justify-between mb-8 pb-4">
             <div className="flex items-center gap-2 select-none opacity-80 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1">
                    <Terminal className="w-5 h-5 text-indigo-500 mr-2" />
                    <h1 className="text-xl font-black italic tracking-tighter">
                        <span className="text-white">Mujahid</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Rakib</span>
                    </h1>
                </div>
             </div>
             <div className="flex gap-4">
                 {/* Socials or Links placeholder */}
             </div>
          </div>
        )}

        {/* View Router */}
        {currentView === 'home' && (
          <Dashboard onSelectTool={setCurrentView} />
        )}
        
        {currentView === 'transcript' && (
          <YouTubeScraper onBack={() => setCurrentView('home')} toolType="transcript" />
        )}

        {currentView === 'analysis' && (
          <YouTubeScraper onBack={() => setCurrentView('home')} toolType="analysis" />
        )}

        {currentView === 'elevenlabs' && (
          <ElevenLabsTool onBack={() => setCurrentView('home')} />
        )}
        
      </main>

      {/* Professional Footer */}
      <footer className="relative z-10 border-t border-slate-800/40 bg-slate-950/30 backdrop-blur-md mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Terminal className="w-5 h-5 text-indigo-500" />
                         <h1 className="text-lg font-black italic tracking-tighter">
                            <span className="text-white">Mujahid</span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Rakib</span>
                        </h1>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                        A professional-grade tool suite for researchers, creators, and data scientists.
                    </p>
                </div>
                <div className="flex flex-col gap-2">
                    <h3 className="font-semibold text-slate-300 mb-2">Resources</h3>
                    <a href="#" className="text-sm text-slate-500 hover:text-indigo-400 transition-colors w-fit">Documentation</a>
                    <a href="#" className="text-sm text-slate-500 hover:text-indigo-400 transition-colors w-fit">API Reference</a>
                </div>
                <div className="flex flex-col gap-2">
                    <h3 className="font-semibold text-slate-300 mb-2">Connect</h3>
                    <div className="flex items-center gap-4">
                        <a href="#" className="text-slate-500 hover:text-white transition-colors"><Github size={20} /></a>
                        <a href="#" className="text-slate-500 hover:text-blue-400 transition-colors"><Twitter size={20} /></a>
                        <a href="#" className="text-slate-500 hover:text-indigo-400 transition-colors"><Globe size={20} /></a>
                    </div>
                </div>
            </div>
            <div className="border-t border-slate-800/50 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600">
                <span>© {new Date().getFullYear()} MujahidRakib. All rights reserved.</span>
                <span className="flex items-center gap-1.5">
                   Built with ❤️ by 
                   <span className="text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)] font-extrabold tracking-wide">Mujahid</span>
                </span>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;