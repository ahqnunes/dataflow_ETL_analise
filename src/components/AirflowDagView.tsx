import React, { useState } from 'react';
import {
  GitBranch,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { AirflowDagNode, PipelineStage } from '../types/pipeline';
import { getAirflowDagState } from '../services/pipelineSimulator';
import { TechnicalExplanationCard } from './TechnicalExplanationCard';

interface AirflowDagViewProps {
  stage: PipelineStage;
  onTriggerDag: () => void;
}

export const AirflowDagView: React.FC<AirflowDagViewProps> = ({
  stage,
  onTriggerDag
}) => {
  const dagNodes = getAirflowDagState(stage);
  const [selectedTask, setSelectedTask] = useState<AirflowDagNode>(dagNodes[0]);

  const getStatusBadge = (status: AirflowDagNode['status']) => {
    switch (status) {
      case 'success':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">success</span>;
      case 'running':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800 animate-pulse">running</span>;
      case 'failed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-950 text-red-400 border border-red-800">failed</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-400 border border-slate-700">queued</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Explicação Técnica da Orquestração */}
      <TechnicalExplanationCard
        badge="Apache Airflow 2.7 • Orquestração DAG"
        title="O que é uma DAG e Por que Usamos Orquestradores Modernos?"
        summary="Uma DAG (Directed Acyclic Graph) define a ordem lógica e cronológica de execução de um pipeline de dados, garantindo que etapas subsequentes só rodem quando as dependências anteriores forem satisfeitas."
        problemSolved="Em scripts monolíticos com cron clássico, se a extração falha ou atrasa, a transformação roda sobre dados parciais ou desatualizados, corrompendo o Data Warehouse sem disparar alertas precisos nem permitir reexecuções parciais."
        howItWorks={[
          'Nós e Arestas: Cada tarefa representa um nó isolado com seu próprio operador (PythonOperator, PostgresOperator, BranchPythonOperator).',
          'Grafo Acíclico: A execução flui estritamente em uma única direção, sem loops infinitos que travam clusters produtivos.',
          'Resolução de Falhas & Retentativas: Configuração de retry_delay e retries automáticos para lidar com instabilidades temporárias de rede.',
          'Ramificação Inteligente (Branching): Direcionamento condicional de dados limpos para a carga e anomalias para a Dead Letter Queue (DLQ).'
        ]}
        seniorDifferentiator="Comprova habilidade em projetar arquiteturas orquestradas orientadas a dependências com visibilidade granular por task, logs unificados e isolamento de falhas."
        accentColor="indigo"
      />

      {/* Top Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-1.5">
              <GitBranch className="w-3.5 h-3.5" /> Apache Airflow 2.7 • DAG Orchestration
            </div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              DAG de Orquestração & Grafo de Dependências (Graph View)
            </h3>
            <p className="text-xs text-slate-400">
              Visualização de dependências upstream/downstream, tarefas ramificadas, status em tempo real e operadores especializados.
            </p>
          </div>

          <button
            onClick={onTriggerDag}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all shadow-md active:scale-95 shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Trigger DAG (Executar Fluxo)
          </button>
        </div>

        {/* DAG Summary stats */}
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400 flex-wrap pt-1 border-t border-slate-800">
          <span>DAG ID: <strong className="text-slate-200">dataflow_etl_pipeline_v1</strong></span>
          <span>Schedule: <strong className="text-slate-200">@daily (03:00 UTC)</strong></span>
          <span>Tasks: <strong className="text-slate-200">{dagNodes.length}</strong></span>
          <span>Catchup: <strong className="text-slate-200">False</strong></span>
        </div>
      </div>

      {/* Visual DAG Flow Chart */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4 overflow-x-auto shadow-2xl">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" /> Fluxo Visual das Tarefas (Clique em um nó para ver logs)
        </h4>

        <div className="flex items-center gap-3 min-w-[700px] py-4">
          {dagNodes.map((node, idx) => {
            const isSelected = selectedTask.id === node.id;
            const isSuccess = node.status === 'success';
            const isRunning = node.status === 'running';

            return (
              <React.Fragment key={node.id}>
                <button
                  onClick={() => setSelectedTask(node)}
                  className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between w-48 shrink-0 active:scale-95 ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/30 ring-2 ring-cyan-400/40'
                      : isSuccess
                      ? 'border-emerald-700/50 bg-slate-900/80 hover:border-emerald-500'
                      : isRunning
                      ? 'border-cyan-500 bg-cyan-950/20'
                      : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-mono text-slate-400 truncate font-semibold">
                      {node.operator}
                    </span>
                    {getStatusBadge(node.status)}
                  </div>

                  <div className="text-xs font-mono font-bold text-white break-words line-clamp-2">
                    {node.taskName}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {node.durationMs}ms
                    </span>
                    <span className="text-cyan-400">task #{idx + 1}</span>
                  </div>
                </button>

                {idx < dagNodes.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Task Instance Log Viewer */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Airflow Task Instance: <strong>{selectedTask.taskName}</strong> ({selectedTask.operator})</span>
          </div>

          <div className="flex items-center gap-2">
            {getStatusBadge(selectedTask.status)}
            <span className="text-xs font-mono text-slate-500">Duration: {selectedTask.durationMs}ms</span>
          </div>
        </div>

        <div className="p-4 font-mono text-xs text-slate-300 space-y-1 bg-slate-950">
          <div className="text-slate-600">[2023-11-20 03:00:00,102] &#123;taskinstance.py:1103&#125; INFO - Starting task: {selectedTask.taskName}</div>
          <div className="text-slate-600">[2023-11-20 03:00:00,150] &#123;base_operator.py:45&#125; INFO - Operator: {selectedTask.operator} initialized</div>
          {selectedTask.logs.map((log, i) => (
            <div key={i} className="text-cyan-300">
              <span className="text-slate-600">[2023-11-20 03:00:00,{200 + i * 80}] &#123;worker.py:88&#125; </span>
              {log}
            </div>
          ))}
          <div className="text-emerald-400 font-semibold">[2023-11-20 03:00:00,450] &#123;taskinstance.py:1200&#125; SUCCESS - Task completed with code 0</div>
        </div>
      </div>
    </div>
  );
};
