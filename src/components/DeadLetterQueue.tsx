import React, { useState } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Search,
  FileCode,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { QuarantineRecord } from '../types/pipeline';
import { TechnicalExplanationCard } from './TechnicalExplanationCard';

interface DeadLetterQueueProps {
  quarantineRecords: QuarantineRecord[];
  onReprocess: (id: string) => void;
  onClearQuarantine: () => void;
}

export const DeadLetterQueue: React.FC<DeadLetterQueueProps> = ({
  quarantineRecords,
  onReprocess,
  onClearQuarantine
}) => {
  const [selectedRecord, setSelectedRecord] = useState<QuarantineRecord | null>(
    quarantineRecords[0] || null
  );
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = quarantineRecords.filter(r =>
    r.originalIdVenda.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.rejectionReason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Explicação Técnica da DLQ / Quarentena */}
      <TechnicalExplanationCard
        badge="Dead Letter Queue (DLQ) • Resiliência"
        title="O que é uma Dead Letter Queue e Como Ela Protege o Pipeline?"
        summary="A Dead Letter Queue é um mecanismo de quarentena que isola registros que falharam em validações críticas, impedindo que dados corrompidos quebrem o carregamento no banco ou que sejam descartados sem rastreabilidade."
        problemSolved="Em pipelines ingênuos, uma linha corrompida (ex: data '31/02' ou preço negativo) ou aborta a ingestão inteira de 100.000 linhas ou é simplesmente descartada com dropna() sem que ninguém saiba o motivo."
        howItWorks={[
          'Roteamento Condicional: Registros rejeitados são desviados pelo Branching Operator diretamente para um bucket seguro (data/dlq/).',
          'Preservação do Payload Bruto: O JSON original não tratado é salvo na íntegra para permitir análise forense e auditoria contábil.',
          'Diagnóstico com Causa-Raiz: Cada registro armazenado é carimbado com o erro exato e a severidade detectada.',
          'Reprocessamento Assistido: Possibilidade de consertar os dados com imputação estatística e reinjetá-los no warehouse sem reprocessar o arquivo inteiro.'
        ]}
        seniorDifferentiator="Demonstra mentalidade sênior de resiliência e engenharia de missão crítica: o pipeline tolera falhas parciais sem interrupção de serviço nem perda de dados."
        accentColor="amber"
      />

      {/* Top Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> Resiliência & Data Governance
            </div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Quarentena de Dados & Dead Letter Queue (DLQ)
            </h3>
            <p className="text-xs text-slate-400">
              Registros com anomalias graves são desviados automaticamente para isolamento, evitando contaminação do Data Warehouse sem travar o pipeline.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClearQuarantine}
              disabled={quarantineRecords.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" /> Purgar Quarentena
            </button>
          </div>
        </div>

        {/* DLQ Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-lg border border-slate-800 bg-slate-950">
            <span className="text-[10px] uppercase font-semibold text-slate-500">Total em Quarentena</span>
            <div className="text-base font-bold text-amber-400 font-mono">
              {quarantineRecords.length} registros
            </div>
          </div>
          <div className="p-3 rounded-lg border border-slate-800 bg-slate-950">
            <span className="text-[10px] uppercase font-semibold text-slate-500">Severidade Crítica</span>
            <div className="text-base font-bold text-red-400 font-mono">
              {quarantineRecords.filter(r => r.severity === 'critical').length} itens
            </div>
          </div>
          <div className="p-3 rounded-lg border border-slate-800 bg-slate-950">
            <span className="text-[10px] uppercase font-semibold text-slate-500">Avisos de Negócio</span>
            <div className="text-base font-bold text-amber-300 font-mono">
              {quarantineRecords.filter(r => r.severity === 'warning').length} itens
            </div>
          </div>
          <div className="p-3 rounded-lg border border-slate-800 bg-slate-950">
            <span className="text-[10px] uppercase font-semibold text-slate-500">Status do Buffer</span>
            <div className="text-base font-bold text-emerald-400 font-mono">ISOLADO (data/dlq/)</div>
          </div>
        </div>
      </div>

      {/* Main Master-Detail view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left List */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por ID ou motivo de rejeição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* List of items */}
          <div className="space-y-2 max-h-[460px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Nenhum registro encontrado na quarentena.
              </div>
            ) : (
              filtered.map((item) => {
                const isSelected = selectedRecord?.id === item.id;
                const isCritical = item.severity === 'critical';

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedRecord(item)}
                    className={`w-full text-left p-3 rounded-lg border text-xs font-mono transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-950/20 text-amber-200 ring-1 ring-amber-500/40'
                        : 'border-slate-800/80 bg-slate-900/40 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-200">{item.originalIdVenda}</span>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          isCritical
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {item.severity}
                      </span>
                    </div>

                    <div className="text-[11px] text-amber-300 truncate font-semibold">
                      {item.rejectionReason}
                    </div>

                    <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>Ingerido em: {item.ingestedAt}</span>
                      <span className="text-cyan-400">Ver detalhes →</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Detail & Payload Inspector */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl flex flex-col">
          {selectedRecord ? (
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <h4 className="text-sm font-bold text-white font-mono">
                      Registro {selectedRecord.originalIdVenda} (ID Quarentena: {selectedRecord.id})
                    </h4>
                  </div>
                  <span className="text-xs text-slate-400 mt-0.5 block">
                    Motivo: <span className="text-amber-300 font-mono font-semibold">{selectedRecord.rejectionReason}</span>
                  </span>
                </div>

                <button
                  onClick={() => onReprocess(selectedRecord.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all active:scale-95 shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reprocessar com Correção
                </button>
              </div>

              {/* Suggestion Card */}
              <div className="p-3.5 rounded-xl border border-cyan-900/40 bg-cyan-950/20 text-xs text-cyan-200 space-y-1">
                <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Sugestão de Engenharia de Dados:
                </span>
                <p className="text-slate-300 leading-relaxed font-sans">{selectedRecord.repairSuggestion}</p>
              </div>

              {/* Raw JSON Payload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-purple-400" /> Payload Bruto Rejeitado (JSON)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Original CSV Schema</span>
                </div>

                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-200 overflow-x-auto max-h-56">
                  <pre>{JSON.stringify(selectedRecord.rawPayload, null, 2)}</pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs my-auto">
              Selecione um registro na lista ao lado para inspecionar os detalhes da anomalia.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
