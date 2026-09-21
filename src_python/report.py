"""
DataFlow ETL - Automação de Relatórios e Inteligência Comercial (Etapa 3)
Executa as consultas SQL analíticas avançadas no PostgreSQL, sumariza os indicadores
estratégicos e gera relatórios executivos estruturados em JSON e Markdown.
"""

import os
import json
import pandas as pd
from datetime import datetime
from sqlalchemy import text
from load import obter_conexao


def gerar_relatorio_executivo(engine=None, output_dir: str = "data/reports") -> dict:
    """
    Executa as queries de negócio, formata os KPIs e exporta os arquivos consolidado.
    """
    if engine is None:
        engine = obter_conexao()

    os.makedirs(output_dir, exist_ok=True)
    print("[RELATÓRIO] Executando queries analíticas no banco PostgreSQL...")

    # 1. Faturamento Total e Indicadores Macro
    query_kpis = """
        SELECT
            COUNT(id_venda) AS total_pedidos,
            SUM(faturamento_total) AS faturamento_total,
            SUM(lucro_bruto) AS lucro_total,
            ROUND(AVG(faturamento_total), 2) AS ticket_medio_geral,
            ROUND((SUM(lucro_bruto) / NULLIF(SUM(faturamento_total), 0)) * 100, 2) AS margem_bruta_pct
        FROM vendas
        WHERE status_pagamento = 'Aprovado';
    """
    
    # 2. Faturamento por Período Mensal
    query_mensal = """
        SELECT
            TO_CHAR(data_venda, 'YYYY-MM') AS periodo,
            COUNT(id_venda) AS total_pedidos,
            ROUND(SUM(faturamento_total), 2) AS faturamento,
            ROUND(SUM(lucro_bruto), 2) AS lucro,
            ROUND(
                ((SUM(faturamento_total) - LAG(SUM(faturamento_total), 1) OVER (ORDER BY TO_CHAR(data_venda, 'YYYY-MM'))) /
                NULLIF(LAG(SUM(faturamento_total), 1) OVER (ORDER BY TO_CHAR(data_venda, 'YYYY-MM')), 0)) * 100, 2
            ) AS variacao_mom_pct
        FROM vendas
        WHERE status_pagamento = 'Aprovado'
        GROUP BY TO_CHAR(data_venda, 'YYYY-MM')
        ORDER BY periodo ASC;
    """

    # 3. Top 5 Produtos Mais Vendidos e Rentáveis
    query_top_produtos = """
        SELECT
            p.nome AS produto,
            p.categoria,
            SUM(v.quantidade) AS unidades_vendidas,
            ROUND(SUM(v.faturamento_total), 2) AS faturamento,
            ROUND(SUM(v.lucro_bruto), 2) AS lucro_bruto,
            ROUND((SUM(v.lucro_bruto) / NULLIF(SUM(v.faturamento_total), 0)) * 100, 2) AS margem_pct,
            DENSE_RANK() OVER (ORDER BY SUM(v.lucro_bruto) DESC) AS rank_lucro
        FROM produtos p
        JOIN vendas v ON p.id_produto = v.id_produto
        WHERE v.status_pagamento = 'Aprovado'
        GROUP BY p.nome, p.categoria
        ORDER BY lucro_bruto DESC
        LIMIT 5;
    """

    # 4. Ticket Médio por Região e Segmento
    query_regional = """
        SELECT
            c.regiao,
            c.segmento,
            COUNT(DISTINCT c.id_cliente) AS clientes,
            COUNT(v.id_venda) AS transacoes,
            ROUND(SUM(v.faturamento_total), 2) AS faturamento_total,
            ROUND(AVG(v.faturamento_total), 2) AS ticket_medio,
            ROUND((SUM(v.faturamento_total) / SUM(SUM(v.faturamento_total)) OVER ()) * 100, 2) AS participacao_pct
        FROM clientes c
        JOIN vendas v ON c.id_cliente = v.id_cliente
        WHERE v.status_pagamento = 'Aprovado'
        GROUP BY c.regiao, c.segmento
        ORDER BY faturamento_total DESC;
    """

    with engine.connect() as conn:
        kpis_df = pd.read_sql(text(query_kpis), conn)
        mensal_df = pd.read_sql(text(query_mensal), conn)
        produtos_df = pd.read_sql(text(query_top_produtos), conn)
        regional_df = pd.read_sql(text(query_regional), conn)

    kpis_dict = kpis_df.iloc[0].to_dict()

    relatorio_dados = {
        "timestamp_extracao": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "kpis_principais": {
            "total_pedidos": int(kpis_dict.get("total_pedidos", 0)),
            "faturamento_total": float(kpis_dict.get("faturamento_total", 0)),
            "lucro_total": float(kpis_dict.get("lucro_total", 0)),
            "ticket_medio_geral": float(kpis_dict.get("ticket_medio_geral", 0)),
            "margem_bruta_pct": float(kpis_dict.get("margem_bruta_pct", 0)),
        },
        "faturamento_mensal": mensal_df.to_dict(orient="records"),
        "top_5_produtos": produtos_df.to_dict(orient="records"),
        "desempenho_regional": regional_df.to_dict(orient="records")
    }

    # Salva JSON consolidado
    caminho_json = os.path.join(output_dir, "resumo_executivo.json")
    with open(caminho_json, "w", encoding="utf-8") as f:
        json.dump(relatorio_dados, f, ensure_ascii=False, indent=2)

    # Gera Relatório Markdown Executivo
    caminho_md = os.path.join(output_dir, "relatorio_comercial.md")
    with open(caminho_md, "w", encoding="utf-8") as f:
        f.write("# 📊 Relatório Executivo de Inteligência Comercial\n")
        f.write(f"*Gerado automaticamente pelo pipeline DataFlow em {relatorio_dados['timestamp_extracao']}*\n\n")
        f.write("## 1. Visão Geral dos Indicadores Chave (KPIs)\n\n")
        f.write(f"- **Faturamento Bruto:** R$ {kpis_dict.get('faturamento_total', 0):,.2f}\n")
        f.write(f"- **Lucro Bruto Líquido:** R$ {kpis_dict.get('lucro_total', 0):,.2f}\n")
        f.write(f"- **Margem de Lucro Global:** {kpis_dict.get('margem_bruta_pct', 0):.2f}%\n")
        f.write(f"- **Volume de Transações:** {int(kpis_dict.get('total_pedidos', 0))} pedidos faturados\n")
        f.write(f"- **Ticket Médio:** R$ {kpis_dict.get('ticket_medio_geral', 0):,.2f}\n\n")

        f.write("## 2. Top 5 Produtos Mais Rentáveis\n\n")
        f.write("| Rank | Produto | Categoria | Faturamento | Lucro | Margem |\n")
        f.write("| :--- | :--- | :--- | :--- | :--- | :--- |\n")
        for p in produtos_df.itertuples():
            f.write(f"| #{p.rank_lucro} | {p.produto} | {p.categoria} | R$ {p.faturamento:,.2f} | R$ {p.lucro_bruto:,.2f} | {p.margem_pct:.1f}% |\n")

        f.write("\n## 3. Resumo por Região e Segmento\n\n")
        f.write("| Região | Segmento | Pedidos | Faturamento | Ticket Médio | Share % |\n")
        f.write("| :--- | :--- | :--- | :--- | :--- | :--- |\n")
        for r in regional_df.itertuples():
            f.write(f"| {r.regiao} | {r.segmento} | {r.transacoes} | R$ {r.faturamento_total:,.2f} | R$ {r.ticket_medio:,.2f} | {r.participacao_pct:.1f}% |\n")

    print(f"[RELATÓRIO GERADO] Arquivos salvos com sucesso em '{caminho_json}' e '{caminho_md}'!")
    return relatorio_dados


if __name__ == "__main__":
    gerar_relatorio_executivo()
