import React from 'react';
import { VideoData, ScrapeMode, VideoType } from '../types';
import { ExternalLink, Clock, Eye, FileText, Download, CheckCircle, XCircle, Loader2, FileWarning } from 'lucide-react';
import { parseDurationToSeconds } from '../services/youtubeService';

interface ResultsTableProps {
  data: VideoData[];
  mode: ScrapeMode;
  videoType: VideoType;
}

// Helper to calculate exact days ago
const getDaysDiff = (dateString: string): number => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

// Format large numbers (e.g. 1.2M)
const formatNumber = (numStr: string) => {
  const num = parseInt(numStr);
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
};

export const ResultsTable: React.FC<ResultsTableProps> = ({ data, mode, videoType }) => {
  
  const handleExportCSV = () => {
    if (data.length === 0) return;

    // Define Headers
    const headers = [
      "Serial Number",
      "Video Title",
      "Video Link",
      "View Count",
      "Age (Days)",
      "Duration (Seconds)",
      "Transcript"
    ];

    // Map data to rows
    const rows = data.map((video, index) => {
      const daysAge = getDaysDiff(video.publishedAt);
      const durationSeconds = parseDurationToSeconds(video.duration);
      
      return [
        index + 1,
        `"${video.title.replace(/"/g, '""')}"`, // Escape double quotes
        video.url,
        video.viewCount,
        daysAge,
        durationSeconds,
        `"${video.transcript || ''}"`
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Dynamic Filename Generation
    const sanitize = (str: string) => str.replace(/[^a-z0-9\s-_]/gi, '').trim().replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    let filename = `youtube_export_${dateStr}.csv`;

    if (mode === 'single-channel' && data.length > 0) {
      const channelName = sanitize(data[0].channelTitle || 'Channel');
      const count = data.length;
      const typeStr = videoType === 'short' ? 'Shorts' : videoType === 'video' ? 'Videos' : 'Mixed';
      filename = `${channelName}_${count}_${typeStr}_${dateStr}.csv`;
    } else if (mode === 'single-video' && data.length > 0) {
      const channelName = sanitize(data[0].channelTitle || 'Channel');
      const videoTitle = sanitize(data[0].title).substring(0, 50); // Limit length
      filename = `${channelName}_${videoTitle}_${dateStr}.csv`;
    } else if (mode === 'multi-channel') {
      const count = data.length;
      filename = `Batch_Export_${count}_Videos_${dateStr}.csv`;
    }

    // Create a Blob and download with BOM for UTF-8 support
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (data.length === 0) return null;

  return (
    <div className="w-full mt-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <FileText className="text-indigo-400 w-6 h-6" />
          </div>
          Scraped Data 
          <span className="text-base font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
            {data.length} items
          </span>
        </h2>
        
        <button 
          onClick={handleExportCSV}
          className="group flex items-center gap-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 hover:border-emerald-500/40 px-6 py-2.5 rounded-xl transition-all duration-300 cursor-pointer shadow-lg shadow-emerald-900/10 hover:shadow-emerald-900/30 hover:scale-105 active:scale-95"
        >
          <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />
          <span className="font-semibold text-sm">Export CSV</span>
        </button>
      </div>
      
      <div className="overflow-hidden rounded-2xl border border-slate-700/60 shadow-2xl bg-slate-900/60 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider font-semibold backdrop-blur-sm">
              <tr>
                <th className="p-4 border-b border-slate-700 w-16 text-center">#</th>
                <th className="p-4 border-b border-slate-700 min-w-[300px]">Video Details</th>
                <th className="p-4 border-b border-slate-700 w-32">Metrics</th>
                <th className="p-4 border-b border-slate-700 w-32">Age</th>
                <th className="p-4 border-b border-slate-700 w-64 text-center">Transcript</th>
              </tr>
            </thead>
            <tbody className="text-slate-300 text-sm divide-y divide-slate-800/60">
              {data.map((video, index) => {
                const transcript = video.transcript || '';
                const isPending = transcript === '';
                const isError = transcript.startsWith("Error") || transcript.startsWith("API Error") || transcript.startsWith("Request Failed");
                
                // Content Logic
                let displayContent;
                if (isPending) {
                    displayContent = (
                        <div className="flex items-center gap-2 text-amber-500 text-xs font-medium bg-amber-500/5 px-2 py-1 rounded-full border border-amber-500/10 w-fit mx-auto">
                            <Loader2 size={12} className="animate-spin" /> Pending...
                        </div>
                    );
                } else if (isError) {
                    displayContent = (
                        <div className="flex items-start gap-2 text-red-400 text-xs bg-red-500/5 px-2 py-1 rounded-md border border-red-500/10">
                             <FileWarning size={14} className="shrink-0 mt-0.5" />
                             <span className="break-words line-clamp-2 text-left" title={transcript}>{transcript}</span>
                        </div>
                    );
                } else {
                    // Success case
                    displayContent = (
                        <div className="flex flex-col gap-2">
                            <div className="text-slate-400 text-xs line-clamp-3 leading-relaxed italic bg-slate-950/30 p-2 rounded border border-slate-800/50">
                                "{transcript}"
                            </div>
                            <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold uppercase tracking-wide mx-auto">
                                <CheckCircle size={10} /> Transcribed
                            </div>
                        </div>
                    );
                }

                return (
                  <tr key={video.id} className="hover:bg-slate-800/40 transition-colors group duration-300">
                    <td className="p-4 text-center font-mono text-slate-500 group-hover:text-slate-400">
                      {(index + 1).toString().padStart(2, '0')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="relative shrink-0 overflow-hidden rounded-lg border border-slate-700/50 w-32 aspect-video group-hover:border-indigo-500/40 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all duration-300">
                          <img 
                            src={video.thumbnail} 
                            alt="thumb" 
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          <a 
                            href={video.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="font-medium text-base text-slate-200 hover:text-indigo-400 transition-colors line-clamp-2 leading-snug cursor-pointer group-hover:translate-x-1 duration-300"
                            title={video.title}
                          >
                            {video.title}
                          </a>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                             <span className="font-medium text-slate-400 group-hover:text-slate-300 transition-colors">{video.channelTitle}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-medium text-slate-200 bg-slate-800/30 py-1.5 px-3 rounded-lg border border-slate-700/30 w-fit">
                        <Eye size={14} className="text-emerald-500" />
                        {formatNumber(video.viewCount)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock size={14} />
                        {getDaysDiff(video.publishedAt)} days
                      </div>
                    </td>
                    <td className="p-4 align-top text-center">
                       {displayContent}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};