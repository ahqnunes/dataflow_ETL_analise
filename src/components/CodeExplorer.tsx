import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  Download,
  FolderTree,
  FileText,
  Database,
  Terminal,
  Container,
  ExternalLink
} from 'lucide-react';
import { PROJECT_CODE_FILES, CodeFile } from '../data/projectFiles';
import { downloadProjectZip } from '../utils/zipDownloader';

export const CodeExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(PROJECT_CODE_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'All' | 'Docker' | 'SQL' | 'Python' | 'Docs'>('All');
  const [isDownloading, setIsDownloading] = useState(false);

  const filteredFiles = PROJECT_CODE_FILES.filter(
    (f) => filterCategory === 'All' || f.category === filterCategory
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadProjectZip();
    } finally {
      setIsDownloading(false);
    }
  };

  const getFileIcon = (cat: string) => {
    switch (cat) {
      case 'Docker':
        return <Container className="w-3.5 h-3.5 text-blue-400" />;
      case 'SQL':
        return <Database className="w-3.5 h-3.5 text-purple-400" />;
      case 'Python':
        return <FileCode className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-cyan-400" />
            Explorador de Código do Repositório (Estrutura de Pastas Limpa)
          </h3>
          <p className="text-xs text-slate-400">
            Navegue pelos scripts em Python, esquemas PostgreSQL, Docker Compose e documentação do projeto.
          </p>
        </div>

        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          {isDownloading ? 'Gerando Pacote...' : 'Baixar Todo o Repositório (.ZIP)'}
        </button>
      </div>

      {/* Main Split View: File Tree + Code Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left File Tree Sidebar */}
        <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 flex-wrap pb-2 border-b border-slate-900">
            {(['All', 'Python', 'SQL', 'Docker', 'Docs'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  filterCategory === cat
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* File list */}
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs font-mono transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'border-cyan-500/80 bg-cyan-950/30 text-cyan-200'
                      : 'border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <span className="mt-0.5">{getFileIcon(file.category)}</span>
                  <div className="truncate flex-1">
                    <div className="font-semibold text-slate-200 truncate">{file.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{file.path}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Code Viewer */}
        <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl flex flex-col">
          {/* Code Viewer Header */}
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getFileIcon(selectedFile.category)}
              <span className="text-xs font-mono font-bold text-slate-200">{selectedFile.path}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                {selectedFile.language}
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" /> Copiar Código
                </>
              )}
            </button>
          </div>

          {/* Description banner */}
          <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-900 text-xs text-slate-400">
            {selectedFile.description}
          </div>

          {/* Code body */}
          <div className="p-4 font-mono text-xs text-slate-300 bg-slate-950 overflow-auto max-h-[500px] leading-relaxed">
            <pre>{selectedFile.content}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
