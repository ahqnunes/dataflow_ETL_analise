import React, { useState } from 'react';
import {
  Code2,
  Play,
  Download,
  Copy,
  Check,
  Table as TableIcon,
  Sparkles,
  Database,
  Clock,
  RotateCcw
} from 'lucide-react';
import { SqlQueryResult, CleanSaleRecord } from '../types/pipeline';
import { executeCustomSqlQuery } from '../services/pipelineSimulator';
import { TechnicalExplanationCard } from './TechnicalExplanationCard';

interface CustomSqlPlaygroundProps {
  records: CleanSaleRecord[];
}

const SQL_TEMPLATES = [
  {
    name: 'Faturamento por Categoria',
    sql: `SELECT
    categoria,
    COUNT(id_venda) AS total_pedidos,
    SUM(faturamento_total) AS faturamento_total,
    SUM(lucro_bruto) AS lucro_bruto,
    ROUND((SUM(lucro_bruto) / SUM(faturamento_total)) * 100, 2) AS margem_pct
FROM vendas
GROUP BY categoria
ORDER BY faturamento_total DESC;`
  },
  {
    name: 'Desempenho por Canal de Venda',
    sql: `SELECT
    canal_venda,
    COUNT(id_venda) AS total_pedidos,
    SUM(faturamento_total) AS faturamento_total,
    ROUND(AVG(faturamento_total), 2) AS ticket_medio
FROM vendas
GROUP BY canal_venda
ORDER BY faturamento_total DESC;`
  },
  {
    name: 'Top 15 Maiores Vendas Individuais',
    sql: `SELECT
    id_venda,
    id_cliente,
    nome_produto,
    quantidade,
    faturamento_total,
    data_venda
FROM vendas
ORDER BY faturamento_total DESC
LIMIT 15;`
  },
  {
    name: 'Amostra Geral da Tabela Fato (vendas)',
    sql: `SELECT *
FROM vendas
WHERE status_pagamento = 'Aprovado'
LIMIT 20;`
  }
];

export const CustomSqlPlayground: React.FC<CustomSqlPlaygroundProps> = ({ records }) => {
  const [sqlCode, setSqlCode] = useState<string>(SQL_TEMPLATES[0].sql);
  const [activeResult, setActiveResult] = useState<SqlQueryResult>(() =>
    executeCustomSqlQuery(SQL_TEMPLATES[0].sql, records)
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleExecute = () => {
    setIsExecuting(true);
    setTimeout(() => {
      const res = executeCustomSqlQuery(sqlCode, records);
      setActiveResult(res);
      setIsExecuting(false);
    }, 150);
  };

  const handleSelectTemplate = (templateSql: string) => {
    setSqlCode(templateSql);
    const res = executeCustomSqlQuery(templateSql, records);
    setActiveResult(res);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCsv = () => {
    if (!activeResult || activeResult.rows.length === 0) return;
    const cols = activeResult.columns;
    const header = cols.join(',');
    const rows = activeResult.rows.map(r => cols.map(c => `"${r[c] ?? ''}"`).join(','));
    const csvContent = [header, ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_result_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Explicação Técnica do SQL Engine */}
      <TechnicalExplanationCard
        badge="PostgreSQL 15 • Motor OLAP"
        title="Como o Motor SQL Analítico Processa Agregações em Milissegundos?"
        summary="O Data Warehouse foi modelado com índices otimizados e esquemas estrela (Star Schema) para suportar queries de agregação massiva (GROUP BY, SUM, AVG) e Window Functions complexas."
        problemSolved="Executar agregações analíticas em bancos transacionais (OLTP) sem otimização causa lock de tabelas de vendas em produção e latência inaceitável para relatórios gerenciais."
        howItWorks={[
          'Modelagem Dimensional: Separação entre tabela fato (vendas) e tabelas de dimensões (clientes, vendedores, produtos) via chaves substitutas (Surrogate Keys).',
          'Window Functions: LAG() e DENSE_RANK() calculam comparações temporais e rankings em um único scan de tabela sem subconsultas correlacionadas lentas.',
          'Exportação Imediata: Resultados podem ser descarregados instantaneamente em formato CSV para consumo por ferramentas de BI externas (Power BI, Tableau, Metabase).'
        ]}
        seniorDifferentiator="Demonstra capacidade de escrever queries SQL analíticas de alto nível, interpretando planos de execução e agregando valor diretamente na camada de dados."
        accentColor="cyan"
      />

      {/* Top Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 mb-1.5">
              <Database className="w-3.5 h-3.5" /> PostgreSQL Interactive Playground
            </div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Editor SQL Livre & Executor de Consultas Customizadas
            </h3>
            <p className="text-xs text-slate-400">
              Escreva qualquer consulta SQL sobre as tabelas carregadas no Data Warehouse ou selecione templates de modelagem para testar em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isExecuting ? 'Executando...' : 'Executar SQL (Run)'}
            </button>
          </div>
        </div>

        {/* Template selector */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-800/80">
          <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Templates Prontos:
          </span>
          {SQL_TEMPLATES.map((tmpl, i) => (
            <button
              key={i}
              onClick={() => handleSelectTemplate(tmpl.sql)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            >
              {tmpl.name}
            </button>
          ))}
        </div>
      </div>

      {/* Code Editor Box */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-semibold text-slate-300">
              PostgreSQL Query Buffer
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>

        <div className="p-3 bg-slate-950">
          <textarea
            value={sqlCode}
            onChange={(e) => setSqlCode(e.target.value)}
            rows={7}
            className="w-full bg-slate-950 text-cyan-300 font-mono text-xs leading-relaxed focus:outline-none resize-y border-0 p-2 selection:bg-cyan-900 selection:text-white"
            placeholder="Escreva sua query SQL aqui (ex: SELECT * FROM vendas)..."
          />
        </div>
      </div>

      {/* Results Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
        <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-purple-400" />
              Resultado da Execução ({activeResult.rows.length} linhas retornadas)
            </h4>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {activeResult.executionTimeMs} ms
            </span>
          </div>

          <button
            onClick={handleExportCsv}
            disabled={activeResult.rows.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> Exportar CSV
          </button>
        </div>

        <div className="max-h-80 overflow-auto text-xs font-mono">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-slate-400 sticky top-0 border-b border-slate-800">
              <tr>
                {activeResult.columns.map((col) => (
                  <th key={col} className="p-2.5 font-semibold uppercase tracking-wider text-[11px]">
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {activeResult.rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-900/50">
                  {activeResult.columns.map((col) => (
                    <td key={col} className="p-2.5 text-slate-300">
                      {String(row[col] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
