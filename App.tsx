import React, { useState, useEffect, useRef } from 'react';
import { ApiKeyManager } from './components/ApiKeyManager';
import { ResultsTable } from './components/ResultsTable';
import { VideoData, ScrapeMode, VideoType } from './types';
import { fetchChannelVideos, fetchBatchVideos, extractVideoId, fetchTranscript } from './services/youtubeService';
import { Youtube, Layers, Film, Search, Loader2, AlertCircle, Minus, Plus, Terminal, ChevronDown, ChevronUp, Github, Twitter, Globe } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [youtubeApiKey, setYoutubeApiKey] = useState<string>('');
  const [rapidApiKey, setRapidApiKey] = useState<string>('');
  
  const [mode, setMode] = useState<ScrapeMode>('single-channel');
  const [input, setInput] = useState<string>('');
  const [videoType, setVideoType] = useState<VideoType>('video');
  const [limit, setLimit] = useState<number>(5);
  const [results, setResults] = useState<VideoData[]>([]);
  
  // Loading & Progress State
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);
  
  // Refs
  const logsEndRef = useRef<HTMLDivElement>(null);
  const consoleContainerRef = useRef<HTMLDivElement>(null);

  // Load API Keys from LocalStorage on mount
  useEffect(() => {
    const storedYtKey = localStorage.getItem('youtube_api_key');
    const storedRapidKey = localStorage.getItem('rapid_api_key');
    if (storedYtKey) setYoutubeApiKey(storedYtKey);
    if (storedRapidKey) setRapidApiKey(storedRapidKey);
  }, []);

  // Update LocalStorage when keys change
  const handleYoutubeKeyChange = (key: string) => {
    setYoutubeApiKey(key);
    localStorage.setItem('youtube_api_key', key);
  };

  const handleRapidKeyChange = (key: string) => {
    setRapidApiKey(key);
    localStorage.setItem('rapid_api_key', key);
  };

  // Auto-scroll console logs content (inner)
  useEffect(() => {
    if (logsEndRef.current && isConsoleOpen) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isConsoleOpen]);

  // Handle Scroll to Console Container when opening
  const toggleConsole = () => {
    setIsConsoleOpen(prev => {
      const newState = !prev;
      if (newState) {
        // Slight delay to allow render then scroll
        setTimeout(() => {
          consoleContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
      return newState;
    });
  };

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeApiKey) {
      setError("Please enter a YouTube Data API Key.");
      return;
    }
    if (!input.trim()) {
      setError("Please provide the required input.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setLogs([]);
    setProgress(5);
    setIsConsoleOpen(true);
    
    // Smooth scroll to console
    setTimeout(() => {
      consoleContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    
    addLog("Starting scrape process...");

    try {
      let metadataVideos: VideoData[] = [];

      // --- PHASE 1: Fetch Video Metadata ---
      addLog("PHASE 1: Fetching Video Metadata...");
      
      const onMetadataProgress = (msg: string) => {
        addLog(msg);
        setProgress(prev => Math.min(prev + 5, 50));
      };

      if (mode === 'single-channel') {
        addLog(`Mode: Single Channel. Target: ${input}`);
        setProgress(10);
        metadataVideos = await fetchChannelVideos(input, limit, videoType, youtubeApiKey, onMetadataProgress);
      } else if (mode === 'multi-channel') {
        addLog("Mode: Multi-Link Batch processing.");
        const urls = input.split(/[\n,]+/).map(u => u.trim()).filter(u => u.length > 0);
        if (urls.length === 0) throw new Error("No URLs provided.");
        addLog(`Found ${urls.length} raw input lines.`);
        setProgress(15);
        metadataVideos = await fetchBatchVideos(urls, youtubeApiKey, onMetadataProgress);
      } else if (mode === 'single-video') {
        addLog("Mode: Single Video analysis.");
        const id = extractVideoId(input);
        if (!id) throw new Error("Invalid Video URL format.");
        addLog(`Video ID extracted: ${id}`);
        setProgress(20);
        metadataVideos = await fetchBatchVideos([input], youtubeApiKey, (msg) => addLog(msg));
      }

      if (metadataVideos.length === 0) {
        throw new Error("No videos found matching your criteria.");
      }

      addLog(`Metadata acquired for ${metadataVideos.length} videos.`);
      setProgress(60);
      
      // Update results immediately so table shows metadata
      setResults(metadataVideos);

      // --- PHASE 2: Fetch Transcripts ---
      if (rapidApiKey) {
        addLog("PHASE 2: Fetching Transcripts via RapidAPI...");
        
        // We will update the results state item by item
        const updatedVideos = [...metadataVideos];

        for (let i = 0; i < updatedVideos.length; i++) {
          const video = updatedVideos[i];
          const itemLabel = `Video ${i + 1}/${updatedVideos.length}`;
          
          addLog(`${itemLabel}: Processing...`);
          
          // Delay to prevent rate limiting (500ms)
          if (i > 0) await new Promise(r => setTimeout(r, 500));

          const transcript = await fetchTranscript(video.id, rapidApiKey);
          
          const isError = transcript.startsWith("Error") || transcript.startsWith("API Error") || transcript.startsWith("Request Failed");
          
          if (isError) {
             // Remove 'Error:' prefix for cleaner log if present
             const cleanError = transcript.replace(/^Error:\s*/, '');
             addLog(`${itemLabel}: Failed - ${cleanError}`);
          } else {
             addLog(`${itemLabel}: Success`);
          }

          // Update the specific video in the list
          updatedVideos[i] = {
            ...video,
            transcript: transcript
          };

          // Trigger re-render with new data
          setResults([...updatedVideos]);

          // Calculate progress from 60 to 100 based on transcript fetching
          const percentComplete = 60 + Math.floor(((i + 1) / updatedVideos.length) * 40);
          setProgress(percentComplete);
        }
      } else {
        addLog("Skipping Phase 2: No RapidAPI Key provided. Transcripts will be empty.");
        setProgress(100);
      }

      addLog(`Success! Process complete.`);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
      addLog(`ERROR: ${err.message}`);
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) {
      setLimit(Math.min(50, Math.max(1, val)));
    } else {
      setLimit(1);
    }
  };

  const incrementLimit = () => setLimit(prev => Math.min(50, prev + 1));
  const decrementLimit = () => setLimit(prev => Math.max(1, prev - 1));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 relative flex flex-col">
      
      {/* Background Glow Effects */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] animate-blob mix-blend-screen"></div>
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[100px] animate-blob animation-delay-4000 mix-blend-screen"></div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-6 relative z-10 flex-grow w-full">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-16 pb-6 border-b border-slate-800/40">
           {/* Left: Branding */}
           <div className="flex items-center gap-3 group select-none cursor-default">
              <div className="bg-gradient-to-br from-red-500 to-red-600 p-2.5 rounded-2xl shadow-lg shadow-red-500/20 group-hover:shadow-red-500/40 transition-all duration-300 group-hover:scale-105">
                  <Youtube className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-black italic tracking-tighter">
                <span className="text-white">Tube</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Scraper</span>
                <span className="ml-1 text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 uppercase">Pro</span>
              </h1>
           </div>
           
           {/* Right: API Config */}
           <ApiKeyManager 
              youtubeApiKey={youtubeApiKey} 
              setYoutubeApiKey={handleYoutubeKeyChange}
              rapidApiKey={rapidApiKey}
              setRapidApiKey={handleRapidKeyChange}
           />
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16 space-y-6">
          <h2 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1] drop-shadow-xl">
             Professional <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient-x">Video Intelligence</span> & Transcription
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
             Extract deep insights, analyze performance metrics, and generate precise transcripts from any YouTube video or channel for content creation and AI training.
          </p>
        </div>

        {/* Control Panel Card */}
        <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-700/50 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden ring-1 ring-white/5">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
          
          {/* Mode Selection Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 relative z-10">
            <button
              onClick={() => { setMode('single-channel'); setInput(''); setError(null); setResults([]); setProgress(0); setLogs([]); }}
              className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-300 cursor-pointer group ${
                mode === 'single-channel'
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/30 scale-[1.02]'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              <div className={`p-2 rounded-lg ${mode === 'single-channel' ? 'bg-white/20' : 'bg-slate-700/50 group-hover:bg-slate-700'}`}>
                <Layers size={20} />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">Single Channel</div>
                <div className="text-xs opacity-75">Scrape top videos</div>
              </div>
            </button>

            <button
              onClick={() => { setMode('multi-channel'); setInput(''); setError(null); setResults([]); setProgress(0); setLogs([]); }}
              className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-300 cursor-pointer group ${
                mode === 'multi-channel'
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/30 scale-[1.02]'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
               <div className={`p-2 rounded-lg ${mode === 'multi-channel' ? 'bg-white/20' : 'bg-slate-700/50 group-hover:bg-slate-700'}`}>
                 <Film size={20} />
               </div>
              <div className="text-left">
                <div className="font-bold text-sm">Multi-Link Batch</div>
                <div className="text-xs opacity-75">Specific video list</div>
              </div>
            </button>

            <button
              onClick={() => { setMode('single-video'); setInput(''); setError(null); setResults([]); setProgress(0); setLogs([]); }}
              className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-300 cursor-pointer group ${
                mode === 'single-video'
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/30 scale-[1.02]'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              <div className={`p-2 rounded-lg ${mode === 'single-video' ? 'bg-white/20' : 'bg-slate-700/50 group-hover:bg-slate-700'}`}>
                <Search size={20} />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">Single Video</div>
                <div className="text-xs opacity-75">Analyze one url</div>
              </div>
            </button>
          </div>

          {/* Dynamic Form Inputs */}
          <form onSubmit={handleScrape} className="space-y-8 relative z-10">
            
            {/* Input Field */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-300 ml-1">
                {mode === 'single-channel' && "Channel URL or Handle (e.g. @MrBeast)"}
                {mode === 'multi-channel' && "Paste Video URLs (one per line or comma separated)"}
                {mode === 'single-video' && "YouTube Video URL"}
              </label>
              
              {mode === 'multi-channel' ? (
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="https://youtube.com/shorts/...\nhttps://youtube.com/watch?v=..."
                  className="w-full h-32 bg-slate-950/50 border border-slate-700/80 rounded-2xl p-4 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-y font-mono text-sm placeholder:text-slate-600 shadow-inner"
                  required
                />
              ) : (
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={mode === 'single-channel' ? "https://youtube.com/@handle" : "https://youtube.com/watch?v=..."}
                  className="w-full bg-slate-950/50 border border-slate-700/80 rounded-2xl p-4 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 shadow-inner"
                  required
                />
              )}
            </div>

            {/* Single Channel Specific Options */}
            {mode === 'single-channel' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-slate-950/30 rounded-2xl border border-slate-800/50">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-400">Content Type</label>
                  <div className="flex bg-slate-900/80 p-1.5 rounded-xl border border-slate-800/80 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setVideoType('video')}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer ${videoType === 'video' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                    >
                      Long Form
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoType('short')}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer ${videoType === 'short' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                    >
                      Shorts
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-400">Quantity (Max 50)</label>
                  <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800/80 rounded-xl overflow-hidden h-[46px] w-full shadow-inner">
                    <button 
                      type="button"
                      onClick={decrementLimit}
                      className="h-full w-14 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700 transition-colors cursor-pointer border-r border-slate-800"
                    >
                      <Minus size={18} />
                    </button>
                    <input
                      type="number"
                      value={limit}
                      onChange={handleLimitChange}
                      className="flex-1 bg-transparent text-center font-mono text-lg text-slate-200 font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button 
                      type="button"
                      onClick={incrementLimit}
                      className="h-full w-14 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700 transition-colors cursor-pointer border-l border-slate-800"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-shake shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                <AlertCircle size={20} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !youtubeApiKey}
              className={`w-full py-5 rounded-2xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer group relative overflow-hidden ${
                loading || !youtubeApiKey
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] text-white hover:bg-right hover:scale-[1.01] active:scale-[0.99] shadow-indigo-900/30 hover:shadow-indigo-600/40'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" /> Processing Data...
                </>
              ) : (
                <>
                  <span className="relative z-10">Start Transcript</span>
                  {/* Hover shimmer effect */}
                  <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                </>
              )}
            </button>

          </form>

          {/* Progress & Console Log Section */}
          {(loading || logs.length > 0) && (
            <div ref={consoleContainerRef} className="mt-10 border-t border-slate-800/60 pt-8 animate-fade-in scroll-mt-6">
              <div 
                onClick={toggleConsole}
                className="group cursor-pointer"
              >
                 <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-2">
                      <Terminal size={14} className="text-indigo-400" />
                      Live Process Console
                    </span>
                    <span className="flex items-center gap-1 group-hover:text-slate-200 transition-colors">
                      {isConsoleOpen ? 'Hide Logs' : 'Show Logs'}
                      {isConsoleOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                 </div>
                 
                 {/* Progress Bar Container */}
                 <div className="h-4 w-full bg-slate-950/50 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                   <div 
                      className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                      style={{ width: `${progress}%` }}
                   ></div>
                 </div>
              </div>

              {/* Collapsible Console */}
              {isConsoleOpen && (
                <div className="mt-5 p-5 bg-black/40 rounded-xl border border-slate-800/50 font-mono text-xs text-slate-300 h-56 overflow-y-auto shadow-inner custom-scrollbar backdrop-blur-sm">
                  {logs.length === 0 && <span className="text-slate-600 opacity-50 italic">Waiting for process start...</span>}
                  {logs.map((log, idx) => (
                    <div key={idx} className="mb-1.5 border-b border-white/5 pb-1 last:border-0 last:pb-0 flex">
                      <span className="text-indigo-500/60 mr-3 w-20 shrink-0">{log.split(']')[0]}]</span>
                      <span className={`${log.toLowerCase().includes('failed') || log.toLowerCase().includes('error') ? 'text-red-400 font-semibold' : log.toLowerCase().includes('success') ? 'text-emerald-400 font-medium' : 'text-slate-300'}`}>
                        {log.split(']')[1]}
                      </span>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              )}
            </div>
          )}

        </div>

        {/* Results Area */}
        <ResultsTable data={results} mode={mode} videoType={videoType} />
        
      </main>

      {/* Professional Footer */}
      <footer className="relative z-10 border-t border-slate-800/40 bg-slate-950/30 backdrop-blur-md mt-16">
        <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Youtube className="w-5 h-5 text-indigo-500" />
                        <span className="font-bold text-slate-200">TubeScraper Pro</span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                        A professional-grade tool for researchers, creators, and data scientists to extract and analyze YouTube metadata and transcripts.
                    </p>
                </div>
                <div className="flex flex-col gap-2">
                    <h3 className="font-semibold text-slate-300 mb-2">Resources</h3>
                    <a href="#" className="text-sm text-slate-500 hover:text-indigo-400 transition-colors w-fit">Documentation</a>
                    <a href="#" className="text-sm text-slate-500 hover:text-indigo-400 transition-colors w-fit">API Reference</a>
                    <a href="#" className="text-sm text-slate-500 hover:text-indigo-400 transition-colors w-fit">Privacy Policy</a>
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
                <span>© {new Date().getFullYear()} TubeScraper Pro. All rights reserved.</span>
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