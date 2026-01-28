import React from 'react';
import { Mic, Layout, FileText, TrendingUp, Sparkles } from 'lucide-react';

interface DashboardProps {
  onSelectTool: (tool: 'transcript' | 'analysis' | 'elevenlabs') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectTool }) => {
  return (
    <div className="w-full animate-fade-in py-10">
       <div className="text-center mb-16 space-y-4">
           {/* Unique Professional Hero Title */}
           <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-2">
              <span className="text-white font-sans italic">Mujahid</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-violet-400 font-mono">Rakib</span>
              <span className="text-slate-600 text-3xl md:text-4xl font-light ml-3 font-sans">Suite</span>
           </h1>
           <p className="text-slate-400 text-lg max-w-xl mx-auto font-medium">
              Professional automation workspace for data extraction, deep analytics, and AI voice generation.
           </p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
           
           {/* Tool 1: YouTube Transcriptor */}
           <div 
             onClick={() => onSelectTool('transcript')}
             className="group relative h-full bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-[2rem] p-8 cursor-pointer overflow-hidden transition-all duration-500 hover:shadow-[0_0_50px_-12px_rgba(99,102,241,0.3)] hover:-translate-y-2 flex flex-col"
           >
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-slate-900/50 to-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -right-10 -top-10 bg-indigo-500/20 w-40 h-40 blur-3xl rounded-full group-hover:bg-indigo-500/30 transition-all duration-500" />
              
              <div className="relative z-10 flex flex-col h-full">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 group-hover:border-indigo-400/50 group-hover:bg-indigo-500 shadow-lg transition-all duration-500 mb-6 group-hover:scale-110">
                      <FileText className="text-indigo-400 group-hover:text-white transition-colors duration-500" size={32} />
                  </div>
                  
                  <div className="flex-grow space-y-3">
                      <h3 className="text-2xl font-bold text-white group-hover:text-indigo-200 transition-colors">YouTube Transcriptor</h3>
                      <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">
                          Extract transcripts, metadata, and tags in bulk. Supports various formats and high-volume processing.
                      </p>
                  </div>
                  
                  {/* Visual Indicator */}
                  <div className="mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-500/50 group-hover:text-indigo-400 transition-colors">
                      <Sparkles size={12} /> Data Extraction
                  </div>
              </div>
           </div>

           {/* Tool 2: YouTube Analytics */}
           <div 
             onClick={() => onSelectTool('analysis')}
             className="group relative h-full bg-slate-900 border border-slate-800 hover:border-emerald-500 rounded-[2rem] p-8 cursor-pointer overflow-hidden transition-all duration-500 hover:shadow-[0_0_50px_-12px_rgba(16,185,129,0.3)] hover:-translate-y-2 flex flex-col"
           >
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-slate-900/50 to-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -right-10 -top-10 bg-emerald-500/20 w-40 h-40 blur-3xl rounded-full group-hover:bg-emerald-500/30 transition-all duration-500" />
              
              <div className="relative z-10 flex flex-col h-full">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 group-hover:border-emerald-400/50 group-hover:bg-emerald-500 shadow-lg transition-all duration-500 mb-6 group-hover:scale-110">
                      <TrendingUp className="text-emerald-400 group-hover:text-white transition-colors duration-500" size={32} />
                  </div>
                  
                  <div className="flex-grow space-y-3">
                      <h3 className="text-2xl font-bold text-white group-hover:text-emerald-200 transition-colors">YouTube Analytics</h3>
                      <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">
                          Rank videos by virality score. Calculate deep engagement metrics and performance potential.
                      </p>
                  </div>

                  {/* Visual Indicator */}
                  <div className="mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-500/50 group-hover:text-emerald-400 transition-colors">
                      <Sparkles size={12} /> Intelligence
                  </div>
              </div>
           </div>

           {/* Tool 3: ElevenLabs Automation */}
           <div 
             onClick={() => onSelectTool('elevenlabs')}
             className="group relative h-full bg-slate-900 border border-slate-800 hover:border-violet-500 rounded-[2rem] p-8 cursor-pointer overflow-hidden transition-all duration-500 hover:shadow-[0_0_50px_-12px_rgba(139,92,246,0.3)] hover:-translate-y-2 flex flex-col"
           >
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-slate-900/50 to-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -right-10 -top-10 bg-violet-500/20 w-40 h-40 blur-3xl rounded-full group-hover:bg-violet-500/30 transition-all duration-500" />
              
              <div className="relative z-10 flex flex-col h-full">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 group-hover:border-violet-400/50 group-hover:bg-violet-500 shadow-lg transition-all duration-500 mb-6 group-hover:scale-110">
                      <Mic className="text-violet-400 group-hover:text-white transition-colors duration-500" size={32} />
                  </div>
                  
                  <div className="flex-grow space-y-3">
                      <h3 className="text-2xl font-bold text-white group-hover:text-violet-200 transition-colors">ElevenLabs Automation</h3>
                      <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">
                          Automate text-to-speech workflows. Generate high-fidelity AI audio with precision controls.
                      </p>
                  </div>

                  {/* Visual Indicator */}
                  <div className="mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-500/50 group-hover:text-violet-400 transition-colors">
                      <Sparkles size={12} /> Generative AI
                  </div>
              </div>
           </div>

       </div>
       
       <div className="mt-16 text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900/50 border border-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                <Layout size={14} />
                <span>More automation tools coming soon</span>
            </div>
       </div>
    </div>
  );
};