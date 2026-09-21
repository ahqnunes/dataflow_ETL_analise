import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Percent,
  Download,
  Copy,
  Check,
  FileText,
  FileJson,
  Sparkles,
  Award,
  MapPin
} from 'lucide-react';
import { ExecutiveReport } from '../types/pipeline';
import { TechnicalExplanationCard } from './TechnicalExplanationCard';

interface ExecutiveDashboardProps {
  report: ExecutiveReport;
}

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ report }) => {
  const [activeReportTab, setActiveReportTab] = useState<'charts' | 'markdown' | 'json'>('charts');
  const [copied, setCopied] = useState(false);

  // Markdown representation of the report
  const markdownContent = `# 📊 Relatório Executivo de Inteligência Comercial
*Gerado automaticamente pelo pipeline DataFlow ETL em ${report.timestamp}*

## 1. Visão Geral dos Indicadores Chave (KPIs)
- **Faturamento Bruto:** R$ ${report.kpis.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- **Lucro Bruto:** R$ ${report.kpis.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- **Margem de Lucro Global:** ${report.kpis.grossMarginPct}%
- **Total de Vendas Aprovadas:** ${report.kpis.totalOrders} pedidos
- **Ticket Médio por Transação:** R$ ${report.kpis.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

## 2. Top 5 Produtos Mais Rentáveis (Classificados por DENSE_RANK)
| Rank | Produto | Categoria | Qtd | Faturamento | Lucro Bruto | Margem % |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${report.top5Products.map(p => `| #${p.rank} | ${p.name} | ${p.category} | ${p.quantity} | R$ ${p.revenue.toLocaleString('pt-BR')} | R$ ${p.profit.toLocaleString('pt-BR')} | ${p.marginPct}% |`).join('\n')}

## 3. Desempenho Regional & Penetração de Mercado
| Região | Segmento | Clientes | Pedidos | Faturamento | Ticket Médio | Share % |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${report.regionalAnalysis.map(r => `| ${r.region} | ${r.segment} | ${r.clientsCount} | ${r.ordersCount} | R$ ${r.revenue.toLocaleString('pt-BR')} | R$ ${r.averageTicket.toLocaleString('pt-BR')} | ${r.sharePct}% |`).join('\n')}

---
*Pipeline auditado e executado sob PostgreSQL 15 com persistência transacional.*`;

  const jsonContent = JSON.stringify(report, null, 2);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Explicação Técnica de BI e Analytics */}
      <TechnicalExplanationCard
        badge="Analytics • Business Intelligence & Relatórios"
        title="Como o Pipeline Converte Dados Brutos em Decisões Comerciais?"
        summary="A camada analítica traduz dados limpos e modelados em indicadores de rentabilidade, crescimento mês a mês (MoM), rankings de produtos e penetração regional."
        problemSolved="Muitas empresas possuem terabytes de dados armazenados, mas diretores e tomadores de decisão continuam sem saber quais produtos dão margem de lucro real e quais regiões estão em declínio de receita."
        howItWorks={[
          'Agregação em Memória/Banco: Os KPIs (faturamento, lucro, margem, ticket médio) são computados diretamente do conjunto de dados higienizado.',
          'Exportação Multiformato: O sistema gera simultaneamente JSON estruturado (para APIs/integrações) e Markdown executivo (para relatórios internos).',
          'Comparações Temporais: Visualizações de receita por mês permitem identificar sazonalidade e taxa de crescimento.',
          'Segmentação de Rentabilidade: Gráficos de barras e pizza destacam visualmente a distribuição de faturamento por categoria e canal.'
        ]}
        seniorDifferentiator="Demonstra visão de negócio (Product & Business Sense) orientada a resultados: dados não existem para ficar parados, mas para gerar receita e eficiência operacional."
        accentColor="purple"
      />

      {/* Top Banner & KPI Cards */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Painel de Inteligência Comercial & Relatório Executivo (Etapa 3)
            </h3>
            <p className="text-xs text-slate-400">
              Métricas consolidadas derivadas das consultas SQL analíticas executadas no PostgreSQL.
            </p>
          </div>

          {/* Toggle between BI charts and textual reports */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveReportTab('charts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeReportTab === 'charts'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Gráficos BI
            </button>
            <button
              onClick={() => setActiveReportTab('markdown')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeReportTab === 'markdown'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5 inline mr-1" />
              Relatório (.MD)
            </button>
            <button
              onClick={() => setActiveReportTab('json')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeReportTab === 'json'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileJson className="w-3.5 h-3.5 inline mr-1" />
              Resumo (.JSON)
            </button>
          </div>
        </div>

        {/* 4 Core KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Faturamento Bruto</span>
              <div className="p-1.5 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono">
              R$ {report.kpis.totalRevenue.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-emerald-400 font-medium">
              Vendas aprovadas no período
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Lucro Bruto Consolidado</span>
              <div className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono">
              R$ {report.kpis.totalProfit.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Dedução de custo médio unitário
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Margem Bruta Média</span>
              <div className="p-1.5 rounded-lg bg-purple-950/60 text-purple-400 border border-purple-800/40">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-purple-400 font-mono">
              {report.kpis.grossMarginPct}%
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              (Lucro Total / Faturamento)
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Ticket Médio por Pedido</span>
              <div className="p-1.5 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800/40">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-amber-400 font-mono">
              R$ {report.kpis.averageTicket.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Em {report.kpis.totalOrders} pedidos fechados
            </div>
          </div>
        </div>
      </div>

      {activeReportTab === 'charts' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Faturamento Mensal (Area Chart) */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Evolução do Faturamento & Lucro Mensal</h4>
                <p className="text-xs text-slate-400">Agrupamento temporal com LAG e crescimento MoM %</p>
              </div>
              <span className="text-xs font-mono text-cyan-400">Query 1</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={report.monthlyRevenue}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    formatter={(val: any) => [`R$ ${Number(val || 0).toLocaleString('pt-BR')}`, '']}
                  />
                  <Area type="monotone" dataKey="revenue" name="Faturamento" stroke="#06b6d4" fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="profit" name="Lucro Bruto" stroke="#10b981" fillOpacity={1} fill="url(#colorProf)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top 5 Produtos Mais Rentáveis (Bar Chart) */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Top 5 Produtos Mais Rentáveis</h4>
                <p className="text-xs text-slate-400">Classificação via DENSE_RANK() por Lucro Bruto</p>
              </div>
              <span className="text-xs font-mono text-purple-400">Query 2</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.top5Products} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={130} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    formatter={(val: any) => [`R$ ${Number(val || 0).toLocaleString('pt-BR')}`, '']}
                  />
                  <Bar dataKey="profit" name="Lucro Bruto" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="revenue" name="Faturamento" fill="#0ea5e9" radius={[0, 4, 4, 0]} opacity={0.6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Participação Regional (Bar / Share Chart) */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  Distribuição Geográfica e Ticket Médio por Região
                </h4>
                <p className="text-xs text-slate-400">Análise de share nacional com SUM() OVER() (Query 3)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {report.regionalAnalysis.map((reg, idx) => (
                <div key={idx} className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{reg.region} ({reg.segment})</span>
                    <span className="text-[11px] font-mono text-cyan-400 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                      {reg.sharePct}% share
                    </span>
                  </div>
                  <div className="text-base font-bold text-white font-mono">
                    R$ {reg.revenue.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-slate-900">
                    <span>Ticket Médio:</span>
                    <span className="text-emerald-400 font-mono font-medium">R$ {reg.averageTicket.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeReportTab === 'markdown' ? (
        /* Markdown View */
        <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl space-y-4">
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" /> data/reports/relatorio_comercial.md
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(markdownContent)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
              <button
                onClick={() => handleDownloadFile('relatorio_comercial.md', markdownContent, 'text/markdown')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" /> Baixar .MD
              </button>
            </div>
          </div>
          <div className="p-6 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
            {markdownContent}
          </div>
        </div>
      ) : (
        /* JSON View */
        <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl space-y-4">
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300 flex items-center gap-2">
              <FileJson className="w-4 h-4 text-purple-400" /> data/reports/resumo_executivo.json
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(jsonContent)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
              <button
                onClick={() => handleDownloadFile('resumo_executivo.json', jsonContent, 'application/json')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium bg-purple-500 hover:bg-purple-400 text-slate-950 transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" /> Baixar .JSON
              </button>
            </div>
          </div>
          <div className="p-6 font-mono text-xs text-cyan-200 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
            {jsonContent}
          </div>
        </div>
      )}
    </div>
  );
};
