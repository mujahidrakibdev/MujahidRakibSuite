import React, { useState, useEffect } from 'react';
import { Settings, X, CheckCircle2, Youtube, Key, Zap, RotateCcw, ExternalLink } from 'lucide-react';
import { TranscriptProvider } from '../types';

interface ApiKeyManagerProps {
  youtubeApiKey: string;
  setYoutubeApiKey: (key: string) => void;
  rapidApiKey: string;
  setRapidApiKey: (key: string) => void;
  supadataApiKey: string;
  setSupadataApiKey: (key: string) => void;
  transcriptProvider: TranscriptProvider;
  setTranscriptProvider: (provider: TranscriptProvider) => void;
  // Usage props
  supadataUsage: number;
  setSupadataUsage: (val: number) => void;
  rapidApiUsage: number;
  setRapidApiUsage: (val: number) => void;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ 
  youtubeApiKey, 
  setYoutubeApiKey,
  rapidApiKey,
  setRapidApiKey,
  supadataApiKey,
  setSupadataApiKey,
  transcriptProvider,
  setTranscriptProvider,
  supadataUsage,
  setSupadataUsage,
  rapidApiUsage,
  setRapidApiUsage
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Local state for inputs
  const [ytInput, setYtInput] = useState('');
  const [rapidInput, setRapidInput] = useState('');
  const [supadataInput, setSupadataInput] = useState('');

  // Local state for usage inputs
  const [localSupadataUsage, setLocalSupadataUsage] = useState(supadataUsage);
  const [localRapidUsage, setLocalRapidUsage] = useState(rapidApiUsage);

  // Helper to mask key
  const maskKey = (key: string) => {
    if (!key || key.length < 8) return '';
    return `••••••••${key.slice(-4)}`;
  };

  // Sync props to local state when opening or when props change
  useEffect(() => {
    setYtInput(maskKey(youtubeApiKey));
    setRapidInput(maskKey(rapidApiKey));
    setSupadataInput(maskKey(supadataApiKey));
    setLocalSupadataUsage(supadataUsage);
    setLocalRapidUsage(rapidApiUsage);
  }, [youtubeApiKey, rapidApiKey, supadataApiKey, supadataUsage, rapidApiUsage, isOpen]);

