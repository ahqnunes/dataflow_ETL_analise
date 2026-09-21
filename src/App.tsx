import { useState, useEffect } from 'react';
import {
  BarChart3,
  GitBranch,
  Database,
  Code2,
  Terminal,
  ShieldCheck,
  FileSpreadsheet,
  Play,
  Loader2,
  UploadCloud
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { PipelineConsole } from './components/PipelineConsole';
import { DataQualityDiff } from './components/DataQualityDiff';
import { SqlStudio } from './components/SqlStudio';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { CodeExplorer } from './components/CodeExplorer';
import { DataContractsSuite } from './components/DataContractsSuite';
import { DeadLetterQueue } from './components/DeadLetterQueue';
import { CustomSqlPlayground } from './components/CustomSqlPlayground';
import { CsvUploaderModal } from './components/CsvUploaderModal';
import { AirflowDagView } from './components/AirflowDagView';

import {
  PipelineStage,
  PipelineLog,
  RawSaleRecord,
  CleanSaleRecord,
  DataQualityReport,
  SqlQueryResult,
  ExecutiveReport,
  DataContractTest,
  QuarantineRecord
} from './types/pipeline';
import {
  generateDirtyData,
  transformDirtyData,
  runAnalyticalQueries,
  generateExecutiveReportData,
  evaluateDataContracts,
  extractQuarantineRecords
} from './services/pipelineSimulator';

/* ------------------------------------------------------------------ */
/* Tipos e constantes                                                  */
/* ------------------------------------------------------------------ */

type MainTab = 'overview' | 'pipeline' | 'sql' | 'code';
type PipelineTab = 'dag' | 'console' | 'quality' | 'diff';
type SqlTab = 'window_functions' | 'playground';
type Step = 'generate' | 'extract' | 'transform' | 'load' | 'analyze' | 'report';

type TabItem<T extends string> = {
  id: T;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

const STAGE_LABEL: Record<string, string> = {
  generating: 'Gerando dados',
  extracting: 'Extraindo',
  transforming: 'Limpando',
  loading: 'Carregando',
  analyzing: 'Analisando',
  reporting: 'Gerando relatório',
  completed: 'Pronto'
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const round2 = (n: number) => Math.round(n * 100) / 100;

/* ------------------------------------------------------------------ */
/* Navegação                                                           */
/* ------------------------------------------------------------------ */

/** Alternador de sub-seções (pílula branca, item ativo em tinta escura) */
function Segmented<T extends string>({
  tabs,
  value,
  onChange
}: {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-card p-1 ring-1 ring-line scrollbar-none">
      {tabs.map(({ id, label, icon: Icon, badge }) => {
        const active = id === value;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-pressed={active}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              active ? 'bg-ink text-on' : 'text-muted hover:text-ink'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {!!badge && (
              <span
                className={`rounded-full px-1.5 text-[11px] font-semibold ${
                  active ? 'bg-on/20 text-on' : 'bg-amber-900 text-amber-300'
                }`}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

export default function App() {
  const [mainTab, setMainTab] = useState<MainTab>('overview');
  const [pipelineTab, setPipelineTab] = useState<PipelineTab>('dag');
  const [sqlTab, setSqlTab] = useState<SqlTab>('window_functions');
  const [qualityView, setQualityView] = useState<'contracts' | 'dlq'>('contracts');

  const [stage, setStage] = useState<PipelineStage>('completed');
  const [isRunning, setIsRunning] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [rawRecords, setRawRecords] = useState<RawSaleRecord[]>([]);
  const [cleanRecords, setCleanRecords] = useState<CleanSaleRecord[]>([]);
  const [metrics, setMetrics] = useState<DataQualityReport | null>(null);
  const [queries, setQueries] = useState<SqlQueryResult[]>([]);
  const [executiveReport, setExecutiveReport] = useState<ExecutiveReport | null>(null);
  const [logs, setLogs] = useState<PipelineLog[]>([]);
  const [contracts, setContracts] = useState<DataContractTest[]>([]);
  const [quarantineRecords, setQuarantineRecords] = useState<QuarantineRecord[]>([]);

  useEffect(() => {
    initializePipelineData();
  }, []);

  const addLog = (
    stageName: PipelineLog['stage'],
    level: PipelineLog['level'],
    message: string
  ) => {
    const newLog: PipelineLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      stage: stageName,
      level,
      message
    };
    setLogs((prev) => [...prev, newLog]);
  };

  const initializePipelineData = () => {
    const raw = generateDirtyData(75);
    const { cleanRecords: clean, report } = transformDirtyData(raw);
    const dlq = extractQuarantineRecords(raw);

    setRawRecords(raw);
    setCleanRecords(clean);
    setMetrics(report);
    setQueries(runAnalyticalQueries(clean));
    setExecutiveReport(generateExecutiveReportData(clean));
    setContracts(evaluateDataContracts(raw, clean));
    setQuarantineRecords(dlq);

    const now = new Date().toLocaleTimeString('pt-BR');
    setLogs([
      { id: '1', timestamp: now, stage: 'SISTEMA', level: 'info', message: 'Tudo pronto.' },
      {
        id: '2',
        timestamp: now,
        stage: 'TRANSFORMAÇÃO',
        level: 'success',
        message: `${clean.length} registros prontos.`
      },
      {
        id: '3',
        timestamp: now,
        stage: 'EXTRAÇÃO',
        level: 'info',
        message: `${dlq.length} registros com problemas.`
      }
    ]);
  };

  /* ---------- Pipeline completo ---------- */
  const handleRunFullPipeline = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setMainTab('pipeline');
    setPipelineTab('console');
    setLogs([]);

    try {
      addLog('SISTEMA', 'info', 'Processo iniciado.');

      setStage('generating');
      addLog('GERADOR', 'info', 'Criando dados...');
      await wait(600);
      const raw = generateDirtyData(90);
      setRawRecords(raw);
      addLog('GERADOR', 'success', `${raw.length} vendas geradas.`);

      setStage('extracting');
      addLog('EXTRAÇÃO', 'info', 'Lendo arquivos...');
      await wait(600);
      const dlq = extractQuarantineRecords(raw);
      setQuarantineRecords(dlq);
      addLog('EXTRAÇÃO', 'warning', `${dlq.length} registros com problemas separados.`);

      setStage('transforming');
      addLog('TRANSFORMAÇÃO', 'info', 'Limpando dados...');
      await wait(800);
      const { cleanRecords: clean, report } = transformDirtyData(raw);
      const newContracts = evaluateDataContracts(raw, clean);
      setCleanRecords(clean);
      setMetrics(report);
      setContracts(newContracts);
      addLog('TRANSFORMAÇÃO', 'info', `${report.duplicatesRemoved} duplicados removidos.`);
      addLog('TRANSFORMAÇÃO', 'info', `${report.datesSanitized} datas corrigidas.`);
      addLog('TRANSFORMAÇÃO', 'info', `${report.currenciesFixed} valores corrigidos.`);
      addLog('TRANSFORMAÇÃO', 'success', `${newContracts.length} verificações feitas.`);

      setStage('loading');
      addLog('CARGA', 'info', 'Salvando...');
      await wait(700);
      addLog('CARGA', 'success', `${clean.length} vendas salvas.`);

      setStage('analyzing');
      addLog('ANALYTICS', 'info', 'Analisando...');
      await wait(700);
      const newQueries = runAnalyticalQueries(clean);
      setQueries(newQueries);
      addLog('ANALYTICS', 'success', `${newQueries.length} análises concluídas.`);

      setStage('reporting');
      addLog('RELATÓRIO', 'info', 'Gerando relatório...');
      await wait(600);
      setExecutiveReport(generateExecutiveReportData(clean));
      addLog('RELATÓRIO', 'success', 'Relatório gerado.');
      addLog('SISTEMA', 'success', 'Processo concluído.');
    } catch (err) {
      addLog('SISTEMA', 'warning', `Falha: ${err instanceof Error ? err.message : 'erro desconhecido'}`);
    } finally {
      setStage('completed');
      setIsRunning(false);
    }
  };

  /* ---------- Passo a passo ---------- */
  const handleRunStep = async (step: Step) => {
    if (isRunning) return;
    setIsRunning(true);

    try {
      if (step === 'generate') {
        setStage('generating');
        addLog('GERADOR', 'info', 'Criando dados...');
        await wait(500);
        const raw = generateDirtyData(60);
        setRawRecords(raw);
        addLog('GERADOR', 'success', `${raw.length} registros gerados.`);
      } else if (step === 'extract') {
        setStage('extracting');
        addLog('EXTRAÇÃO', 'info', 'Lendo arquivos...');
        await wait(500);
        const dlq = extractQuarantineRecords(rawRecords);
        setQuarantineRecords(dlq);
        addLog('EXTRAÇÃO', 'success', `${rawRecords.length} lidos, ${dlq.length} com problemas.`);
      } else if (step === 'transform') {
        setStage('transforming');
        addLog('TRANSFORMAÇÃO', 'info', 'Limpando dados...');
        await wait(600);
        const { cleanRecords: clean, report } = transformDirtyData(rawRecords);
        setCleanRecords(clean);
        setMetrics(report);
        setContracts(evaluateDataContracts(rawRecords, clean));
        addLog('TRANSFORMAÇÃO', 'success', `${clean.length} registros limpos (${report.qualityScorePct}% de qualidade).`);
      } else if (step === 'load') {
        setStage('loading');
        addLog('CARGA', 'info', 'Salvando...');
        await wait(500);
        addLog('CARGA', 'success', `${cleanRecords.length} vendas salvas.`);
      } else if (step === 'analyze') {
        setStage('analyzing');
        addLog('ANALYTICS', 'info', 'Analisando...');
        await wait(500);
        setQueries(runAnalyticalQueries(cleanRecords));
        addLog('ANALYTICS', 'success', 'Análises concluídas.');
      } else if (step === 'report') {
        setStage('reporting');
        addLog('RELATÓRIO', 'info', 'Gerando relatório...');
        await wait(500);
        setExecutiveReport(generateExecutiveReportData(cleanRecords));
        addLog('RELATÓRIO', 'success', 'Relatório gerado.');
      }
    } catch (err) {
      addLog('SISTEMA', 'warning', `Falha: ${err instanceof Error ? err.message : 'erro desconhecido'}`);
    } finally {
      setStage('completed');
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    initializePipelineData();
    setStage('completed');
    addLog('SISTEMA', 'info', 'Dados reiniciados.');
  };

  const handleUploadSuccess = (uploadedRaw: RawSaleRecord[]) => {
    const { cleanRecords: clean, report } = transformDirtyData(uploadedRaw);

    setRawRecords(uploadedRaw);
    setCleanRecords(clean);
    setMetrics(report);
    setContracts(evaluateDataContracts(uploadedRaw, clean));
    setQuarantineRecords(extractQuarantineRecords(uploadedRaw));
    setQueries(runAnalyticalQueries(clean));
    setExecutiveReport(generateExecutiveReportData(clean));

    addLog('EXTRAÇÃO', 'success', `Arquivo recebido: ${uploadedRaw.length} linhas.`);
    addLog('TRANSFORMAÇÃO', 'success', `${clean.length} registros limpos.`);
    setMainTab('pipeline');
    setPipelineTab('diff');
  };

  /* ---------- Quarentena ---------- */
  const handleReprocessDlq = (id: string) => {
    const item = quarantineRecords.find((q) => q.id === id);
    if (!item) return;

    const quantidade = Math.max(1, Math.abs(Number(item.rawPayload.quantidade) || 1));
    const preco = Math.max(1, Math.abs(Number(item.rawPayload.preco_unitario) || 1500));
    const faturamento = round2(quantidade * preco);
    const custo = round2(faturamento * 0.6);
    const hoje = new Date().toISOString().slice(0, 10);

    const repaired: CleanSaleRecord = {
      id_venda: item.originalIdVenda,
      id_cliente: item.rawPayload.id_cliente || 'CLI_001',
      id_vendedor: item.rawPayload.id_vendedor || 'VEND_001',
      id_produto: item.rawPayload.id_produto || 'PROD_001',
      nome_produto: 'Produto regularizado',
      categoria: 'Hardware',
      quantidade,
      preco_unitario: preco,
      faturamento_total: faturamento,
      custo_total: custo,
      lucro_bruto: round2(faturamento - custo),
      margem_pct: 40,
      mes_ano: hoje.slice(0, 7),
      data_venda: hoje,
      canal_venda: item.rawPayload.canal_venda || 'Online',
      status_pagamento: 'Aprovado'
    };

    const next = [repaired, ...cleanRecords];
    setQuarantineRecords((prev) => prev.filter((q) => q.id !== id));
    setCleanRecords(next);
    setQueries(runAnalyticalQueries(next));
    setExecutiveReport(generateExecutiveReportData(next));
    addLog('TRANSFORMAÇÃO', 'success', `Registro ${item.originalIdVenda} recuperado.`);
  };

  const handleClearQuarantine = () => {
    setQuarantineRecords([]);
    addLog('EXTRAÇÃO', 'info', 'Lista de problemas limpa.');
  };

  /* ---------- Definição das abas ---------- */
  const mainTabs: TabItem<MainTab>[] = [
    { id: 'overview', label: 'Painel', icon: BarChart3 },
    { id: 'pipeline', label: 'Processo', icon: GitBranch },
    { id: 'sql', label: 'Análises', icon: Database },
    { id: 'code', label: 'Código', icon: Code2 }
  ];

  const pipelineTabs: TabItem<PipelineTab>[] = [
    { id: 'dag', label: 'Fluxo', icon: GitBranch },
    { id: 'console', label: 'Registro', icon: Terminal },
    { id: 'quality', label: 'Qualidade', icon: ShieldCheck, badge: quarantineRecords.length },
    { id: 'diff', label: 'Antes e depois', icon: FileSpreadsheet }
  ];

  const sqlTabs: TabItem<SqlTab>[] = [
    { id: 'window_functions', label: 'Consultas', icon: Database },
    { id: 'playground', label: 'Editor', icon: Code2 }
  ];

  const qualityTabs: TabItem<'contracts' | 'dlq'>[] = [
    { id: 'contracts', label: 'Verificações', icon: ShieldCheck },
    { id: 'dlq', label: 'Problemas', icon: FileSpreadsheet, badge: quarantineRecords.length }
  ];

  const currentTitle = mainTabs.find((t) => t.id === mainTab)?.label ?? '';
  const stageLabel = STAGE_LABEL[stage] ?? String(stage);

  return (
    <div className="min-h-screen bg-paper text-ink lg:pl-60">
      {/* Barra lateral (desktop) */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col bg-accent p-4 lg:flex">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-on font-display text-lg font-bold text-accent">
            D
          </span>
          <span className="font-display text-lg font-semibold text-on">DataFlow</span>
        </div>

        <nav className="mt-8 flex flex-col gap-1" aria-label="Navegação principal">
          {mainTabs.map(({ id, label, icon: Icon }) => {
            const active = id === mainTab;
            return (
              <button
                key={id}
                onClick={() => setMainTab(id)}
                aria-current={active ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? 'bg-on text-accent' : 'text-on/85 hover:bg-on/10'
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto flex items-center gap-2 px-3 text-sm text-on/75">
          <Database className="h-4 w-4" />
          {cleanRecords.length} vendas
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        {/* Topo */}
        <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 pt-5 sm:px-6 lg:px-10 lg:pt-8">
            <h1 className="text-2xl font-semibold sm:text-3xl">{currentTitle}</h1>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden items-center gap-2 text-sm text-muted md:inline-flex">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isRunning ? 'animate-pulse bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
                {stageLabel}
              </span>

              <button
                onClick={() => setIsUploadModalOpen(true)}
                aria-label="Enviar CSV"
                className="inline-flex items-center gap-2 rounded-full bg-card px-3.5 py-2 text-sm font-medium text-ink ring-1 ring-line transition-colors hover:bg-line/60"
              >
                <UploadCloud className="h-4 w-4" />
                <span className="hidden sm:inline">Enviar CSV</span>
              </button>

              <button
                onClick={handleRunFullPipeline}
                disabled={isRunning}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-on transition-colors hover:bg-accent-deep disabled:opacity-60"
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isRunning ? 'Rodando' : 'Executar'}
              </button>
            </div>
          </div>

          {(mainTab === 'pipeline' || mainTab === 'sql') && (
            <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:px-10">
              {mainTab === 'pipeline' && (
                <Segmented tabs={pipelineTabs} value={pipelineTab} onChange={setPipelineTab} />
              )}
              {mainTab === 'sql' && <Segmented tabs={sqlTabs} value={sqlTab} onChange={setSqlTab} />}
            </div>
          )}
          <div className="h-4" />
        </header>

        {/* Conteúdo */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 sm:px-6 lg:px-10 lg:pb-10">
          {mainTab === 'overview' && executiveReport && (
            <ExecutiveDashboard report={executiveReport} />
          )}

          {mainTab === 'pipeline' && (
            <div className="space-y-6">
              {pipelineTab === 'dag' && (
                <AirflowDagView stage={stage} onTriggerDag={handleRunFullPipeline} />
              )}

              {pipelineTab === 'console' && (
                <PipelineConsole
                  stage={stage}
                  logs={logs}
                  metrics={metrics}
                  isRunning={isRunning}
                  onRunFullPipeline={handleRunFullPipeline}
                  onRunStep={handleRunStep}
                  onReset={handleReset}
                />
              )}

              {pipelineTab === 'quality' && (
                <div className="space-y-6">
                  <Segmented tabs={qualityTabs} value={qualityView} onChange={setQualityView} />
                  {qualityView === 'contracts' ? (
                    <DataContractsSuite
                      contracts={contracts}
                      onRunContracts={() => {
                        setContracts(evaluateDataContracts(rawRecords, cleanRecords));
                        addLog('TRANSFORMAÇÃO', 'info', 'Verificações refeitas.');
                      }}
                    />
                  ) : (
                    <DeadLetterQueue
                      quarantineRecords={quarantineRecords}
                      onReprocess={handleReprocessDlq}
                      onClearQuarantine={handleClearQuarantine}
                    />
                  )}
                </div>
              )}

              {pipelineTab === 'diff' && (
                <DataQualityDiff
                  rawRecords={rawRecords}
                  cleanRecords={cleanRecords}
                  metrics={metrics}
                />
              )}
            </div>
          )}

          {mainTab === 'sql' && (
            <div className="space-y-6">
              {sqlTab === 'window_functions' && <SqlStudio queries={queries} />}
              {sqlTab === 'playground' && <CustomSqlPlayground records={cleanRecords} />}
            </div>
          )}

          {mainTab === 'code' && <CodeExplorer />}
        </main>
      </div>

      {/* Navegação inferior (celular) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Navegação principal"
      >
        {mainTabs.map(({ id, label, icon: Icon }) => {
          const active = id === mainTab;
          return (
            <button
              key={id}
              onClick={() => setMainTab(id)}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
                active ? 'text-accent' : 'text-muted'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          );
        })}
      </nav>

      <CsvUploaderModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
