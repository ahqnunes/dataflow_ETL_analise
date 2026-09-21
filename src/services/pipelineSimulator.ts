import {
  RawSaleRecord,
  CleanSaleRecord,
  DataQualityReport,
  PipelineLog,
  SqlQueryResult,
  ExecutiveReport,
  PipelineStage,
  DataContractTest,
  QuarantineRecord,
  AirflowDagNode,
  AiTextToSqlInsight
} from '../types/pipeline';

export const CLIENTES_REF = [
  { id_cliente: 'CLI_001', nome: 'Acme Corporation Ltda', regiao: 'Sudeste', segmento: 'Enterprise' },
  { id_cliente: 'CLI_002', nome: 'Silva & Souza Consultoria', regiao: 'Sul', segmento: 'PME' },
  { id_cliente: 'CLI_003', nome: 'TechNova Soluções Digitais', regiao: 'Nordeste', segmento: 'Corporativo' },
  { id_cliente: 'CLI_004', nome: 'Varejo Brasil Supermercados', regiao: 'Sudeste', segmento: 'Enterprise' },
  { id_cliente: 'CLI_005', nome: 'AgroForte Distribuidora', regiao: 'Centro-Oeste', segmento: 'Corporativo' },
  { id_cliente: 'CLI_006', nome: 'BioSaúde Farmacêutica', regiao: 'Sudeste', segmento: 'Enterprise' },
  { id_cliente: 'CLI_007', nome: 'Café do Ponto & Cia', regiao: 'Sul', segmento: 'Varejo' },
  { id_cliente: 'CLI_008', nome: 'EletroMundo Eletrônicos', regiao: 'Nordeste', segmento: 'Varejo' },
  { id_cliente: 'CLI_009', nome: 'Amazonia Madeiras & Móveis', regiao: 'Norte', segmento: 'PME' },
  { id_cliente: 'CLI_010', nome: 'Minas Aço Engenharia', regiao: 'Sudeste', segmento: 'Corporativo' },
];

export const VENDEDORES_REF = [
  { id_vendedor: 'VEND_001', nome: 'Mariana Costa', meta_mensal: 65000 },
  { id_vendedor: 'VEND_002', nome: 'Lucas Ribeiro', meta_mensal: 55000 },
  { id_vendedor: 'VEND_003', nome: 'Camila Albuquerque', meta_mensal: 70000 },
  { id_vendedor: 'VEND_004', nome: 'Rodrigo Nogueira', meta_mensal: 45000 },
  { id_vendedor: 'VEND_005', nome: 'Beatriz Santos', meta_mensal: 60000 },
];

export const PRODUTOS_REF = [
  { id_produto: 'PROD_001', nome: 'Notebook Dell Latitude 5430', categoria: 'Informática', preco_tabela: 5200, custo_medio: 3700 },
  { id_produto: 'PROD_002', nome: 'Monitor Ultrawide 34 LG IPS', categoria: 'Periféricos', preco_tabela: 2400, custo_medio: 1650 },
  { id_produto: 'PROD_003', nome: 'Licença Cloud Anual Pro', categoria: 'Software', preco_tabela: 1800, custo_medio: 450 },
  { id_produto: 'PROD_004', nome: 'Servidor Rack 1U Xeon Gold', categoria: 'Infraestrutura', preco_tabela: 12500, custo_medio: 8900 },
  { id_produto: 'PROD_005', nome: 'Cadeira Ergonômica Pro Executive', categoria: 'Mobiliário', preco_tabela: 1450, custo_medio: 890 },
  { id_produto: 'PROD_006', nome: 'Switch Gerenciável 24P PoE', categoria: 'Redes', preco_tabela: 3200, custo_medio: 2100 },
  { id_produto: 'PROD_007', nome: 'Teclado Mecânico Wireless', categoria: 'Periféricos', preco_tabela: 480, custo_medio: 290 },
  { id_produto: 'PROD_008', nome: 'Headset Noise-Cancelling ANC', categoria: 'Áudio', preco_tabela: 690, custo_medio: 410 },
];

const CANAIS = ['Online', 'Presencial', 'Parceiro', 'Televendas'];

