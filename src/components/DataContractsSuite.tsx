import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  FileCheck,
  Terminal,
  Filter,
  RefreshCw,
  Info
} from 'lucide-react';
import { DataContractTest } from '../types/pipeline';
import { TechnicalExplanationCard } from './TechnicalExplanationCard';

interface DataContractsSuiteProps {
  contracts: DataContractTest[];
  onRunContracts: () => void;
}

export const DataContractsSuite: React.FC<DataContractsSuiteProps> = ({
  contracts,
  onRunContracts
}) => {
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');

  const passedTests = contracts.filter(c => c.status === 'passed').length;
  const failedTests = contracts.filter(c => c.status === 'failed').length;
  const totalTests = contracts.length;
  const overallPassed = failedTests === 0;

  const filteredContracts = contracts.filter(c => {
    if (filter === 'passed') return c.status === 'passed';
    if (filter === 'failed') return c.status === 'failed';
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Explicação Técnica de Data Contracts & Great Expectations */}
      <TechnicalExplanationCard
        badge="Great Expectations • Data Contracts"
        title="Por que Contratos de Dados são Essenciais na Engenharia Moderna?"
        summary="Data Contracts são acordos formais entre sistemas produtores e a equipe de dados que definem os esquemas, intervalos aceitáveis e regras semânticas que os dados DEVEM respeitar."
        problemSolved="Quando uma equipe de backend altera um campo ou envia valores nulos em produção sem avisar, dashboards quebram silenciosamente e métricas de faturamento são distorcidas sem que ninguém perceba a tempo."
        howItWorks={[
          'Validação Pré-Carga: Os testes rodam antes de qualquer inserção definitiva no banco analítico (padrão Shift-Left Data Quality).',
          'Regras Estritas de Integridade: expect_column_values_to_not_be_null_and_unique garante que nenhuma chave primária seja violada.',
          'Regras de Negócio Financeiras: expect_column_values_to_be_positive_float garante que nenhum preço ou quantidade negativa polua os KPIs.',
          'Formatos Canônicos: expect_column_values_to_match_iso8601_format garante compatibilidade temporal com particionamento no PostgreSQL.'
        ]}
        seniorDifferentiator="Mostra maturidade em Data Observability e prevenção ativa de bugs de dados, evitando 'garbage in, garbage out' nas camadas de BI e Analytics."
        accentColor="emerald"
      />

      {/* Header Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Great Expectations & Data Contracts
            </div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Quality Gate & Contratos de Dados Automatizados
            </h3>
            <p className="text-xs text-slate-400">
              Conjunto de validações formais executadas antes da ingestão e carga analítica para garantir integridade e schema compliance.
            </p>
          </div>

          <button
            onClick={onRunContracts}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all shadow-md active:scale-95 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reexecutar Validações
          </button>
        </div>

        {/* Global Gate Status Card */}
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          overallPassed
            ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
            : 'border-amber-500/40 bg-amber-950/20 text-amber-300'
        }`}>
          <div className="flex items-center gap-3">
            {overallPassed ? (
              <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-400">
                <AlertOctagon className="w-6 h-6" />
              </div>
            )}
            <div>
              <div className="text-sm font-bold text-white">
                {overallPassed
                  ? 'Gate de Qualidade: 100% APROVADO'
                  : `Gate de Qualidade: ${failedTests} ALERTA(S) DETECTADO(S)`}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {overallPassed
                  ? 'Todos os 8 testes de contrato e regras de negócio foram satisfeitos.'
                  : 'Registros com anomalias foram segregados para quarentena (DLQ) sem impactar o banco de produção.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-center px-3 py-1.5 bg-slate-900/60 rounded-lg border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 font-semibold block">Aprovados</span>
              <span className="text-base font-bold text-emerald-400 font-mono">{passedTests}/{totalTests}</span>
            </div>
            <div className="text-center px-3 py-1.5 bg-slate-900/60 rounded-lg border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 font-semibold block">Reprovados</span>
              <span className={`text-base font-bold font-mono ${failedTests > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                {failedTests}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filtrar Regras:
          </span>
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              filter === 'all' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Todas ({totalTests})
          </button>
          <button
            onClick={() => setFilter('passed')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              filter === 'passed' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Aprovadas ({passedTests})
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              filter === 'failed' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Falhas ({failedTests})
          </button>
        </div>
      </div>

      {/* Contract Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredContracts.map((c) => {
          const isPassed = c.status === 'passed';
          return (
            <div
              key={c.id}
              className={`p-4 rounded-xl border transition-all space-y-3 ${
                isPassed
                  ? 'border-emerald-900/40 bg-slate-950 hover:border-emerald-700/60'
                  : 'border-amber-900/40 bg-slate-950 hover:border-amber-700/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                      col: {c.targetColumn}
                    </span>
                    <span className="text-xs font-bold text-white font-mono">{c.ruleName}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{c.description}</p>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                    isPassed
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {isPassed ? 'Passed' : 'Failed'}
                </span>
              </div>

              {/* Progress & Counts */}
              <div className="space-y-1.5 pt-1 border-t border-slate-900">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Conformidade</span>
                  <span className="font-bold text-slate-200">
                    {c.passedCount} / {c.totalChecked} registros ({((c.passedCount / (c.totalChecked || 1)) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isPassed ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${(c.passedCount / (c.totalChecked || 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Sample Violations if failed */}
              {!isPassed && c.sampleViolations && c.sampleViolations.length > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/30 text-[11px] font-mono text-amber-300 space-y-1">
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <AlertOctagon className="w-3 h-3" /> Violações de Amostra:
                  </span>
                  {c.sampleViolations.map((v, i) => (
                    <div key={i} className="text-amber-200/80 truncate">• {v}</div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
