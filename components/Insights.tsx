
import React, { useEffect, useState } from 'react';
import { AppData } from '../types';
import { geminiService } from '../services/geminiService';

interface InsightsProps {
  data: AppData;
}

const Insights: React.FC<InsightsProps> = ({ data }) => {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      const res = await geminiService.getInsights(data);
      setInsights(res || "");
      setLoading(false);
    };
    fetchInsights();
  }, [data]);

  const parseInsights = (text: string) => {
    if (!text) return null;
    return text.split('\n').filter(line => line.trim().length > 0).map((line, i) => {
      let icon = "fa-circle-dot";
      let color = "text-slate-400";
      const lower = line.toLowerCase();
      if (lower.includes("earning") || lower.includes("$")) {
        icon = "fa-chart-pie";
        color = "text-blue-500";
      } else if (lower.includes("reminder")) {
        icon = "fa-clock";
        color = "text-cyan-500";
      } else if (lower.includes("overdue")) {
        icon = "fa-triangle-exclamation";
        color = "text-rose-500";
      } else if (lower.includes("progress") || lower.includes("suggestion")) {
        icon = "fa-star";
        color = "text-amber-500";
      }
      return (
        <div key={i} className="flex gap-4 p-6 bg-white border border-slate-100 rounded-[2rem] pro-shadow transition-all hover:scale-[1.01] hover:border-blue-100">
          <div className={`${color} mt-1 text-xl`}><i className={`fas ${icon}`}></i></div>
          <p className="text-sm font-semibold text-slate-700 leading-relaxed">{line.replace(/^[*•-]\s*/, '')}</p>
        </div>
      );
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#0f172a] uppercase tracking-tighter">AI Behavioral Insights</h2>
          <p className="text-slate-500 font-medium">AI-driven analysis of tutoring patterns and efficiency.</p>
        </div>
        <div className="px-4 py-2 bg-blue-50 rounded-full flex items-center gap-2 border border-blue-100">
          <div className={`w-2 h-2 rounded-full ${loading ? 'bg-cyan-500 animate-pulse' : 'bg-blue-500'}`}></div>
          <span className="text-[10px] font-black uppercase text-blue-700 tracking-widest">
            {loading ? 'Consulting Core...' : 'Sync Optimal'}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-[2rem] animate-pulse"></div>
          ))
        ) : (
          parseInsights(insights) || (
            <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-slate-100 pro-shadow">
              <i className="fas fa-moon text-slate-200 text-6xl mb-6"></i>
              <p className="text-slate-400 font-bold uppercase tracking-[0.2em]">Data streams are silent.</p>
            </div>
          )
        )}
      </div>

      <div className="p-8 bg-[#020617] rounded-[3rem] text-center text-white relative overflow-hidden border border-blue-900/30">
        <div className="absolute top-0 right-0 p-12 bg-blue-500/5 blur-3xl w-64 h-64 rounded-full"></div>
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.5em] mb-4">Core Processing Matrix</p>
        <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
          AI calculates trajectory based on session frequency and revenue velocity.
        </p>
        <div className="mt-8 flex justify-center gap-8">
          <div className="text-center">
            <p className="text-xl font-black">{data.sessions.length}</p>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Data Nodes</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black">{data.students.length}</p>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Student Link</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;