  const handleSave = () => {
    const newYtKey = ytInput.startsWith('••••') ? youtubeApiKey : ytInput.trim();
    if (newYtKey !== youtubeApiKey) setYoutubeApiKey(newYtKey);

    const newRapidKey = rapidInput.startsWith('••••') ? rapidApiKey : rapidInput.trim();
    if (newRapidKey !== rapidApiKey) setRapidApiKey(newRapidKey);

    const newSupadataKey = supadataInput.startsWith('••••') ? supadataApiKey : supadataInput.trim();
    if (newSupadataKey !== supadataApiKey) setSupadataApiKey(newSupadataKey);

    // Save Usage Counts
    setSupadataUsage(Math.min(100, Math.max(0, localSupadataUsage)));
    setRapidApiUsage(Math.min(20, Math.max(0, localRapidUsage)));

    setIsOpen(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };
  
  const handleFocus = (
    e: React.FocusEvent<HTMLInputElement>, 
    originalKey: string, 
    setter: (val: string) => void
  ) => {
    if (e.target.value.startsWith('••••')) {
      setter(''); 
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement>,
    originalKey: string,
    setter: (val: string) => void
  ) => {
    if (!e.target.value.trim() && originalKey) {
       setter(maskKey(originalKey));
    }
  };

  // Determine if the currently selected provider is actually active (has a key)
  const isProviderActive = transcriptProvider === 'supadata' ? !!supadataApiKey : !!rapidApiKey;

  return (
    <>
      {/* Trigger & Status Display in Header */}
      <div className="flex items-center gap-2">
        
        {/* API Status Indicators (Simplified) */}
        <div className="hidden md:flex items-center gap-4 bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-800/60 backdrop-blur-sm mr-2">
           {/* YouTube Status */}
           <div className="flex items-center gap-2" title={youtubeApiKey ? "YouTube API Connected" : "YouTube API Missing"}>
             <Youtube size={18} className={youtubeApiKey ? "text-red-500" : "text-slate-600"} />
             <div className={`w-1.5 h-1.5 rounded-full ${youtubeApiKey ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-slate-700"}`}></div>
           </div>
           
           <div className="h-4 w-[1px] bg-slate-700 mx-1"></div>
           
           {/* Provider Status (Icon Only) */}
           <div className="flex items-center gap-2" title={`Selected: ${transcriptProvider === 'supadata' ? 'Supadata' : 'RapidAPI'} (${isProviderActive ? 'Active' : 'No Key'})`}>
             {transcriptProvider === 'supadata' ? (
                <Zap size={18} className={isProviderActive ? "text-yellow-400" : "text-slate-600"} />
             ) : (
                <Key size={18} className={isProviderActive ? "text-blue-400" : "text-slate-600"} />
             )}
              <div className={`w-1.5 h-1.5 rounded-full ${isProviderActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-slate-700"}`}></div>
           </div>
        </div>

        {/* Settings Button */}
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 group"
          title="Configure API Keys"
        >
          <Settings size={20} className="group-hover:rotate-45 transition-transform duration-500" />
        </button>
      </div>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsOpen(false)}></div>
          
          <div className="relative bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden p-0 animate-fade-in">
             
             {/* Modal Header */}
             <div className="bg-slate-950/50 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                   <Settings size={18} className="text-indigo-500" />
                   API Configuration
                </h3>
                <button 
                   onClick={() => setIsOpen(false)}
                   className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                   <X size={20} />
                </button>
             </div>

             {/* Modal Content */}
             <div className="p-6 space-y-6">
                
                {/* 1. YouTube API Input */}
                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <Youtube size={16} className="text-red-500" />
                        YouTube Data API V3
                      </label>
                      {youtubeApiKey && <CheckCircle2 size={16} className="text-emerald-500" />}
                   </div>
                   <input 
                      type="text" 
                      value={ytInput}
                      onChange={(e) => setYtInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={(e) => handleFocus(e, youtubeApiKey, setYtInput)}
                      onBlur={(e) => handleBlur(e, youtubeApiKey, setYtInput)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder:text-slate-700 font-mono transition-all"
                      placeholder="Paste your AIzaSy... key here"
                   />
                   <div className="flex justify-between items-center">
                     <p className="text-xs text-slate-500">Required for fetching video metadata.</p>
                     <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noreferrer" className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                        Get API Key <ExternalLink size={10} />
                     </a>
                   </div>
                </div>

                <div className="h-[1px] bg-slate-800 w-full my-4"></div>

                {/* 2. Transcription Service Provider Selection */}
                <div className="space-y-3">
                   <label className="text-sm font-semibold text-slate-300 block">Transcription Service</label>
                   
                   {/* Compact Row for Selection */}
                   <div className="flex gap-3">
                      <button
                        onClick={() => setTranscriptProvider('supadata')}
                        className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-2 ${transcriptProvider === 'supadata' ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-inner' : 'bg-slate-950 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                      >
                         <Zap size={14} className={transcriptProvider === 'supadata' ? 'text-yellow-400' : 'text-slate-500'} />
                         Supadata AI (Default)
                      </button>

                      <button
                        onClick={() => setTranscriptProvider('rapid-api')}
                        className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-2 ${transcriptProvider === 'rapid-api' ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-inner' : 'bg-slate-950 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                      >
                         <Key size={14} className={transcriptProvider === 'rapid-api' ? 'text-blue-400' : 'text-slate-500'} />
                         RapidAPI (Veritoolz)
                      </button>
                   </div>
                </div>

                {/* 3. Provider API Key & Usage Inputs */}
                {transcriptProvider === 'supadata' && (
                    <div className="space-y-4 animate-fade-in bg-slate-950/30 p-4 rounded-xl border border-slate-800">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                    <Zap size={16} className="text-yellow-500" />
                                    Supadata API Key
                                </label>
                                {supadataApiKey && <CheckCircle2 size={16} className="text-emerald-500" />}
                            </div>
                            <input 
                                type="text" 
                                value={supadataInput}
                                onChange={(e) => setSupadataInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={(e) => handleFocus(e, supadataApiKey, setSupadataInput)}
                                onBlur={(e) => handleBlur(e, supadataApiKey, setSupadataInput)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none placeholder:text-slate-700 font-mono transition-all"
                                placeholder="Paste your Supadata key here"
                            />
                            <div className="flex justify-end">
                                <a href="https://supadata.ai" target="_blank" rel="noreferrer" className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                    Get API Key from Supadata.ai <ExternalLink size={10} />
                                </a>
                            </div>
                        </div>

                        {/* Minimal Side-by-Side Usage Counter */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
                             <div className="flex flex-col">
                                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                                    <RotateCcw size={12} /> Current Usage
                                </label>
                                <span className="text-[10px] text-slate-600">Manual Sync</span>
                             </div>
                             <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5">
                                <input 
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={localSupadataUsage}
                                    onChange={(e) => setLocalSupadataUsage(parseInt(e.target.value) || 0)}
                                    className="w-12 bg-transparent text-right text-sm text-slate-200 outline-none font-mono focus:text-yellow-400"
                                />
                                <span className="text-xs text-slate-500 font-medium">/ 100</span>
                             </div>
                        </div>
                    </div>
                )}

                {transcriptProvider === 'rapid-api' && (
                    <div className="space-y-4 animate-fade-in bg-slate-950/30 p-4 rounded-xl border border-slate-800">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                    <Key size={16} className="text-blue-500" />
                                    RapidAPI Key (Veritoolz)
                                </label>
                                {rapidApiKey && <CheckCircle2 size={16} className="text-emerald-500" />}
                            </div>
                            <input 
                                type="text" 
                                value={rapidInput}
                                onChange={(e) => setRapidInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={(e) => handleFocus(e, rapidApiKey, setRapidInput)}
                                onBlur={(e) => handleBlur(e, rapidApiKey, setRapidInput)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder:text-slate-700 font-mono transition-all"
                                placeholder="Paste your RapidAPI key here"
                            />
                            <div className="flex justify-end">
                                <a href="https://rapidapi.com/veritoolz/api/youtube-transcripts" target="_blank" rel="noreferrer" className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                    Get API Key from RapidAPI <ExternalLink size={10} />
                                </a>
                            </div>
                        </div>

                         {/* Minimal Side-by-Side Usage Counter */}
                         <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
                             <div className="flex flex-col">
                                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                                    <RotateCcw size={12} /> Current Usage
                                </label>
                                <span className="text-[10px] text-slate-600">Manual Sync</span>
                             </div>
                             <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5">
                                <input 
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={localRapidUsage}
                                    onChange={(e) => setLocalRapidUsage(parseInt(e.target.value) || 0)}
                                    className="w-12 bg-transparent text-right text-sm text-slate-200 outline-none font-mono focus:text-blue-400"
                                />
                                <span className="text-xs text-slate-500 font-medium">/ 20</span>
                             </div>
                        </div>
                    </div>
                )}
             </div>

             {/* Modal Footer */}
             <div className="px-6 py-4 bg-slate-950/30 border-t border-slate-800 flex justify-end">
                <button 
                  onClick={handleSave}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-900/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  Save Configuration
                </button>
             </div>
          </div>
        </div>
      )}
    </>
  );
};