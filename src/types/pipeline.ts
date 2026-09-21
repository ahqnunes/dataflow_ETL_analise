export interface RawSaleRecord {
  id_venda: string;
  id_cliente: string;
  id_vendedor: string;
  id_produto: string;
  nome_produto_legado: string;
  quantidade: string;
  preco_unitario: string;
  data_venda: string;
  canal_venda: string;
  status_pagamento: string;
  defects?: {
    isBadDate?: boolean;
    isMissingClient?: boolean;
    isMissingSalesman?: boolean;
    isDirtyCurrency?: boolean;
    isNegativeQty?: boolean;
    isDuplicate?: boolean;
  };
}

export interface CleanSaleRecord {
  id_venda: string;
  id_cliente: string;
  id_vendedor: string;
  id_produto: string;
  nome_produto: string;
  categoria: string;
  quantidade: number;
  preco_unitario: number;
  faturamento_total: number;
  custo_total: number;
  lucro_bruto: number;
  margem_pct: number;
  data_venda: string; // ISO YYYY-MM-DD
  mes_ano: string;    // YYYY-MM
  canal_venda: string;
  status_pagamento: string;
}

export interface DataQualityReport {
  totalRawRecords: number;
  totalCleanRecords: number;
  duplicatesRemoved: number;
  datesSanitized: number;
  currenciesFixed: number;
  missingClientsImputed: number;
  negativeQuantitiesFixed: number;
  qualityScorePct: number;
  totalRevenue: number;
  totalProfit: number;
}

export interface PipelineLog {
  id: string;
  timestamp: string;
  stage: 'GERADOR' | 'EXTRAÇÃO' | 'TRANSFORMAÇÃO' | 'CARGA' | 'ANALYTICS' | 'RELATÓRIO' | 'SISTEMA' | 'CONTRATOS' | 'QUARENTENA';
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export type PipelineStage = 'idle' | 'generating' | 'extracting' | 'transforming' | 'loading' | 'analyzing' | 'reporting' | 'completed';

export interface SqlQueryResult {
  queryId: string;
  title: string;
  description: string;
  sql: string;
  columns: string[];
  rows: Record<string, string | number>[];
  executionTimeMs: number;
}

export interface ExecutiveReport {
  timestamp: string;
  kpis: {
    totalRevenue: number;
    totalProfit: number;
    totalOrders: number;
    averageTicket: number;
    grossMarginPct: number;
  };
  monthlyRevenue: {
    period: string;
    revenue: number;
    profit: number;
    growthMoMPct: number;
    cumulativeRevenue: number;
  }[];
  top5Products: {
    rank: number;
    name: string;
    category: string;
    quantity: number;
    revenue: number;
    profit: number;
    marginPct: number;
  }[];
  regionalAnalysis: {
    region: string;
    segment: string;
    clientsCount: number;
    ordersCount: number;
    revenue: number;
    averageTicket: number;
    sharePct: number;
  }[];
}

// 1. DATA CONTRACTS & GREAT EXPECTATIONS SUITE
export interface DataContractTest {
  id: string;
  ruleName: string;
  targetColumn: string;
  expectationType: 'not_null' | 'positive_value' | 'iso_date_format' | 'foreign_key_match' | 'positive_margin' | 'duplicate_free' | 'valid_status';
  description: string;
  status: 'passed' | 'failed';
  totalChecked: number;
  passedCount: number;
  failedCount: number;
  thresholdPct: number; // e.g., 99% or 100%
  sampleViolations?: string[];
}

// 2. DEAD LETTER QUEUE (DLQ) & QUARANTINE
export interface QuarantineRecord {
  id: string;
  originalIdVenda: string;
  ingestedAt: string;
  rejectionReason: 'DATA_IMPOSSIVEL_FEVEREIRO_31' | 'QUANTIDADE_NEGATIVA_SEVERA' | 'CLIENTE_INEXISTENTE_SEM_FALLBACK' | 'PRECO_ZERADO_OU_NEGATIVO' | 'CORRUPCAO_ESTRUTURAL';
  severity: 'critical' | 'warning';
  rawPayload: Record<string, any>;
  status: 'in_quarantine' | 'reprocessed' | 'discarded';
  repairSuggestion: string;
}

// 3. AIRFLOW DAG ORCHESTRATION GRAPH
export interface AirflowDagNode {
  id: string;
  taskName: string;
  operator: 'PythonOperator' | 'BashOperator' | 'PostgresOperator' | 'GreatExpectationsOperator' | 'BranchPythonOperator';
  status: 'success' | 'running' | 'queued' | 'failed' | 'skipped';
  durationMs: number;
  upstreamIds: string[];
  downstreamIds: string[];
  retryCount: number;
  logs: string[];
}

// 4. AI TEXT-TO-SQL & BUSINESS INSIGHTS
export interface AiTextToSqlInsight {
  id: string;
  question: string;
  generatedSql: string;
  queryResult: SqlQueryResult;
  executiveSummary: string;
  keyTakeaway: string;
  recommendedAction: string;
  confidence: number;
  timestamp: string;
}