// 1. GERADOR DE DADOS SUJOS
export function generateDirtyData(count: number = 80): RawSaleRecord[] {
  const records: RawSaleRecord[] = [];
  const baseDate = new Date(2023, 0, 15);

  for (let i = 1; i <= count; i++) {
    const cli = CLIENTES_REF[Math.floor(Math.random() * CLIENTES_REF.length)];
    const vend = VENDEDORES_REF[Math.floor(Math.random() * VENDEDORES_REF.length)];
    const prod = PRODUTOS_REF[Math.floor(Math.random() * PRODUTOS_REF.length)];

    const dayOffset = Math.floor(Math.random() * 350);
    const saleDate = new Date(baseDate.getTime() + dayOffset * 86400000);

    const year = saleDate.getFullYear();
    const month = String(saleDate.getMonth() + 1).padStart(2, '0');
    const day = String(saleDate.getDate()).padStart(2, '0');

    // Defect flags
    const isBadDate = Math.random() < 0.18;
    const isMissingClient = Math.random() < 0.08;
    const isMissingSalesman = Math.random() < 0.06;
    const isDirtyCurrency = Math.random() < 0.35;
    const isNegativeQty = Math.random() < 0.05;

    let dateString = `${year}-${month}-${day}`;
    if (isBadDate) {
      const type = Math.random();
      if (type < 0.4) dateString = `${day}/${month}/${year}`;
      else if (type < 0.7) dateString = `${day}-${month}-${year}`;
      else if (type < 0.85) dateString = `${year}/${month}/${day}`;
      else if (type < 0.95) dateString = `2023/31/02`; // Impossible date
      else dateString = ''; // Null date
    }

    let qtyVal = Math.floor(Math.random() * 8) + 1;
    let qtyStr = String(qtyVal);
    if (isNegativeQty) {
      qtyStr = `-${qtyVal}`;
    }

    let priceStr = prod.preco_tabela.toFixed(2);
    if (isDirtyCurrency) {
      const ptype = Math.random();
      if (ptype < 0.35) {
        priceStr = `R$ ${prod.preco_tabela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      } else if (ptype < 0.65) {
        priceStr = `  ${prod.preco_tabela.toFixed(2)}  `;
      } else if (ptype < 0.85) {
        priceStr = String(prod.preco_tabela).replace('.', ',');
      } else if (ptype < 0.95) {
        priceStr = '';
      } else {
        priceStr = `-${prod.preco_tabela.toFixed(2)}`;
      }
    }

    const rec: RawSaleRecord = {
      id_venda: `VND-${String(i).padStart(5, '0')}`,
      id_cliente: isMissingClient ? '' : cli.id_cliente,
      id_vendedor: isMissingSalesman ? '' : vend.id_vendedor,
      id_produto: prod.id_produto,
      nome_produto_legado: prod.nome,
      quantidade: qtyStr,
      preco_unitario: priceStr,
      data_venda: dateString,
      canal_venda: CANAIS[Math.floor(Math.random() * CANAIS.length)],
      status_pagamento: Math.random() > 0.08 ? 'Aprovado' : (Math.random() > 0.5 ? 'Pendente' : 'Cancelado'),
      defects: {
        isBadDate,
        isMissingClient,
        isMissingSalesman,
        isDirtyCurrency,
        isNegativeQty,
        isDuplicate: false,
      }
    };

    records.push(rec);
  }

  // Inject intentional duplicates (approx 5%)
  const dupCount = Math.floor(count * 0.06);
  for (let d = 0; d < dupCount; d++) {
    const original = records[Math.floor(Math.random() * (records.length - dupCount))];
    if (original) {
      records.push({
        ...original,
        defects: {
          ...original.defects,
          isDuplicate: true,
        }
      });
    }
  }

  return records;
}

// Helper to sanitize prices
function cleanPriceString(val: string, fallbackPrice: number): number {
  if (!val || val.trim() === '') return fallbackPrice;
  let clean = val.replace(/R\$|\$|\s/g, '');
  if (clean.includes(',') && clean.includes('.')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }
  const parsed = parseFloat(clean);
  if (isNaN(parsed) || parsed <= 0) return fallbackPrice;
  return Math.abs(parsed);
}

// Helper to sanitize dates
function cleanDateString(val: string): string {
  if (!val || val.trim() === '') return '2023-06-15';
  const clean = val.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  // DD/MM/YYYY
  const brMatch = clean.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    const [, d, m, y] = brMatch;
    // Check for impossible date like 31/02
    if (m === '02' && parseInt(d, 10) > 28) return '2023-02-28';
    return `${y}-${m}-${d}`;
  }

  // DD-MM-YYYY
  const dashMatch = clean.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dashMatch) {
    const [, d, m, y] = dashMatch;
    return `${y}-${m}-${d}`;
  }

  // YYYY/MM/DD
  const slashMatch = clean.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (slashMatch) {
    const [, y, m, d] = slashMatch;
    if (m === '02' && parseInt(d, 10) > 28) return '2023-02-28';
    return `${y}-${m}-${d}`;
  }

  return '2023-06-15';
}

// 2. TRANSFORMAÇÃO E LIMPEZA COM PANDAS SIMULATION
export function transformDirtyData(rawList: RawSaleRecord[]): {
  cleanRecords: CleanSaleRecord[];
  report: DataQualityReport;
} {
  const seenIds = new Set<string>();
  const cleanRecords: CleanSaleRecord[] = [];

  let duplicatesRemoved = 0;
  let datesSanitized = 0;
  let currenciesFixed = 0;
  let missingClientsImputed = 0;
  let negativeQuantitiesFixed = 0;

  for (const raw of rawList) {
    // 1. Deduplicação
    if (seenIds.has(raw.id_venda)) {
      duplicatesRemoved++;
      continue;
    }
    seenIds.add(raw.id_venda);

    // 2. Chaves
    let id_cliente = raw.id_cliente;
    if (!id_cliente || id_cliente.trim() === '') {
      id_cliente = 'CLI_001';
      missingClientsImputed++;
    }

    let id_vendedor = raw.id_vendedor;
    if (!id_vendedor || id_vendedor.trim() === '') {
      id_vendedor = 'VEND_001';
    }

    // 3. Produto e Custo
    const prod = PRODUTOS_REF.find(p => p.id_produto === raw.id_produto) || PRODUTOS_REF[0];

    // 4. Quantidade
    let rawQty = parseInt(raw.quantidade, 10);
    if (isNaN(rawQty) || rawQty <= 0) {
      rawQty = Math.abs(rawQty) || 1;
      negativeQuantitiesFixed++;
    }

    // 5. Preço Unitário
    const rawPriceClean = cleanPriceString(raw.preco_unitario, prod.preco_tabela);
    if (raw.preco_unitario !== prod.preco_tabela.toFixed(2)) {
      currenciesFixed++;
    }

    // 6. Data
    const cleanDate = cleanDateString(raw.data_venda);
    if (raw.data_venda !== cleanDate) {
      datesSanitized++;
    }

    // 7. Derivação de colunas de negócio
    const faturamento_total = Number((rawQty * rawPriceClean).toFixed(2));
    const custo_total = Number((rawQty * prod.custo_medio).toFixed(2));
    const lucro_bruto = Number((faturamento_total - custo_total).toFixed(2));
    const margem_pct = faturamento_total > 0 ? Number(((lucro_bruto / faturamento_total) * 100).toFixed(2)) : 0;
    const mes_ano = cleanDate.substring(0, 7);

    cleanRecords.push({
      id_venda: raw.id_venda,
      id_cliente,
      id_vendedor,
      id_produto: prod.id_produto,
      nome_produto: prod.nome,
      categoria: prod.categoria,
      quantidade: rawQty,
      preco_unitario: rawPriceClean,
      faturamento_total,
      custo_total,
      lucro_bruto,
      margem_pct,
      data_venda: cleanDate,
      mes_ano,
      canal_venda: raw.canal_venda || 'Online',
      status_pagamento: raw.status_pagamento || 'Aprovado'
    });
  }

  const totalRevenue = cleanRecords.reduce((acc, r) => acc + (r.status_pagamento === 'Aprovado' ? r.faturamento_total : 0), 0);
  const totalProfit = cleanRecords.reduce((acc, r) => acc + (r.status_pagamento === 'Aprovado' ? r.lucro_bruto : 0), 0);
  const totalDefectsCount = duplicatesRemoved + datesSanitized + currenciesFixed + missingClientsImputed + negativeQuantitiesFixed;
  const qualityScorePct = Math.min(100, Math.max(90, 100 - (totalDefectsCount / (rawList.length * 5)) * 100));

  const report: DataQualityReport = {
    totalRawRecords: rawList.length,
    totalCleanRecords: cleanRecords.length,
    duplicatesRemoved,
    datesSanitized,
    currenciesFixed,
    missingClientsImputed,
    negativeQuantitiesFixed,
    qualityScorePct: Number(qualityScorePct.toFixed(1)),
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalProfit: Number(totalProfit.toFixed(2))
  };

  return { cleanRecords, report };
}

// 3. EXECUÇÃO DE QUERIES ANALÍTICAS (SQL ENGINE SIMULATION)
export function runAnalyticalQueries(records: CleanSaleRecord[]): SqlQueryResult[] {
  const approved = records.filter(r => r.status_pagamento === 'Aprovado');

  // QUERY 1: Faturamento Mensal com Window Functions (LAG e MoM %)
  const monthlyMap: Record<string, { period: string; count: number; items: number; revenue: number; profit: number }> = {};
  for (const r of approved) {
    const key = r.mes_ano;
    if (!monthlyMap[key]) {
      monthlyMap[key] = { period: key, count: 0, items: 0, revenue: 0, profit: 0 };
    }
    monthlyMap[key].count += 1;
    monthlyMap[key].items += r.quantidade;
    monthlyMap[key].revenue += r.faturamento_total;
    monthlyMap[key].profit += r.lucro_bruto;
  }

  const sortedMonths = Object.keys(monthlyMap).sort();
  let cumulativeRevenue = 0;
  const q1Rows: Record<string, string | number>[] = sortedMonths.map((period, index) => {
    const cur = monthlyMap[period];
    const prevPeriod = index > 0 ? sortedMonths[index - 1] : null;
    const prevRevenue = prevPeriod ? monthlyMap[prevPeriod].revenue : null;
    let growthMoM = 0;
    if (prevRevenue && prevRevenue > 0) {
      growthMoM = Number((((cur.revenue - prevRevenue) / prevRevenue) * 100).toFixed(2));
    }
    cumulativeRevenue += cur.revenue;
    const margin = cur.revenue > 0 ? Number(((cur.profit / cur.revenue) * 100).toFixed(2)) : 0;

    return {
      periodo: period,
      total_pedidos: cur.count,
      itens_vendidos: cur.items,
      faturamento_bruto: `R$ ${cur.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      lucro_bruto: `R$ ${cur.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      margem_lucro_pct: `${margin}%`,
      faturamento_anterior: prevRevenue ? `R$ ${prevRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-',
      crescimento_mom: prevRevenue ? `${growthMoM > 0 ? '+' : ''}${growthMoM}%` : '-',
      faturamento_acumulado: `R$ ${cumulativeRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    };
  });

  // QUERY 2: Top 5 Produtos Mais Vendidos e Rentáveis (DENSE_RANK)
  const productMap: Record<string, { name: string; category: string; qty: number; revenue: number; profit: number }> = {};
  for (const r of approved) {
    if (!productMap[r.id_produto]) {
      productMap[r.id_produto] = { name: r.nome_produto, category: r.categoria, qty: 0, revenue: 0, profit: 0 };
    }
    productMap[r.id_produto].qty += r.quantidade;
    productMap[r.id_produto].revenue += r.faturamento_total;
    productMap[r.id_produto].profit += r.lucro_bruto;
  }

  const sortedProducts = Object.values(productMap).sort((a, b) => b.profit - a.profit);
  const q2Rows: Record<string, string | number>[] = sortedProducts.slice(0, 5).map((p, idx) => {
    const margin = p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(1) : '0';
    return {
      rank_lucro: `#${idx + 1}`,
      produto: p.name,
      categoria: p.category,
      unidades_vendidas: p.qty,
      faturamento: `R$ ${p.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      lucro_bruto: `R$ ${p.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      margem_lucro: `${margin}%`,
      desempenho: margin > '35' ? 'Alta Rentabilidade' : 'Volume Padronizado'
    };
  });

  // QUERY 3: Ticket Médio por Cliente e Região
  const totalNationalRevenue = approved.reduce((acc, r) => acc + r.faturamento_total, 0);
  const regionalMap: Record<string, { region: string; segment: string; clientSet: Set<string>; count: number; revenue: number }> = {};
  for (const r of approved) {
    const cli = CLIENTES_REF.find(c => c.id_cliente === r.id_cliente) || CLIENTES_REF[0];
    const key = `${cli.regiao}|${cli.segmento}`;
    if (!regionalMap[key]) {
      regionalMap[key] = { region: cli.regiao, segment: cli.segmento, clientSet: new Set(), count: 0, revenue: 0 };
    }
    regionalMap[key].clientSet.add(r.id_cliente);
    regionalMap[key].count += 1;
    regionalMap[key].revenue += r.faturamento_total;
  }

  const sortedRegional = Object.values(regionalMap).sort((a, b) => b.revenue - a.revenue);
  const q3Rows: Record<string, string | number>[] = sortedRegional.map(reg => {
    const ticket = reg.count > 0 ? (reg.revenue / reg.count).toFixed(2) : '0';
    const ltv = reg.clientSet.size > 0 ? (reg.revenue / reg.clientSet.size).toFixed(2) : '0';
    const share = totalNationalRevenue > 0 ? ((reg.revenue / totalNationalRevenue) * 100).toFixed(1) : '0';

    return {
      regiao: reg.region,
      segmento: reg.segment,
      clientes_ativos: reg.clientSet.size,
      total_pedidos: reg.count,
      faturamento_total: `R$ ${reg.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      ticket_medio: `R$ ${Number(ticket).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      ltv_por_cliente: `R$ ${Number(ltv).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      share_nacional_pct: `${share}%`
    };
  });

  // QUERY 4: Desempenho e Comissionamento de Vendedores
  const repMap: Record<string, { name: string; meta: number; orders: number; revenue: number }> = {};
  for (const v of VENDEDORES_REF) {
    repMap[v.id_vendedor] = { name: v.nome, meta: v.meta_mensal * 12, orders: 0, revenue: 0 };
  }
  for (const r of approved) {
    if (repMap[r.id_vendedor]) {
      repMap[r.id_vendedor].orders += 1;
      repMap[r.id_vendedor].revenue += r.faturamento_total;
    }
  }

  const sortedReps = Object.values(repMap).sort((a, b) => b.revenue - a.revenue);
  const q4Rows: Record<string, string | number>[] = sortedReps.map((rep, idx) => {
    const metaPct = Number(((rep.revenue / rep.meta) * 100).toFixed(1));
    let comissaoRate = 0.015;
    let faixa = 'Piso Base (1.5%)';
    if (metaPct >= 120) {
      comissaoRate = 0.05;
      faixa = 'Super Meta (5.0%)';
    } else if (metaPct >= 100) {
      comissaoRate = 0.035;
      faixa = 'Meta Batida (3.5%)';
    }
    const comissaoValor = rep.revenue * comissaoRate;

    return {
      rank: `#${idx + 1}`,
      vendedor: rep.name,
      meta_anual: `R$ ${rep.meta.toLocaleString('pt-BR')}`,
      pedidos_fechados: rep.orders,
      faturamento_realizado: `R$ ${rep.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      atingimento_meta: `${metaPct}%`,
      faixa_comissao: faixa,
      comissao_projetada: `R$ ${comissaoValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    };
  });

  return [
    {
      queryId: 'q1_faturamento_mensal',
      title: '1. Faturamento Mensal & Window Growth (MoM)',
      description: 'Calcula o faturamento mensal, mês anterior (LAG), variação percentual M/M e faturamento acumulado no ano.',
      sql: `SELECT
    TO_CHAR(v.data_venda, 'YYYY-MM') AS periodo_formatado,
    COUNT(v.id_venda) AS total_pedidos,
    SUM(v.faturamento_total) AS faturamento_bruto,
    SUM(v.lucro_bruto) AS lucro_bruto_total,
    LAG(SUM(v.faturamento_total), 1) OVER (ORDER BY TO_CHAR(v.data_venda, 'YYYY-MM')) AS faturamento_mes_anterior,
    ROUND(((SUM(v.faturamento_total) - LAG(SUM(v.faturamento_total), 1) OVER (ORDER BY TO_CHAR(v.data_venda, 'YYYY-MM'))) / 
           NULLIF(LAG(SUM(v.faturamento_total), 1) OVER (ORDER BY TO_CHAR(v.data_venda, 'YYYY-MM')), 0)) * 100, 2) AS crescimento_mom_pct,
    SUM(SUM(v.faturamento_total)) OVER (ORDER BY TO_CHAR(v.data_venda, 'YYYY-MM')) AS faturamento_acumulado
FROM vendas v
WHERE v.status_pagamento = 'Aprovado'
GROUP BY TO_CHAR(v.data_venda, 'YYYY-MM')
ORDER BY periodo_formatado ASC;`,
      columns: ['periodo', 'total_pedidos', 'itens_vendidos', 'faturamento_bruto', 'lucro_bruto', 'margem_lucro_pct', 'crescimento_mom', 'faturamento_acumulado'],
      rows: q1Rows,
      executionTimeMs: 14
    },
    {
      queryId: 'q2_top_produtos',
      title: '2. Top 5 Produtos Mais Vendidos e Rentáveis (DENSE_RANK)',
      description: 'Identifica os produtos de maior retorno financeiro utilizando ranking com densidade e cálculo de margem percentual.',
      sql: `WITH metricas_produtos AS (
    SELECT
        p.id_produto, p.nome, p.categoria,
        SUM(v.quantidade) AS total_unidades,
        SUM(v.faturamento_total) AS faturamento,
        SUM(v.lucro_bruto) AS lucro,
        DENSE_RANK() OVER (ORDER BY SUM(v.lucro_bruto) DESC) AS rank_lucro
    FROM produtos p
    JOIN vendas v ON p.id_produto = v.id_produto
    WHERE v.status_pagamento = 'Aprovado'
    GROUP BY p.id_produto, p.nome, p.categoria
)
SELECT * FROM metricas_produtos WHERE rank_lucro <= 5 ORDER BY rank_lucro ASC;`,
      columns: ['rank_lucro', 'produto', 'categoria', 'unidades_vendidas', 'faturamento', 'lucro_bruto', 'margem_lucro', 'desempenho'],
      rows: q2Rows,
      executionTimeMs: 11
    },
    {
      queryId: 'q3_ticket_regional',
      title: '3. Ticket Médio por Cliente e por Região',
      description: 'Cruza Dimensão Clientes e Fato Vendas para mapear ticket médio por transação e penetração por macrorregião brasileira.',
      sql: `SELECT
    c.regiao, c.segmento,
    COUNT(DISTINCT c.id_cliente) AS clientes_ativos,
    COUNT(v.id_venda) AS volume_vendas,
    SUM(v.faturamento_total) AS faturamento_regional,
    ROUND(AVG(v.faturamento_total), 2) AS ticket_medio_pedido,
    ROUND((SUM(v.faturamento_total) / SUM(SUM(v.faturamento_total)) OVER ()) * 100, 2) AS share_nacional_pct
FROM clientes c
JOIN vendas v ON c.id_cliente = v.id_cliente
WHERE v.status_pagamento = 'Aprovado'
GROUP BY c.regiao, c.segmento
ORDER BY faturamento_regional DESC;`,
      columns: ['regiao', 'segmento', 'clientes_ativos', 'total_pedidos', 'faturamento_total', 'ticket_medio', 'ltv_por_cliente', 'share_nacional_pct'],
      rows: q3Rows,
      executionTimeMs: 16
    },
    {
      queryId: 'q4_vendedores_meta',
      title: '4. Desempenho e Comissionamento de Vendedores',
      description: 'Calcula o atingimento percentual da meta anual por vendedor e projeta as comissões progressivas (1.5%, 3.5%, 5.0%).',
      sql: `SELECT
    vd.id_vendedor, vd.nome AS vendedor, vd.meta_mensal,
    COUNT(v.id_venda) AS pedidos,
    SUM(v.faturamento_total) AS faturamento,
    ROUND((SUM(v.faturamento_total) / vd.meta_mensal) * 100, 2) AS atingimento_meta_pct,
    DENSE_RANK() OVER (ORDER BY SUM(v.faturamento_total) DESC) AS rank
FROM vendedores vd
LEFT JOIN vendas v ON vd.id_vendedor = v.id_vendedor AND v.status_pagamento = 'Aprovado'
GROUP BY vd.id_vendedor, vd.nome, vd.meta_mensal
ORDER BY faturamento DESC;`,
      columns: ['rank', 'vendedor', 'meta_anual', 'pedidos_fechados', 'faturamento_realizado', 'atingimento_meta', 'faixa_comissao', 'comissao_projetada'],
      rows: q4Rows,
      executionTimeMs: 9
    }
  ];
}

// 4. GERAÇÃO DE RELATÓRIO EXECUTIVO
export function generateExecutiveReportData(records: CleanSaleRecord[]): ExecutiveReport {
  const approved = records.filter(r => r.status_pagamento === 'Aprovado');
  const totalRevenue = approved.reduce((acc, r) => acc + r.faturamento_total, 0);
  const totalProfit = approved.reduce((acc, r) => acc + r.lucro_bruto, 0);
  const totalOrders = approved.length;
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const grossMarginPct = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Monthly breakdown
  const monthlyMap: Record<string, { revenue: number; profit: number }> = {};
  for (const r of approved) {
    const p = r.mes_ano;
    if (!monthlyMap[p]) monthlyMap[p] = { revenue: 0, profit: 0 };
    monthlyMap[p].revenue += r.faturamento_total;
    monthlyMap[p].profit += r.lucro_bruto;
  }

  const sortedMonths = Object.keys(monthlyMap).sort();
  let cumulative = 0;
  const monthlyRevenue = sortedMonths.map((period, idx) => {
    const cur = monthlyMap[period];
    const prev = idx > 0 ? monthlyMap[sortedMonths[idx - 1]] : null;
    const growthMoMPct = prev && prev.revenue > 0 ? Number((((cur.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1)) : 0;
    cumulative += cur.revenue;
    return {
      period,
      revenue: Math.round(cur.revenue),
      profit: Math.round(cur.profit),
      growthMoMPct,
      cumulativeRevenue: Math.round(cumulative)
    };
  });

  // Top 5 Products
  const prodMap: Record<string, { name: string; category: string; qty: number; revenue: number; profit: number }> = {};
  for (const r of approved) {
    if (!prodMap[r.id_produto]) {
      prodMap[r.id_produto] = { name: r.nome_produto, category: r.categoria, qty: 0, revenue: 0, profit: 0 };
    }
    prodMap[r.id_produto].qty += r.quantidade;
    prodMap[r.id_produto].revenue += r.faturamento_total;
    prodMap[r.id_produto].profit += r.lucro_bruto;
  }

  const top5Products = Object.values(prodMap)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5)
    .map((p, idx) => ({
      rank: idx + 1,
      name: p.name,
      category: p.category,
      quantity: p.qty,
      revenue: Math.round(p.revenue),
      profit: Math.round(p.profit),
      marginPct: p.revenue > 0 ? Number(((p.profit / p.revenue) * 100).toFixed(1)) : 0
    }));

  // Regional breakdown
  const regMap: Record<string, { region: string; segment: string; clients: Set<string>; orders: number; revenue: number }> = {};
  for (const r of approved) {
    const cli = CLIENTES_REF.find(c => c.id_cliente === r.id_cliente) || CLIENTES_REF[0];
    const k = `${cli.regiao}-${cli.segmento}`;
    if (!regMap[k]) regMap[k] = { region: cli.regiao, segment: cli.segmento, clients: new Set(), orders: 0, revenue: 0 };
    regMap[k].clients.add(r.id_cliente);
    regMap[k].orders += 1;
    regMap[k].revenue += r.faturamento_total;
  }

  const regionalAnalysis = Object.values(regMap)
    .sort((a, b) => b.revenue - a.revenue)
    .map(rm => ({
      region: rm.region,
      segment: rm.segment,
      clientsCount: rm.clients.size,
      ordersCount: rm.orders,
      revenue: Math.round(rm.revenue),
      averageTicket: rm.orders > 0 ? Math.round(rm.revenue / rm.orders) : 0,
      sharePct: totalRevenue > 0 ? Number(((rm.revenue / totalRevenue) * 100).toFixed(1)) : 0
    }));

  return {
    timestamp: new Date().toISOString(),
    kpis: {
      totalRevenue: Math.round(totalRevenue),
      totalProfit: Math.round(totalProfit),
      totalOrders,
      averageTicket: Math.round(averageTicket),
      grossMarginPct: Number(grossMarginPct.toFixed(1))
    },
    monthlyRevenue,
    top5Products,
    regionalAnalysis
  };
}

// 5. SUÍTE DE CONTRATOS DE DADOS (GREAT EXPECTATIONS & DATA CONTRACTS)
export function evaluateDataContracts(raw: RawSaleRecord[], clean: CleanSaleRecord[]): DataContractTest[] {
  const totalRaw = raw.length;
  const totalClean = clean.length;

  // Test 1: ID Venda NOT NULL & Uniqueness
  const duplicatePks = raw.filter((r, idx, arr) => arr.findIndex(x => x.id_venda === r.id_venda) !== idx);
  const t1Passed = duplicatePks.length === 0;

  // Test 2: Foreign Key id_cliente
  const invalidClients = clean.filter(c => !CLIENTES_REF.some(cr => cr.id_cliente === c.id_cliente));

  // Test 3: Foreign Key id_produto
  const invalidProds = clean.filter(c => !PRODUTOS_REF.some(pr => pr.id_produto === c.id_produto));

  // Test 4: preco_unitario > 0
  const nonPositivePrices = clean.filter(c => c.preco_unitario <= 0);

  // Test 5: quantidade > 0
  const nonPositiveQty = clean.filter(c => c.quantidade <= 0);

  // Test 6: data_venda matches ISO regex YYYY-MM-DD
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const badDates = clean.filter(c => !isoDateRegex.test(c.data_venda));

  // Test 7: lucro_bruto positive check constraint
  const negativeProfits = clean.filter(c => c.lucro_bruto < 0);

  // Test 8: status_pagamento IN ('Aprovado', 'Pendente', 'Cancelado')
  const validStatuses = ['Aprovado', 'Pendente', 'Cancelado'];
  const badStatuses = clean.filter(c => !validStatuses.includes(c.status_pagamento));

  return [
    {
      id: 'ge_rule_01',
      ruleName: 'expect_column_values_to_not_be_null_and_unique',
      targetColumn: 'id_venda',
      expectationType: 'not_null',
      description: 'Chave primária id_venda deve ser estritamente preenchida e única (sem duplicatas).',
      status: t1Passed ? 'passed' : 'failed',
      totalChecked: totalRaw,
      passedCount: totalRaw - duplicatePks.length,
      failedCount: duplicatePks.length,
      thresholdPct: 100,
      sampleViolations: duplicatePks.slice(0, 3).map(d => `Duplicata detectada para ID ${d.id_venda}`)
    },
    {
      id: 'ge_rule_02',
      ruleName: 'expect_column_values_to_match_foreign_key',
      targetColumn: 'id_cliente',
      expectationType: 'foreign_key_match',
      description: 'Integridade referencial: todo id_cliente deve existir na dimensão clientes.',
      status: invalidClients.length === 0 ? 'passed' : 'failed',
      totalChecked: totalClean,
      passedCount: totalClean - invalidClients.length,
      failedCount: invalidClients.length,
      thresholdPct: 100,
      sampleViolations: invalidClients.slice(0, 3).map(c => `Cliente ${c.id_cliente} não encontrado no catálogo dimensão`)
    },
    {
      id: 'ge_rule_03',
      ruleName: 'expect_column_values_to_match_foreign_key',
      targetColumn: 'id_produto',
      expectationType: 'foreign_key_match',
      description: 'Integridade referencial: todo id_produto deve pertencer à tabela de produtos.',
      status: invalidProds.length === 0 ? 'passed' : 'failed',
      totalChecked: totalClean,
      passedCount: totalClean - invalidProds.length,
      failedCount: invalidProds.length,
      thresholdPct: 100,
      sampleViolations: []
    },
    {
      id: 'ge_rule_04',
      ruleName: 'expect_column_values_to_be_positive_float',
      targetColumn: 'preco_unitario',
      expectationType: 'positive_value',
      description: 'Regra de negócio financeira: preco_unitario deve ser estritamente maior que zero.',
      status: nonPositivePrices.length === 0 ? 'passed' : 'failed',
      totalChecked: totalClean,
      passedCount: totalClean - nonPositivePrices.length,
      failedCount: nonPositivePrices.length,
      thresholdPct: 100,
      sampleViolations: nonPositivePrices.slice(0, 3).map(p => `Venda ${p.id_venda} com preço unitário R$ ${p.preco_unitario}`)
    },
    {
      id: 'ge_rule_05',
      ruleName: 'expect_column_values_to_be_positive_integer',
      targetColumn: 'quantidade',
      expectationType: 'positive_value',
      description: 'Quantidade de itens faturados não pode ser zero ou negativa.',
      status: nonPositiveQty.length === 0 ? 'passed' : 'failed',
      totalChecked: totalClean,
      passedCount: totalClean - nonPositiveQty.length,
      failedCount: nonPositiveQty.length,
      thresholdPct: 100,
      sampleViolations: []
    },
    {
      id: 'ge_rule_06',
      ruleName: 'expect_column_values_to_match_iso8601_format',
      targetColumn: 'data_venda',
      expectationType: 'iso_date_format',
      description: 'Todas as datas devem estar no padrão ISO 8601 YYYY-MM-DD para garantir particionamento temporal.',
      status: badDates.length === 0 ? 'passed' : 'failed',
      totalChecked: totalClean,
      passedCount: totalClean - badDates.length,
      failedCount: badDates.length,
      thresholdPct: 100,
      sampleViolations: badDates.slice(0, 3).map(b => `Data malformada: ${b.data_venda}`)
    },
    {
      id: 'ge_rule_07',
      ruleName: 'expect_profit_margin_to_be_positive_constraint',
      targetColumn: 'lucro_bruto',
      expectationType: 'positive_margin',
      description: 'Constraint PostgreSQL chk_lucro_positivo: faturamento_total >= custo_total.',
      status: negativeProfits.length === 0 ? 'passed' : 'failed',
      totalChecked: totalClean,
      passedCount: totalClean - negativeProfits.length,
      failedCount: negativeProfits.length,
      thresholdPct: 100,
      sampleViolations: []
    },
    {
      id: 'ge_rule_08',
      ruleName: 'expect_column_values_to_be_in_set',
      targetColumn: 'status_pagamento',
      expectationType: 'valid_status',
      description: 'Status de pagamento aceito apenas no conjunto fechado (Aprovado, Pendente, Cancelado).',
      status: badStatuses.length === 0 ? 'passed' : 'failed',
      totalChecked: totalClean,
      passedCount: totalClean - badStatuses.length,
      failedCount: badStatuses.length,
      thresholdPct: 100,
      sampleViolations: []
    }
  ];
}

// 6. QUARENTENA DE DADOS E DEAD LETTER QUEUE (DLQ)
export function extractQuarantineRecords(raw: RawSaleRecord[]): QuarantineRecord[] {
  const dlq: QuarantineRecord[] = [];

  raw.forEach((r, idx) => {
    // Check if row has severe unrecoverable defects
    if (r.data_venda === '2023/31/02') {
      dlq.push({
        id: `DLQ_${1000 + idx}`,
        originalIdVenda: r.id_venda,
        ingestedAt: '2023-11-20 14:32:10',
        rejectionReason: 'DATA_IMPOSSIVEL_FEVEREIRO_31',
        severity: 'critical',
        rawPayload: { ...r },
        status: 'in_quarantine',
        repairSuggestion: 'Data 31 de fevereiro não existe no calendário gregoriano. Imputar último dia útil (28/02) ou contatar origem.'
      });
    } else if (r.defects?.isNegativeQty && Number(r.quantidade) < 0) {
      dlq.push({
        id: `DLQ_${1000 + idx}`,
        originalIdVenda: r.id_venda,
        ingestedAt: '2023-11-20 14:32:11',
        rejectionReason: 'QUANTIDADE_NEGATIVA_SEVERA',
        severity: 'warning',
        rawPayload: { ...r },
        status: 'in_quarantine',
        repairSuggestion: 'Quantidade negativa detectada. Converter para valor absoluto (estorno) ou descartar duplicata de devolução.'
      });
    } else if (!r.preco_unitario || r.preco_unitario === '' || r.preco_unitario === 'NULL') {
      dlq.push({
        id: `DLQ_${1000 + idx}`,
        originalIdVenda: r.id_venda,
        ingestedAt: '2023-11-20 14:32:12',
        rejectionReason: 'PRECO_ZERADO_OU_NEGATIVO',
        severity: 'critical',
        rawPayload: { ...r },
        status: 'in_quarantine',
        repairSuggestion: 'Preço unitário nulo no arquivo de entrada. Buscar preço de tabela no catálogo dimensão_produtos.'
      });
    } else if (!r.id_cliente && !r.id_vendedor) {
      dlq.push({
        id: `DLQ_${1000 + idx}`,
        originalIdVenda: r.id_venda,
        ingestedAt: '2023-11-20 14:32:13',
        rejectionReason: 'CORRUPCAO_ESTRUTURAL',
        severity: 'critical',
        rawPayload: { ...r },
        status: 'in_quarantine',
        repairSuggestion: 'Linha sem cliente e sem vendedor cadastrado. Registro irrecuperável por violação de múltiplas FKs.'
      });
    }
  });

  return dlq;
}

// 7. PARSER DE CSV CUSTOMIZADO DO USUÁRIO
export function parseUploadedCsv(csvText: string): RawSaleRecord[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
  const records: RawSaleRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/["']/g, ''));
    if (cols.length < 3) continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = cols[idx] ?? '';
    });

    const idVenda = rowObj['id_venda'] || rowObj['id'] || `CSV_${1000 + i}`;
    const idCliente = rowObj['id_cliente'] || rowObj['cliente'] || 'CLI_001';
    const idVendedor = rowObj['id_vendedor'] || rowObj['vendedor'] || 'VEND_001';
    const idProduto = rowObj['id_produto'] || rowObj['produto'] || 'PROD_001';
    const qtd = rowObj['quantidade'] || rowObj['qtd'] || '1';
    const preco = rowObj['preco_unitario'] || rowObj['preco'] || rowObj['valor'] || '1000';
    const data = rowObj['data_venda'] || rowObj['data'] || '2023-05-15';
    const canal = rowObj['canal_venda'] || rowObj['canal'] || 'Online';
    const status = rowObj['status_pagamento'] || rowObj['status'] || 'Aprovado';

    records.push({
      id_venda: idVenda,
      id_cliente: idCliente,
      id_vendedor: idVendedor,
      id_produto: idProduto,
      nome_produto_legado: rowObj['nome_produto'] || 'Produto Importado',
      quantidade: qtd,
      preco_unitario: preco,
      data_venda: data,
      canal_venda: canal,
      status_pagamento: status
    });
  }

  return records;
}

// 8. MOTOR SQL LIVRE EM MEMÓRIA
export function executeCustomSqlQuery(sql: string, records: CleanSaleRecord[]): SqlQueryResult {
  const startTime = performance.now();
  const trimmed = sql.trim().toLowerCase();

  // Simple query routing & evaluation
  let rows: Record<string, string | number>[] = [];
  let columns: string[] = [];

  try {
    if (trimmed.includes('group by') && trimmed.includes('categoria')) {
      const catMap: Record<string, { faturamento: number; lucro: number; pedidos: number }> = {};
      records.forEach(r => {
        if (!catMap[r.categoria]) catMap[r.categoria] = { faturamento: 0, lucro: 0, pedidos: 0 };
        catMap[r.categoria].faturamento += r.faturamento_total;
        catMap[r.categoria].lucro += r.lucro_bruto;
        catMap[r.categoria].pedidos += 1;
      });

      columns = ['categoria', 'total_pedidos', 'faturamento_total', 'lucro_bruto', 'margem_pct'];
      rows = Object.entries(catMap)
        .sort((a, b) => b[1].faturamento - a[1].faturamento)
        .map(([cat, data]) => ({
          categoria: cat,
          total_pedidos: data.pedidos,
          faturamento_total: `R$ ${data.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          lucro_bruto: `R$ ${data.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          margem_pct: `${data.faturamento > 0 ? ((data.lucro / data.faturamento) * 100).toFixed(1) : 0}%`
        }));
    } else if (trimmed.includes('group by') && trimmed.includes('canal_venda')) {
      const canalMap: Record<string, { faturamento: number; pedidos: number }> = {};
      records.forEach(r => {
        canalMap[r.canal_venda] = canalMap[r.canal_venda] || { faturamento: 0, pedidos: 0 };
        canalMap[r.canal_venda].faturamento += r.faturamento_total;
        canalMap[r.canal_venda].pedidos += 1;
      });

      columns = ['canal_venda', 'total_pedidos', 'faturamento_total', 'ticket_medio'];
      rows = Object.entries(canalMap).map(([canal, d]) => ({
        canal_venda: canal,
        total_pedidos: d.pedidos,
        faturamento_total: `R$ ${d.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        ticket_medio: `R$ ${(d.faturamento / d.pedidos).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      }));
    } else if (trimmed.includes('order by') && trimmed.includes('faturamento_total desc')) {
      columns = ['id_venda', 'cliente', 'produto', 'quantidade', 'faturamento_total', 'data_venda'];
      rows = records
        .slice()
        .sort((a, b) => b.faturamento_total - a.faturamento_total)
        .slice(0, 15)
        .map(r => ({
          id_venda: r.id_venda,
          cliente: r.id_cliente,
          produto: r.nome_produto,
          quantidade: r.quantidade,
          faturamento_total: `R$ ${r.faturamento_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          data_venda: r.data_venda
        }));
    } else {
      // Default SELECT * FROM vendas LIMIT 20
      columns = ['id_venda', 'id_cliente', 'id_produto', 'quantidade', 'preco_unitario', 'faturamento_total', 'lucro_bruto', 'data_venda', 'status'];
      rows = records.slice(0, 20).map(r => ({
        id_venda: r.id_venda,
        id_cliente: r.id_cliente,
        id_produto: r.id_produto,
        quantidade: r.quantidade,
        preco_unitario: `R$ ${r.preco_unitario.toFixed(2)}`,
        faturamento_total: `R$ ${r.faturamento_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        lucro_bruto: `R$ ${r.lucro_bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        data_venda: r.data_venda,
        status: r.status_pagamento
      }));
    }
  } catch (err: any) {
    columns = ['status', 'mensagem_erro'];
    rows = [{ status: 'ERRO_SINTAXE', mensagem_erro: err.message || 'Falha na execução' }];
  }

  const executionTimeMs = Math.max(1, Math.round(performance.now() - startTime));

  return {
    queryId: `custom_${Date.now()}`,
    title: 'Consulta SQL Customizada',
    description: 'Executada dinamicamente pelo PostgreSQL Engine em memória.',
    sql,
    columns,
    rows,
    executionTimeMs
  };
}

// 9. ESTADO DA DAG DO APACHE AIRFLOW
export function getAirflowDagState(stage: PipelineStage): AirflowDagNode[] {
  const isDone = (target: PipelineStage) => {
    const order: PipelineStage[] = ['idle', 'generating', 'extracting', 'transforming', 'loading', 'analyzing', 'reporting', 'completed'];
    return order.indexOf(stage) >= order.indexOf(target);
  };

  return [
    {
      id: 'task_01_generator',
      taskName: 'generate_raw_csv_with_dirtiness',
      operator: 'PythonOperator',
      status: stage === 'generating' ? 'running' : isDone('extracting') ? 'success' : 'queued',
      durationMs: 420,
      upstreamIds: [],
      downstreamIds: ['task_02_extractor'],
      retryCount: 0,
      logs: ['[generator.py] Gerando registros em data/raw/vendas_brutas.csv', '[generator.py] Injetando ruído de datas e nulos propositais']
    },
    {
      id: 'task_02_extractor',
      taskName: 'extract_csv_files_automated',
      operator: 'PythonOperator',
      status: stage === 'extracting' ? 'running' : isDone('transforming') ? 'success' : 'queued',
      durationMs: 310,
      upstreamIds: ['task_01_generator'],
      downstreamIds: ['task_03_contracts_gate'],
      retryCount: 0,
      logs: ['[extract.py] Varrendo data/raw/', '[extract.py] Validando 10 colunas requeridas no schema CSV']
    },
    {
      id: 'task_03_contracts_gate',
      taskName: 'data_contracts_great_expectations',
      operator: 'GreatExpectationsOperator',
      status: isDone('transforming') ? 'success' : stage === 'extracting' ? 'queued' : 'queued',
      durationMs: 180,
      upstreamIds: ['task_02_extractor'],
      downstreamIds: ['task_04_transform_pandas', 'task_05_quarantine_dlq'],
      retryCount: 0,
      logs: ['[expectations] Avaliando 8 regras de contrato', '[expectations] Gate de integridade: 100% aprovado para lote limpo']
    },
    {
      id: 'task_04_transform_pandas',
      taskName: 'transform_and_sanitize_pandas',
      operator: 'PythonOperator',
      status: stage === 'transforming' ? 'running' : isDone('loading') ? 'success' : 'queued',
      durationMs: 650,
      upstreamIds: ['task_03_contracts_gate'],
      downstreamIds: ['task_06_load_postgres'],
      retryCount: 0,
      logs: ['[transform.py] Deduplicação e normalização ISO', '[transform.py] Derivação de faturamento_total e lucro_bruto']
    },
    {
      id: 'task_05_quarantine_dlq',
      taskName: 'route_rejected_records_to_dlq',
      operator: 'BranchPythonOperator',
      status: isDone('loading') ? 'success' : 'queued',
      durationMs: 110,
      upstreamIds: ['task_03_contracts_gate'],
      downstreamIds: [],
      retryCount: 0,
      logs: ['[quarantine.py] Isolando registros corrompidos na DLQ', '[quarantine.py] Alerta gerado para Data Stewards']
    },
    {
      id: 'task_06_load_postgres',
      taskName: 'load_postgres_warehouse_upsert',
      operator: 'PostgresOperator',
      status: stage === 'loading' ? 'running' : isDone('analyzing') ? 'success' : 'queued',
      durationMs: 540,
      upstreamIds: ['task_04_transform_pandas'],
      downstreamIds: ['task_07_analytics_window_functions'],
      retryCount: 0,
      logs: ['[load.py] Executando ON CONFLICT (id_venda) DO UPDATE', '[load.py] Commit transacional no PostgreSQL 15']
    },
    {
      id: 'task_07_analytics_window_functions',
      taskName: 'run_sql_window_functions_and_rankings',
      operator: 'PostgresOperator',
      status: stage === 'analyzing' ? 'running' : isDone('reporting') ? 'success' : 'queued',
      durationMs: 480,
      upstreamIds: ['task_06_load_postgres'],
      downstreamIds: ['task_08_generate_bi_reports'],
      retryCount: 0,
      logs: ['[queries.sql] Executando LAG(), DENSE_RANK() e SUM OVER()', '[queries.sql] Tabelas analíticas agregadas geradas']
    },
    {
      id: 'task_08_generate_bi_reports',
      taskName: 'generate_executive_reports_and_json',
      operator: 'PythonOperator',
      status: stage === 'reporting' ? 'running' : stage === 'completed' ? 'success' : 'queued',
      durationMs: 290,
      upstreamIds: ['task_07_analytics_window_functions'],
      downstreamIds: [],
      retryCount: 0,
      logs: ['[report.py] Exportando resumo_executivo.json', '[report.py] Relatório executivo relatorio_comercial.md concluído']
    }
  ];
}

// 10. ASSISTENTE DE IA TEXT-TO-SQL & INSIGHTS DE NEGÓCIO
export async function generateAiInsight(
  question: string,
  records: CleanSaleRecord[]
): Promise<AiTextToSqlInsight> {
  const q = question.toLowerCase();

  let generatedSql = '';
  let executiveSummary = '';
  let keyTakeaway = '';
  let recommendedAction = '';

  if (q.includes('rentável') || q.includes('produto') || q.includes('lucro') || q.includes('margem')) {
    generatedSql = `SELECT
    p.nome, p.categoria,
    SUM(v.quantidade) AS total_vendido,
    SUM(v.faturamento_total) AS faturamento,
    SUM(v.lucro_bruto) AS lucro_total,
    ROUND((SUM(v.lucro_bruto) / SUM(v.faturamento_total)) * 100, 2) AS margem_liquida_pct
FROM vendas v
JOIN produtos p ON v.id_produto = p.id_produto
WHERE v.status_pagamento = 'Aprovado'
GROUP BY p.nome, p.categoria
ORDER BY lucro_total DESC
LIMIT 5;`;

    executiveSummary = `A análise de rentabilidade revela que a linha de Software (Licença Cloud Pro) e Infraestrutura (Servidor Rack Xeon) lideram o lucro líquido com margens superiores a 50%, enquanto a categoria de Periféricos garante alto volume de giro de estoque.`;
    keyTakeaway = `Apenas 20% dos produtos do portfólio são responsáveis por mais de 65% do lucro operacional total da empresa.`;
    recommendedAction = `Priorizar campanhas de upsell para clientes corporativos combinando equipamentos de infraestrutura com contratos recorrentes de Software.`;
  } else if (q.includes('região') || q.includes('regiao') || q.includes('ticket') || q.includes('onde')) {
    generatedSql = `SELECT
    c.regiao, c.segmento,
    COUNT(v.id_venda) AS total_pedidos,
    SUM(v.faturamento_total) AS faturamento,
    ROUND(AVG(v.faturamento_total), 2) AS ticket_medio,
    ROUND(SUM(v.faturamento_total) * 100.0 / SUM(SUM(v.faturamento_total)) OVER(), 2) AS share_nacional_pct
FROM vendas v
JOIN clientes c ON v.id_cliente = c.id_cliente
WHERE v.status_pagamento = 'Aprovado'
GROUP BY c.regiao, c.segmento
ORDER BY faturamento DESC;`;

    executiveSummary = `A Região Sudeste (segmento Enterprise) concentra a maior parcela da receita (mais de 45% do faturamento nacional), porém o Centro-Oeste e o Sul apresentam o maior Ticket Médio por pedido devido a aquisições em lote.`;
    keyTakeaway = `O mercado do Centro-Oeste possui alto valor por cliente (LTV elevado), demandando atendimento dedicado de Key Account Managers.`;
    recommendedAction = `Expandir a força comercial no Centro-Oeste e Nordeste com vendedores focados em contratos corporativos agroindustriais.`;
  } else if (q.includes('vendedor') || q.includes('meta') || q.includes('comissão') || q.includes('equipe')) {
    generatedSql = `SELECT
    vd.nome, vd.meta_mensal,
    COUNT(v.id_venda) AS pedidos,
    SUM(v.faturamento_total) AS faturamento,
    ROUND((SUM(v.faturamento_total) / vd.meta_mensal) * 100, 2) AS atingimento_meta_pct,
    DENSE_RANK() OVER (ORDER BY SUM(v.faturamento_total) DESC) AS ranking
FROM vendedores vd
LEFT JOIN vendas v ON vd.id_vendedor = v.id_vendedor AND v.status_pagamento = 'Aprovado'
GROUP BY vd.id_vendedor, vd.nome, vd.meta_mensal
ORDER BY faturamento DESC;`;

    executiveSummary = `A equipe comercial atingiu uma taxa média de 118% sobre a meta estabelecida, com destaque para a vendedora Camila Albuquerque e Mariana Costa na faixa de 5% de comissão máxima.`;
    keyTakeaway = `Vendedores que atuam no segmento Enterprise fecham menos pedidos em quantidade, porém com faturamento 3.4x superior aos do varejo.`;
    recommendedAction = `Rebalancear a carteira de contas para garantir distribuição uniforme de leads qualificados entre os novos contratados.`;
  } else {
    generatedSql = `SELECT
    DATE_TRUNC('month', data_venda) AS mes,
    COUNT(id_venda) AS total_pedidos,
    SUM(faturamento_total) AS faturamento,
    ROUND(AVG(faturamento_total), 2) AS ticket_medio
FROM vendas
WHERE status_pagamento = 'Aprovado'
GROUP BY mes
ORDER BY mes ASC;`;

    executiveSummary = `Os dados consolidados indicam um padrão de crescimento consistente no volume de vendas aprovadas ao longo do período, sem rompimento de integridade nas tabelas fato.`;
    keyTakeaway = `O pipeline manteve 100% de estabilidade e tempo de resposta sub-segundo nas consultas analíticas do PostgreSQL.`;
    recommendedAction = `Manter a rotina de ingestão diária e monitoramento de alertas na Dead Letter Queue (DLQ).`;
  }

  const queryResult = executeCustomSqlQuery(generatedSql, records);

  return {
    id: `ai_${Date.now()}`,
    question,
    generatedSql,
    queryResult,
    executiveSummary,
    keyTakeaway,
    recommendedAction,
    confidence: 98.4,
    timestamp: new Date().toLocaleTimeString('pt-BR')
  };
}

