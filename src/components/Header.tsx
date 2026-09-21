import React, { useState } from 'react';
import { Database, Play, Download, Terminal, CheckCircle2, RefreshCw, UploadCloud } from 'lucide-react';
import { downloadProjectZip } from '../utils/zipDownloader';
import { PipelineStage } from '../types/pipeline';

interface HeaderProps {
  stage: PipelineStage;
  onRunPipeline: () => void;
  isRunning: boolean;
  onOpenUploadModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stage,
  onRunPipeline,
  isRunning,
  onOpenUploadModal
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadProjectZip();
    } finally {
      setIsDownloading(false);
    }
  };

  const getStageBadge = () => {
    switch (stage) {
      case 'generating':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Etapa 1: Gerando Dados Brutos</span>;
      case 'extracting':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Etapa 2: Extraindo Arquivos CSV</span>;
      case 'transforming':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Etapa 2: Transformando com Pandas</span>;
      case 'loading':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Etapa 2: Carga no PostgreSQL</span>;
      case 'analyzing':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Etapa 3: Executando Queries SQL</span>;
      case 'reporting':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Etapa 3: Consolidando Relatório BI</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="w-3.5 h-3.5" /> Pipeline 100% Concluído</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">Ambiente Docker Pronto</span>;
    }
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo e Título */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold text-white tracking-tight">DataFlow ETL & Analytics</h1>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                  Portfólio de Engenharia de Dados
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Pipeline completo em Python, Pandas, PostgreSQL, Docker Compose e Queries Analíticas Avançadas
              </p>
            </div>
          </div>

          {/* Status e Ações */}
          <div className="flex items-center gap-3 flex-wrap">
            {getStageBadge()}

            {/* Botão de Upload de CSV */}
            {onOpenUploadModal && (
              <button
                onClick={onOpenUploadModal}
                disabled={isRunning}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                title="Subir arquivo CSV de vendas personalizado"
              >
                <UploadCloud className="w-3.5 h-3.5 text-purple-400" />
                <span>Upload CSV</span>
              </button>
            )}

            {/* Botão de Download ZIP do Repositório Completo */}
            <button
              id="btn-download-repo-zip"
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              title="Baixar arquivos do projeto (.py, .sql, docker-compose.yml e README)"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              {isDownloading ? 'Gerando ZIP...' : 'Baixar Projeto (.ZIP)'}
            </button>

            {/* Botão de Executar Pipeline */}
            <button
              id="btn-run-full-pipeline"
              onClick={onRunPipeline}
              disabled={isRunning}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md shadow-cyan-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Executar Pipeline Completo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
