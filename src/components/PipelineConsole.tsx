import React, { useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  Play,
  RotateCcw,
  CheckCircle2,
  RefreshCw,
  Cpu,
  FileSpreadsheet,
  Database,
  BarChart,
  FileCheck2,
  AlertTriangle
} from 'lucide-react';
import { PipelineStage, PipelineLog, DataQualityReport } from '../types/pipeline';
import { TechnicalExplanationCard } from './TechnicalExplanationCard';

interface PipelineConsoleProps {
  stage: PipelineStage;
  logs: PipelineLog[];
  metrics: DataQualityReport | null;
  isRunning: boolean;
  onRunFullPipeline: () => void;
  onRunStep: (step: 'generate' | 'extract' | 'transform' | 'load' | 'analyze' | 'report') => void;
  onReset: () => void;
}

export const PipelineConsole: React.FC<PipelineConsoleProps> = ({
  stage,
  logs,
  metrics,
  isRunning,
  onRunFullPipeline,
  onRunStep,
  onReset
}) => {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const steps = [
    {
      id: 'generate' as const,
      label: '1. Gerador',
      sub: 'generator.py',
      icon: FileSpreadsheet,
      active: stage === 'generating',
      done: ['extracting', 'transforming', 'loading', 'analyzing', 'reporting', 'completed'].includes(stage)
    },
    {
      id: 'extract' as const,
      label: '2. Extração',
      sub: 'extract.py',
      icon: Cpu,
      active: stage === 'extracting',
      done: ['transforming', 'loading', 'analyzing', 'reporting', 'completed'].includes(stage)
    },
    {
      id: 'transform' as const,
      label: '3. Transformação',
      sub: 'transform.py',
      icon: RefreshCw,
      active: stage === 'transforming',
      done: ['loading', 'analyzing', 'reporting', 'completed'].includes(stage)
    },
    {
      id: 'load' as const,
      label: '4. Carga PostgreSQL',
      sub: 'load.py',
      icon: Database,
      active: stage === 'loading',
      done: ['analyzing', 'reporting', 'completed'].includes(stage)
    },
    {
      id: 'analyze' as const,
      label: '5. Queries Analíticas',
      sub: 'sql/queries.sql',
      icon: BarChart,
      active: stage === 'analyzing',
      done: ['reporting', 'completed'].includes(stage)
    },
    {
      id: 'report' as const,
      label: '6. Relatório BI',
      sub: 'report.py',
      icon: FileCheck2,
      active: stage === 'reporting',
      done: stage === 'completed'
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Explicação Técnica da Execução do Pipeline */}
      <TechnicalExplanationCard
        badge="Engine de Execução • Pipeline Interativo"
        title="O Que Acontece Passo a Passo Durante a Execução do Pipeline?"
        summary="O orquestrador coordena de forma sequencial e atômica as 6 tarefas principais: geração simulada, extração de CSVs, limpeza com Pandas, carga no banco relacional, consultas analíticas e emissão de relatórios."
        problemSolved="Em projetos amadores, scripts são executados manualmente fora de ordem, causando erros de tabela não encontrada ou processamento de dados defasados."
        howItWorks={[
          'Ciclo Sequencial Garantido: Cada etapa só inicia após a anterior emitir código de retorno 0 (sucesso) e relatório de integridade.',
          'Log Estruturado em Tempo Real: Cada evento registra timestamp ISO, subsistema responsável e severidade (INFO, SUCCESS, WARNING, ERROR).',
          'Execução Modular: O engenheiro pode acionar tarefas individuais para debugar isoladamente a transformação ou a carga.',
          'Métricas Imediatas: O painel sumariza taxas de nulos recuperados, registros corrompidos e volume de linhas processadas.'
        ]}
        seniorDifferentiator="Demonstra controle rigoroso de fluxo de trabalho, capacidade de depuração granular e observabilidade operacional em tempo real."
        accentColor="cyan"
      />

      {/* Interactive Step Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Controle de Execução do Pipeline (Orquestração Interativa)
            </h3>
            <p className="text-xs text-slate-400">
              Você pode executar o fluxo de ponta a ponta em 1 clique ou acionar cada script isoladamente.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
              title="Resetar estado do console"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Resetar
            </button>
            <button
              onClick={onRunFullPipeline}
              disabled={isRunning}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all shadow-md shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processando...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" /> Rodar main.py Completo
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
          {steps.map((st) => {
            const Icon = st.icon;
            return (
              <button
                key={st.id}
                onClick={() => onRunStep(st.id)}
                disabled={isRunning}
                className={`p-3 rounded-lg border text-left transition-all relative overflow-hidden active:scale-95 disabled:cursor-not-allowed ${
                  st.active
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-500/50'
                    : st.done
                    ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300 hover:border-emerald-500'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Icon className={`w-4 h-4 ${st.active ? 'text-cyan-400 animate-pulse' : st.done ? 'text-emerald-400' : 'text-slate-400'}`} />
                  {st.done ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : st.active ? (
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  )}
                </div>
                <div className="text-xs font-bold truncate">{st.label}</div>
                <div className="text-[10px] text-slate-500 font-mono truncate">{st.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Realtime KPI Bar */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400">Total de Registros Brutos</span>
            <div className="text-lg font-bold text-white font-mono">{metrics.totalRawRecords} <span className="text-xs text-slate-500 font-normal">linhas CSV</span></div>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400">Registros Higienizados</span>
            <div className="text-lg font-bold text-cyan-400 font-mono">{metrics.totalCleanRecords} <span className="text-xs text-slate-500 font-normal">(-{metrics.duplicatesRemoved} dup)</span></div>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400">Data Quality Score</span>
            <div className="text-lg font-bold text-emerald-400 font-mono">{metrics.qualityScorePct}% <span className="text-xs text-slate-500 font-normal">aprovado</span></div>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400">Faturamento Fato Vendas</span>
            <div className="text-lg font-bold text-purple-400 font-mono">
              R$ {metrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      )}

      {/* Terminal Console View */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
        {/* Terminal Header */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="text-xs font-mono text-slate-400 ml-2 flex items-center gap-1.5">
              <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
              bash - container: dataflow_etl (python main.py)
            </span>
          </div>

          <div className="text-[11px] font-mono text-slate-500">
            {logs.length} linhas de log
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-4 font-mono text-xs max-h-96 min-h-[300px] overflow-y-auto space-y-1.5 select-text">
          {logs.map((log) => {
            let badgeColor = 'text-slate-400';
            if (log.level === 'success') badgeColor = 'text-emerald-400 font-bold';
            if (log.level === 'warning') badgeColor = 'text-amber-400 font-bold';
            if (log.level === 'error') badgeColor = 'text-red-400 font-bold';
            if (log.level === 'info') badgeColor = 'text-cyan-400';

            return (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed hover:bg-slate-900/40 px-1 py-0.5 rounded">
                <span className="text-slate-600 shrink-0 select-none">{log.timestamp}</span>
                <span className="text-slate-500 shrink-0 select-none">[{log.stage}]</span>
                <span className={`${badgeColor} break-all`}>{log.message}</span>
              </div>
            );
          })}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
};
