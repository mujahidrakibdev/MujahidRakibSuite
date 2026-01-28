import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mic, Play, Download, Settings, Loader2, Music, Check, Copy, RefreshCw, AlertCircle, Sparkles, Wand2 } from 'lucide-react';
import { fetchVoices, generateAudio, Voice } from '../services/elevenLabsService';

interface ElevenLabsToolProps {
  onBack: () => void;
}

interface GeneratedAudio {
  id: string;
  text: string;
  voiceName: string;
  url: string;
  createdAt: string;
}

export const ElevenLabsTool: React.FC<ElevenLabsToolProps> = ({ onBack }) => {
  const [apiKey, setApiKey] = useState('');
  const [text, setText] = useState('');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [stability, setStability] = useState(0.5);
  const [similarity, setSimilarity] = useState(0.75);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedAudio[]>([]);

  useEffect(() => {
    const key = localStorage.getItem('elevenlabs_api_key');
    if (key) {
      setApiKey(key);
      loadVoices(key);
    }
  }, []);

  const loadVoices = async (key: string) => {
    setLoading(true);
    try {
      const v = await fetchVoices(key);
      setVoices(v);
      if (v.length > 0) setSelectedVoice(v[0].voice_id);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeySave = () => {
    localStorage.setItem('elevenlabs_api_key', apiKey);
    loadVoices(apiKey);
  };

  const handleGenerate = async () => {
    if (!text || !selectedVoice || !apiKey) return;
    setGenerating(true);
    setError(null);
    try {
      const blob = await generateAudio(text, selectedVoice, apiKey, stability, similarity);
      const url = URL.createObjectURL(blob);
      const voiceName = voices.find(v => v.voice_id === selectedVoice)?.name || 'Unknown Voice';
      
      const newItem: GeneratedAudio = {
        id: Date.now().toString(),
        text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        voiceName,
        url,
        createdAt: new Date().toLocaleTimeString(),
      };
      
      setHistory(prev => [newItem, ...prev]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="w-full animate-fade-in">
       {/* Header */}
       <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800/40">
           <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white transition-all"
                title="Back to Dashboard"
              >
                  <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-3 select-none">
                  <div className="bg-gradient-to-br from-violet-600 to-purple-600 p-2.5 rounded-2xl shadow-lg shadow-violet-500/20">
                      <Mic className="w-6 h-6 text-white" />
                  </div>
                  <div>
                      <h1 className="text-xl font-bold text-white leading-none">ElevenLabs Automation</h1>
                      <span className="text-xs font-medium text-violet-400 tracking-wide">AI Text-to-Speech Studio</span>
                  </div>
              </div>
           </div>
           
           {/* API Input */}
           <div className="flex items-center gap-2">
              <input 
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter ElevenLabs API Key"
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 w-48 transition-all"
              />
              <button 
                onClick={handleApiKeySave}
                className="bg-violet-600 hover:bg-violet-500 text-white p-2 rounded-lg transition-colors shadow-lg shadow-violet-500/20"
              >
                <Check size={16} />
              </button>
           </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls Panel */}
          <div className="lg:col-span-2 space-y-6">
             <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-700/50 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden ring-1 ring-white/5 hover:border-violet-500/20 transition-all duration-500">
                {/* Lighting Effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent pointer-events-none opacity-50" />
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-violet-500/20 blur-3xl rounded-full pointer-events-none" />
                
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Voice Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300">Voice Model</label>
                        <div className="relative">
                            <select 
                              value={selectedVoice}
                              onChange={(e) => setSelectedVoice(e.target.value)}
                              disabled={loading}
                              className="w-full bg-slate-950/50 border border-slate-700/80 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/50 appearance-none transition-all shadow-inner"
                            >
                                {loading ? <option>Loading voices...</option> : voices.map(v => (
                                    <option key={v.voice_id} value={v.voice_id}>{v.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-violet-400">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <ChevronDown size={16} />}
                            </div>
                        </div>
                    </div>

                    {/* Settings - Stability */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-slate-400 font-medium">
                                <span>Stability</span>
                                <span className="text-violet-400">{Math.round(stability * 100)}%</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" max="1" step="0.01" 
                                value={stability} 
                                onChange={(e) => setStability(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                            />
                        </div>
                         <div className="space-y-1">
                            <div className="flex justify-between text-xs text-slate-400 font-medium">
                                <span>Similarity Boost</span>
                                <span className="text-violet-400">{Math.round(similarity * 100)}%</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" max="1" step="0.01" 
                                value={similarity} 
                                onChange={(e) => setSimilarity(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Text Input */}
                <div className="space-y-2 relative z-10">
                    <label className="text-sm font-semibold text-slate-300">Script Text</label>
                    <textarea 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type something to generate speech..."
                        className="w-full h-40 bg-slate-950/50 border border-slate-700/80 rounded-2xl p-4 text-slate-200 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all resize-y font-mono text-sm placeholder:text-slate-600 shadow-inner custom-scrollbar"
                    />
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2 relative z-10 animate-shake">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {/* Action Button */}
                <div className="mt-6 relative z-10">
                    <button
                        onClick={handleGenerate}
                        disabled={generating || !text || !apiKey}
                        className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer group overflow-hidden relative ${
                            generating || !text || !apiKey
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:scale-[1.01] active:scale-[0.99] shadow-violet-900/30 hover:shadow-violet-600/40'
                        }`}
                    >
                        {generating ? (
                            <><Loader2 className="animate-spin" /> Generating Audio...</>
                        ) : (
                            <>
                              <span className="relative z-10 flex items-center gap-2">
                                <Wand2 size={20} /> Generate Speech
                              </span>
                              <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                            </>
                        )}
                    </button>
                </div>
             </div>
          </div>

          {/* History Panel */}
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2rem] p-6 h-fit max-h-[600px] flex flex-col hover:border-violet-500/20 transition-colors duration-500">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Music size={18} className="text-violet-400" /> Recent Generations
              </h3>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                  {history.length === 0 ? (
                      <div className="text-center py-10 text-slate-500 italic text-sm">
                          No audio generated yet.
                      </div>
                  ) : (
                      history.map((item) => (
                          <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 hover:border-violet-500/30 transition-colors group">
                              <div className="flex justify-between items-start mb-2">
                                  <div>
                                      <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                          <Sparkles size={10} className="text-violet-500" />
                                          {item.voiceName}
                                      </div>
                                      <div className="text-[10px] text-slate-500 pl-4">{item.createdAt}</div>
                                  </div>
                                  <a 
                                    href={item.url} 
                                    download={`audio-${item.id}.mp3`}
                                    className="p-1.5 bg-slate-800 hover:bg-violet-600 text-slate-400 hover:text-white rounded-lg transition-colors"
                                  >
                                      <Download size={14} />
                                  </a>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-2 mb-2 italic pl-4 border-l-2 border-slate-800">"{item.text}"</p>
                              <audio controls src={item.url} className="w-full h-8 opacity-70 group-hover:opacity-100 transition-opacity accent-violet-500" />
                          </div>
                      ))
                  )}
              </div>
          </div>
       </div>
    </div>
  );
};

// Simple ChevronDown component for select
const ChevronDown: React.FC<{ size?: number }> = ({ size = 24 }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6"/>
    </svg>
);