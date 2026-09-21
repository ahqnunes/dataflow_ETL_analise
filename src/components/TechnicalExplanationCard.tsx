import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, BookOpen, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

interface TechnicalExplanationCardProps {
  badge: string;
  title: string;
  summary: string;
  problemSolved: string;
  howItWorks: string[];
  seniorDifferentiator: string;
  accentColor?: 'cyan' | 'indigo' | 'emerald' | 'amber' | 'purple';
}

export const TechnicalExplanationCard: React.FC<TechnicalExplanationCardProps> = ({
  badge,
  title,
  summary,
  problemSolved,
  howItWorks,
  seniorDifferentiator,
  accentColor = 'cyan'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const colorStyles = {
    cyan: {
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-950/20',
      text: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300'
    },
    indigo: {
      border: 'border-indigo-500/30',
      bg: 'bg-indigo-950/20',
      text: 'text-indigo-400',
      badgeBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
    },
    emerald: {
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-950/20',
      text: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
    },
    amber: {
      border: 'border-amber-500/30',
      bg: 'bg-amber-950/20',
      text: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 border-amber-500/20 text-amber-300'
    },
    purple: {
      border: 'border-purple-500/30',
      bg: 'bg-purple-950/20',
      text: 'text-purple-400',
      badgeBg: 'bg-purple-500/10 border-purple-500/20 text-purple-300'
    }
  }[accentColor];

  return (
    <div className={`rounded-xl border ${colorStyles.border} ${colorStyles.bg} transition-all duration-300 shadow-sm overflow-hidden mb-5`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 hover:bg-slate-900/30 transition-colors"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colorStyles.badgeBg}`}>
              <BookOpen className="w-3 h-3" /> {badge}
            </span>
            <span className="text-xs text-slate-400">Guia de Engenharia de Dados & Explicação Técnica</span>
          </div>
          <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            {title}
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
            {summary}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
          <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
            {isOpen ? 'Ocultar detalhes' : 'Como funciona'}
          </span>
          <div className={`p-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 ${colorStyles.text}`}>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 space-y-4 text-xs animate-fadeIn">
          {/* Problema de Negócio & Engenharia */}
          <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1">
            <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" /> Problema que esta camada resolve:
            </span>
            <p className="text-slate-300 leading-relaxed font-sans">
              {problemSolved}
            </p>
          </div>

          {/* Como Funciona na Prática */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className={`w-3.5 h-3.5 ${colorStyles.text}`} /> Mecanismo de Funcionamento Sob o Capô:
            </span>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300">
              {howItWorks.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 p-2 rounded-md bg-slate-900/50 border border-slate-800/50">
                  <span className={`font-mono font-bold ${colorStyles.text}`}>0{idx + 1}.</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Diferencial para Recrutadores */}
          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-700/60 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200">Destaque para Entrevistas Técnicas & Recrutamento:</span>
              <p className="text-slate-400 mt-0.5 leading-relaxed">{seniorDifferentiator}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
