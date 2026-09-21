import React, { useState } from 'react';
import {
  Database,
  Play,
  Copy,
  Check,
  Code2,
  Table as TableIcon,
  Layers,
  Sparkles,
  Clock,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import { SqlQueryResult } from '../types/pipeline';
import { TechnicalExplanationCard } from './TechnicalExplanationCard';

interface SqlStudioProps {
  queries: SqlQueryResult[];
}

export const SqlStudio: React.FC<SqlStudioProps> = ({ queries }) => {
  const [selectedQueryId, setSelectedQueryId] = useState<string>(queries[0]?.queryId || '');
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'results' | 'erd'>('results');

  const activeQuery = queries.find(q => q.queryId === selectedQueryId) || queries[0];

  const handleCopySql = () => {
    if (!activeQuery) return;
    navigator.clipboard.writeText(activeQuery.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Explicação Técnica de SQL Analítico e Window Functions */}
      <TechnicalExplanationCard
        badge="PostgreSQL 15 • Window Functions (Etapa 3)"
        title="O Que São Window Functions e Por Que Elas Superam Queries Triviais?"
        summary="Diferente de agregações comuns com GROUP BY que colapsam linhas, Window Functions realizam cálculos através de um conjunto de linhas relacionadas mantendo a granularidade individual de cada registro."
        problemSolved="Calcular métricas temporais (como crescimento percentual mês a mês ou rankings competitivos) sem window functions exige múltiplos auto-joins lentos ou subqueries correlacionadas que derrubam o throughput do banco de dados."
        howItWorks={[
          'LAG(faturamento_total) OVER (ORDER BY mes_ano): Acessa a linha temporal imediatamente anterior para calcular variações relativas (MoM %) sem self-joins.',
          'DENSE_RANK() OVER (ORDER BY lucro_total DESC): Atribui posições contínuas sem pular números em caso de empates de faturamento.',
          'SUM(faturamento_total) OVER (): Executa a soma total nacional em paralelo, permitindo calcular o percentual de share de cada cliente ou região instantaneamente.',
          'Estrutura CTE (WITH ... AS): Organiza a leitura em blocos lógicos modulares, facilitando manutenção, testes unitários de SQL e documentação.'
        ]}
        seniorDifferentiator="Demonstra maestria em SQL analítico sênior com compreensão clara de particionamento, ordenação de janelas e otimização de custo de query no PostgreSQL."
        accentColor="purple"
      />

      {/* Top Bar with Query Selection Tabs */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              SQL Studio Analítico (Etapa 3 - Consultas Avançadas PostgreSQL)
            </h3>
            <p className="text-xs text-slate-400">
              Consultas SQL otimizadas com Window Functions (LAG, DENSE_RANK, SUM OVER), CTEs e agregações multidimensionais.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('results')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'results'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5 inline mr-1" />
              Resultados da Query
            </button>
            <button
              onClick={() => setViewMode('erd')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'erd'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5 inline mr-1" />
              Modelo Relacional (ERD)
            </button>
          </div>
        </div>

        {/* Query Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
          {queries.map((q) => {
            const isSelected = q.queryId === selectedQueryId;
            return (
              <button
                key={q.queryId}
                onClick={() => setSelectedQueryId(q.queryId)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200 ring-1 ring-cyan-500/40'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold truncate">{q.title}</div>
                <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">{q.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {viewMode === 'results' ? (
        <div className="space-y-4">
          {/* Query SQL Code Block */}
          {activeQuery && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
              <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-semibold text-slate-300">
                    {activeQuery.title}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Executado em {activeQuery.executionTimeMs}ms
                  </span>
                  <button
                    onClick={handleCopySql}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700 active:scale-95"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" /> Copiar SQL
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-950 font-mono text-xs text-cyan-200/90 overflow-x-auto leading-relaxed max-h-56">
                <pre>{activeQuery.sql}</pre>
              </div>
            </div>
          )}

          {/* Table of Results */}
          {activeQuery && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
              <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-purple-400" />
                  Resultado da Consulta ({activeQuery.rows.length} registros retornados)
                </h4>
                <span className="text-[11px] font-mono text-slate-500">PostgreSQL Engine v15</span>
              </div>

              <div className="max-h-96 overflow-auto text-xs font-mono">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-900 text-slate-400 sticky top-0 border-b border-slate-800">
                    <tr>
                      {activeQuery.columns.map((col) => (
                        <th key={col} className="p-3 font-semibold uppercase tracking-wider text-[11px]">
                          {col.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {activeQuery.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50">
                        {activeQuery.columns.map((col) => {
                          const val = String(row[col] ?? '');
                          const isHighProfit = val.includes('Alta') || val.includes('+');
                          const isPositivePct = val.startsWith('+');
                          const isMoney = val.startsWith('R$');

                          return (
                            <td
                              key={col}
                              className={`p-3 ${
                                isPositivePct
                                  ? 'text-emerald-400 font-bold'
                                  : isHighProfit
                                  ? 'text-purple-400 font-bold'
                                  : isMoney
                                  ? 'text-slate-100 font-semibold'
                                  : 'text-slate-300'
                              }`}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ERD SCHEMA DIAGRAM VIEW */
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
          <div className="max-w-2xl">
            <h4 className="text-base font-bold text-white">Modelo de Dados Relacional (PostgreSQL 15)</h4>
            <p className="text-xs text-slate-400 mt-1">
              Esquema em estrela/floco de neve otimizado para análises OLAP, com integridade referencial estrita e índices em chaves e datas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Clientes */}
            <div className="p-4 rounded-xl border border-slate-700 bg-slate-950 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-cyan-400 font-mono">clientes</span>
                <span className="text-[10px] uppercase font-semibold text-slate-500">Dimensão</span>
              </div>
              <ul className="text-xs font-mono space-y-1.5 text-slate-300">
                <li className="text-amber-400 font-semibold">🔑 id_cliente (PK)</li>
                <li>nome (VARCHAR)</li>
                <li>email (VARCHAR UNIQUE)</li>
                <li>regiao (CHECK)</li>
                <li>segmento (CHECK)</li>
                <li>data_cadastro (DATE)</li>
              </ul>
            </div>

            {/* Vendedores */}
            <div className="p-4 rounded-xl border border-slate-700 bg-slate-950 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-blue-400 font-mono">vendedores</span>
                <span className="text-[10px] uppercase font-semibold text-slate-500">Dimensão</span>
              </div>
              <ul className="text-xs font-mono space-y-1.5 text-slate-300">
                <li className="text-amber-400 font-semibold">🔑 id_vendedor (PK)</li>
                <li>nome (VARCHAR)</li>
                <li>email (VARCHAR UNIQUE)</li>
                <li>meta_mensal (NUMERIC)</li>
                <li>data_admissao (DATE)</li>
                <li>ativo (BOOLEAN)</li>
              </ul>
            </div>

            {/* Produtos */}
            <div className="p-4 rounded-xl border border-slate-700 bg-slate-950 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-purple-400 font-mono">produtos</span>
                <span className="text-[10px] uppercase font-semibold text-slate-500">Dimensão</span>
              </div>
              <ul className="text-xs font-mono space-y-1.5 text-slate-300">
                <li className="text-amber-400 font-semibold">🔑 id_produto (PK)</li>
                <li>nome (VARCHAR)</li>
                <li>categoria (VARCHAR)</li>
                <li>preco_tabela (NUMERIC)</li>
                <li>custo_medio (NUMERIC)</li>
                <li className="text-slate-500">chk_lucro_positivo</li>
              </ul>
            </div>

            {/* Vendas (FATO) */}
            <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-900/60 pb-2">
                <span className="text-xs font-bold text-emerald-300 font-mono">vendas</span>
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">
                  Tabela Fato
                </span>
              </div>
              <ul className="text-xs font-mono space-y-1.5 text-slate-200">
                <li className="text-amber-400 font-semibold">🔑 id_venda (PK)</li>
                <li className="text-cyan-400">🔗 id_cliente (FK)</li>
                <li className="text-blue-400">🔗 id_vendedor (FK)</li>
                <li className="text-purple-400">🔗 id_produto (FK)</li>
                <li>quantidade (INTEGER)</li>
                <li>preco_unitario (NUMERIC)</li>
                <li className="font-bold text-emerald-300">faturamento_total (NUMERIC)</li>
                <li>custo_total (NUMERIC)</li>
                <li className="font-bold text-purple-300">lucro_bruto (NUMERIC)</li>
                <li>data_venda (DATE INDEX)</li>
                <li>status_pagamento (CHECK)</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
