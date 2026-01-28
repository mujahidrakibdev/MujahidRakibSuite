import React, { useState } from 'react';
import { Github, Twitter, Globe, Terminal } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { YouTubeScraper } from './tools/YouTubeScraper';
import { ElevenLabsTool } from './tools/ElevenLabsTool';

type View = 'home' | 'transcript' | 'analysis' | 'elevenlabs';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');

  // Full screen tool check
  const isFullScreenTool = currentView === 'elevenlabs';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 relative flex flex-col">
      
      {/* Background Glow Effects - Persistent (Hidden in full screen tools) */}
      {!isFullScreenTool && (
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] animate-blob mix-blend-screen"></div>
            <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-screen"></div>
            <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[100px] animate-blob animation-delay-4000 mix-blend-screen"></div>
        </div>
      )}

      {/* Main Layout Content */}
      <main className={`relative z-10 flex-grow w-full flex flex-col ${isFullScreenTool ? '' : 'max-w-7xl mx-auto px-6 py-6'}`}>
        
        {/* Top Bar with Brand (Only visible on home) */}
        {currentView === 'home' && (
          <div className="flex items-center justify-between mb-8 pb-4 animate-fade-in">
             <div className="flex items-center gap-2 select-none opacity-90 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-3">
                    {/* Colorful Logo Icon Container */}
                    <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-2 rounded-lg border border-indigo-400/30 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                        <Terminal className="w-5 h-5 text-white fill-white/20" strokeWidth={2.5} />
                    </div>
                    {/* Restored Space Grotesk Font for Logo */}
                    <h1 className="text-xl font-bold tracking-tight font-['Space_Grotesk']">
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

        {/* ElevenLabs Tool rendered here but manages its own layout (fixed overlay) */}
        {currentView === 'elevenlabs' && (
          <ElevenLabsTool onBack={() => setCurrentView('home')} />
        )}
        
      </main>

      {/* Professional Footer (Hidden in full screen tools) */}
      {!isFullScreenTool && (
        <footer className="relative z-10 border-t border-slate-800/40 bg-slate-950/30 backdrop-blur-md mt-auto">
            <div className="max-w-6xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-gradient-to-br from-slate-800 to-slate-700 p-1.5 rounded-lg border border-slate-600/50">
                                <Terminal className="w-4 h-4 text-indigo-400 fill-indigo-500/20" />
                            </div>
                            {/* Restored Space Grotesk Font for Footer Logo */}
                            <h1 className="text-lg font-bold tracking-tight font-['Space_Grotesk']">
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
      )}
    </div>
  );
};

export default App;