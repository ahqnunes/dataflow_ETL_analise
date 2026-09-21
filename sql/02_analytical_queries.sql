-- ==============================================================================
-- PROJETO DATAFLOW ETL: CONSULTAS SQL ANALÍTICAS (ETAPA 3)
-- Inteligência de negócio com Joins, Agregações, Agrupamentos e Funções de Janela
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- QUERY 1: FATURAMENTO TOTAL POR PERÍODO (MENSAL) COM WINDOW FUNCTIONS
-- Calcula faturamento mensal, mês anterior (LAG), variação percentual MoM e acumulado no ano.
-- ------------------------------------------------------------------------------
WITH faturamento_mensal AS (
    SELECT
        DATE_TRUNC('month', v.data_venda)::DATE AS mes_ano,
        TO_CHAR(v.data_venda, 'YYYY-MM') AS periodo_formatado,
        COUNT(v.id_venda) AS total_pedidos,
        SUM(v.quantidade) AS total_itens_vendidos,
        SUM(v.faturamento_total) AS faturamento_bruto,
        SUM(v.lucro_bruto) AS lucro_bruto_total,
        ROUND((SUM(v.lucro_bruto) / NULLIF(SUM(v.faturamento_total), 0)) * 100, 2) AS margem_lucro_pct
    FROM vendas v
    WHERE v.status_pagamento = 'Aprovado'
    GROUP BY DATE_TRUNC('month', v.data_venda)::DATE, TO_CHAR(v.data_venda, 'YYYY-MM')
)
SELECT
    periodo_formatado,
    total_pedidos,
    total_itens_vendidos,
    faturamento_bruto,
    lucro_bruto_total,
    margem_lucro_pct,
    -- Window Function: Faturamento do mês anterior
    LAG(faturamento_bruto, 1) OVER (ORDER BY mes_ano) AS faturamento_mes_anterior,
    -- Window Function: Variação Percentual Mês a Mês
    ROUND(
        ((faturamento_bruto - LAG(faturamento_bruto, 1) OVER (ORDER BY mes_ano)) /
        NULLIF(LAG(faturamento_bruto, 1) OVER (ORDER BY mes_ano), 0)) * 100,
        2
    ) AS crescimento_mom_pct,
    -- Window Function: Faturamento Acumulado no Ano
    SUM(faturamento_bruto) OVER (ORDER BY mes_ano ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS faturamento_acumulado
FROM faturamento_mensal
ORDER BY mes_ano ASC;


-- ------------------------------------------------------------------------------
-- QUERY 2: TOP 5 PRODUTOS MAIS VENDIDOS E RENTÁVEIS
-- Utiliza DENSE_RANK() para classificar os produtos por rentabilidade líquida e volume.
-- ------------------------------------------------------------------------------
WITH metricas_produtos AS (
    SELECT
        p.id_produto,
        p.nome AS nome_produto,
        p.categoria,
        COUNT(v.id_venda) AS total_transacoes,
        SUM(v.quantidade) AS total_quantidade_vendida,
        SUM(v.faturamento_total) AS faturamento_total,
        SUM(v.custo_total) AS custo_total,
        SUM(v.lucro_bruto) AS lucro_bruto_total,
        ROUND((SUM(v.lucro_bruto) / NULLIF(SUM(v.faturamento_total), 0)) * 100, 2) AS margem_media_pct,
        -- Window Function: Ranking por Lucro Bruto
        DENSE_RANK() OVER (ORDER BY SUM(v.lucro_bruto) DESC) AS rank_lucro,
        -- Window Function: Ranking por Volume de Vendas
        DENSE_RANK() OVER (ORDER BY SUM(v.quantidade) DESC) AS rank_volume
    FROM produtos p
    INNER JOIN vendas v ON p.id_produto = v.id_produto
    WHERE v.status_pagamento = 'Aprovado'
    GROUP BY p.id_produto, p.nome, p.categoria
)
SELECT
    rank_lucro,
    nome_produto,
    categoria,
    total_quantidade_vendida,
    faturamento_total,
    lucro_bruto_total,
    margem_media_pct,
    rank_volume
FROM metricas_produtos
WHERE rank_lucro <= 5
ORDER BY rank_lucro ASC;


-- ------------------------------------------------------------------------------
-- QUERY 3: TICKET MÉDIO POR CLIENTE E POR REGIÃO
-- Cruzamento entre Dimensão Cliente e Fato Vendas para mapear valor médio por transação e penetração regional.
-- ------------------------------------------------------------------------------
SELECT
    c.regiao,
    c.segmento,
    COUNT(DISTINCT c.id_cliente) AS clientes_ativos,
    COUNT(v.id_venda) AS volume_vendas,
    SUM(v.faturamento_total) AS faturamento_regional,
    ROUND(AVG(v.faturamento_total), 2) AS ticket_medio_pedido,
    ROUND(SUM(v.faturamento_total) / NULLIF(COUNT(DISTINCT c.id_cliente), 0), 2) AS ltv_medio_cliente,
    -- Window Function: Participação % do Faturamento Regional no Total Nacional
    ROUND(
        (SUM(v.faturamento_total) / SUM(SUM(v.faturamento_total)) OVER ()) * 100,
        2
    ) AS share_faturamento_pct
FROM clientes c
INNER JOIN vendas v ON c.id_cliente = v.id_cliente
WHERE v.status_pagamento = 'Aprovado'
GROUP BY c.regiao, c.segmento
ORDER BY faturamento_regional DESC, ticket_medio_pedido DESC;


-- ------------------------------------------------------------------------------
-- QUERY 4: DESEMPENHO E COMISSIONAMENTO DE VENDEDORES (BONUS ANALYTICS)
-- Calcula atingimento de meta individual e comissão progressiva.
-- ------------------------------------------------------------------------------
SELECT
    vd.id_vendedor,
    vd.nome AS nome_vendedor,
    vd.meta_mensal,
    COUNT(v.id_venda) AS total_pedidos_fechados,
    SUM(v.faturamento_total) AS faturamento_realizado,
    ROUND((SUM(v.faturamento_total) / NULLIF(vd.meta_mensal, 0)) * 100, 2) AS percentual_meta_atingida,
    CASE
        WHEN (SUM(v.faturamento_total) / vd.meta_mensal) >= 1.20 THEN ROUND(SUM(v.faturamento_total) * 0.05, 2) -- 5% se bater >120%
        WHEN (SUM(v.faturamento_total) / vd.meta_mensal) >= 1.00 THEN ROUND(SUM(v.faturamento_total) * 0.035, 2) -- 3.5% se bater meta
        ELSE ROUND(SUM(v.faturamento_total) * 0.015, 2) -- 1.5% piso
    END AS comissao_total,
    DENSE_RANK() OVER (ORDER BY SUM(v.faturamento_total) DESC) AS rank_desempenho
FROM vendedores vd
LEFT JOIN vendas v ON vd.id_vendedor = v.id_vendedor AND v.status_pagamento = 'Aprovado'
GROUP BY vd.id_vendedor, vd.nome, vd.meta_mensal
ORDER BY faturamento_realizado DESC;
