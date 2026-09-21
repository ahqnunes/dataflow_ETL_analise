import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Filter,
  ArrowRight,
  Sparkles,
  Info,
  Calendar,
  DollarSign
} from 'lucide-react';
import { RawSaleRecord, CleanSaleRecord, DataQualityReport } from '../types/pipeline';
import { TechnicalExplanationCard } from './TechnicalExplanationCard';

interface DataQualityDiffProps {
  rawRecords: RawSaleRecord[];
  cleanRecords: CleanSaleRecord[];
  metrics: DataQualityReport | null;
}

export const DataQualityDiff: React.FC<DataQualityDiffProps> = ({
  rawRecords,
  cleanRecords,
  metrics
}) => {
  const [filter, setFilter] = useState<'all' | 'bad_date' | 'missing_client' | 'negative_qty' | 'currency'>('all');
  const [activeTab, setActiveTab] = useState<'side_by_side' | 'raw_only' | 'clean_only'>('side_by_side');

  // Filter raw records based on selected defect type
  const filteredRaw = rawRecords.filter(r => {
    if (filter === 'bad_date') return r.defects?.isBadDate;
    if (filter === 'missing_client') return r.defects?.isMissingClient;
    if (filter === 'negative_qty') return r.defects?.isNegativeQty;
    if (filter === 'currency') return r.defects?.isDirtyCurrency;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Explicação Técnica da Higienização com Pandas */}
      <TechnicalExplanationCard
        badge="Pandas • Higienização Vetorizada"
        title="Como o Pipeline Trata Ruídos e Anomalias de Mercado em Alta Velocidade?"
        summary="Em vez de iterar linha a linha com loops Python que custam segundos preciosos por arquivo, a transformação utiliza computação vetorizada em C (Cython/NumPy) nativa do Pandas."
        problemSolved="Arquivos CSV brutos contêm vírgulas no lugar de pontos, símbolos de moeda (R$), espaços em branco ocultos, datas em formatos conflitantes (DD/MM/YYYY vs YYYY-MM-DD) e chaves nulas."
        howItWorks={[
          'Regex Vetorizado de Moedas: df["preco_unitario"].str.replace(r"[R$\\s.]", "").str.replace(",", ".").astype(float) limpa milhares de linhas num único ciclo de CPU.',
          'Normalização Multiformato de Datas: pd.to_datetime(..., format="mixed", errors="coerce") converte qualquer padrão para ISO 8601 canônico (YYYY-MM-DD).',
          'Deduplicação Inteligente: df.drop_duplicates(subset=["id_venda"], keep="last") elimina envios acidentais mantendo o estado mais recente.',
          'Colunas Derivadas Vetorizadas: faturamento_total = df["quantidade"] * df["preco_unitario"] e calculo de margem executados em lote na memória RAM.'
        ]}
        seniorDifferentiator="Demonstra conhecimento profundo das entranhas do Pandas, priorizando operações vetorizadas sobre iterações ingênuas com iterrows() ou for loops."
        accentColor="emerald"
      />

      {/* Header Info */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Inspetor de Qualidade de Dados (Raw vs Transformed Pandas)
            </h3>
            <p className="text-xs text-slate-400">
              Visualização comparativa da "sujeira" proposital gerada na Etapa 1 e sua resolução matemática na Etapa 2.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filtrar Defeito:
            </span>
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                filter === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Todos ({rawRecords.length})
            </button>
            <button
              onClick={() => setFilter('bad_date')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                filter === 'bad_date' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Datas Inválidas
            </button>
            <button
              onClick={() => setFilter('currency')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                filter === 'currency' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Moeda Poluída (R$)
            </button>
            <button
              onClick={() => setFilter('missing_client')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                filter === 'missing_client' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Clientes Nulos
            </button>
            <button
              onClick={() => setFilter('negative_qty')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                filter === 'negative_qty' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Qtd Negativa
            </button>
          </div>
        </div>

        {/* Quality Badges */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60">
              <span className="text-[10px] uppercase font-semibold text-slate-500">Duplicatas Removidas</span>
              <div className="text-sm font-bold text-amber-400 font-mono">{metrics.duplicatesRemoved} linhas</div>
            </div>
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60">
              <span className="text-[10px] uppercase font-semibold text-slate-500">Datas Padronizadas</span>
              <div className="text-sm font-bold text-blue-400 font-mono">{metrics.datesSanitized} datas</div>
            </div>
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60">
              <span className="text-[10px] uppercase font-semibold text-slate-500">Moedas Sanitizadas</span>
              <div className="text-sm font-bold text-purple-400 font-mono">{metrics.currenciesFixed} campos</div>
            </div>
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60">
              <span className="text-[10px] uppercase font-semibold text-slate-500">Imputações de Chave</span>
              <div className="text-sm font-bold text-indigo-400 font-mono">{metrics.missingClientsImputed} clientes</div>
            </div>
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60">
              <span className="text-[10px] uppercase font-semibold text-slate-500">Score de Qualidade</span>
              <div className="text-sm font-bold text-emerald-400 font-mono">{metrics.qualityScorePct}%</div>
            </div>
          </div>
        )}
      </div>

      {/* Side by side comparison table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* RAW DIRTY DATA TABLE */}
        <div className="rounded-xl border border-red-900/30 bg-slate-950 overflow-hidden shadow-lg">
          <div className="px-4 py-3 bg-red-950/20 border-b border-red-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-slate-200">
                Dados Brutos (data/raw/vendas_brutas.csv)
              </h4>
            </div>
            <span className="text-[11px] font-mono text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-900/40">
              Com Sujeira Proposital
            </span>
          </div>

          <div className="max-h-[460px] overflow-auto text-xs font-mono">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="p-2.5">ID Venda</th>
                  <th className="p-2.5">Cliente</th>
                  <th className="p-2.5">Qtd</th>
                  <th className="p-2.5">Preço Unit.</th>
                  <th className="p-2.5">Data Venda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {filteredRaw.slice(0, 40).map((r) => {
                  const hasClientDefect = !r.id_cliente;
                  const hasDateDefect = r.defects?.isBadDate;
                  const hasPriceDefect = r.defects?.isDirtyCurrency;
                  const hasQtyDefect = r.defects?.isNegativeQty;

                  return (
                    <tr key={r.id_venda} className="hover:bg-slate-900/50">
                      <td className="p-2.5 text-slate-300 font-semibold">{r.id_venda}</td>
                      <td className="p-2.5">
                        {hasClientDefect ? (
                          <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800/60 text-[10px] font-bold">
                            NULL / Vazio
                          </span>
                        ) : (
                          <span className="text-slate-300">{r.id_cliente}</span>
                        )}
                      </td>
                      <td className="p-2.5">
                        {hasQtyDefect ? (
                          <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800/60 text-[10px] font-bold">
                            {r.quantidade}
                          </span>
                        ) : (
                          <span className="text-slate-300">{r.quantidade}</span>
                        )}
                      </td>
                      <td className="p-2.5">
                        {hasPriceDefect ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60 text-[10px] font-bold">
                            "{r.preco_unitario || 'NULL'}"
                          </span>
                        ) : (
                          <span className="text-slate-300">{r.preco_unitario}</span>
                        )}
                      </td>
                      <td className="p-2.5">
                        {hasDateDefect ? (
                          <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800/60 text-[10px] font-bold">
                            "{r.data_venda || 'NULL'}"
                          </span>
                        ) : (
                          <span className="text-slate-400">{r.data_venda}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* CLEAN TRANSFORMED PANDAS TABLE */}
        <div className="rounded-xl border border-emerald-900/30 bg-slate-950 overflow-hidden shadow-lg">
          <div className="px-4 py-3 bg-emerald-950/20 border-b border-emerald-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-slate-200">
                Dados Higienizados (transform.py com Pandas)
              </h4>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/40">
              100% Validado & Tipado
            </span>
          </div>

          <div className="max-h-[460px] overflow-auto text-xs font-mono">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="p-2.5">ID Venda</th>
                  <th className="p-2.5">Cliente (FK)</th>
                  <th className="p-2.5">Qtd</th>
                  <th className="p-2.5">Preço Unit.</th>
                  <th className="p-2.5 text-cyan-400 font-bold">Faturamento</th>
                  <th className="p-2.5">Data (ISO)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {cleanRecords.slice(0, 40).map((c) => (
                  <tr key={c.id_venda} className="hover:bg-slate-900/50">
                    <td className="p-2.5 text-slate-300 font-semibold">{c.id_venda}</td>
                    <td className="p-2.5 text-emerald-400">{c.id_cliente}</td>
                    <td className="p-2.5 text-slate-200">{c.quantidade}</td>
                    <td className="p-2.5 text-slate-200 font-mono">R$ {c.preco_unitario.toFixed(2)}</td>
                    <td className="p-2.5 text-cyan-400 font-bold font-mono">
                      R$ {c.faturamento_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2.5 text-emerald-300">{c.data_venda}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
