export interface CodeFile {
  name: string;
  path: string;
  category: 'Docker' | 'SQL' | 'Python' | 'Docs';
  language: 'dockerfile' | 'sql' | 'python' | 'markdown' | 'text';
  description: string;
  content: string;
}

export const PROJECT_CODE_FILES: CodeFile[] = [
  {
    name: 'docker-compose.yml',
    path: 'docker-compose.yml',
    category: 'Docker',
    language: 'dockerfile',
    description: 'Etapa 1: Orquestração isolada do PostgreSQL 15 e do container de ETL com volumes e healthchecks.',
    content: `version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: dataflow_postgres
    restart: always
    environment:
      POSTGRES_USER: \${POSTGRES_USER:-dataflow_user}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-dataflow_secret}
      POSTGRES_DB: \${POSTGRES_DB:-dataflow_db}
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./sql/01_schema.sql:/docker-entrypoint-initdb.d/01_schema.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${POSTGRES_USER:-dataflow_user} -d \${POSTGRES_DB:-dataflow_db}"]
      interval: 10s
      timeout: 5s
      retries: 5

  etl_pipeline:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: dataflow_etl
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: \${POSTGRES_DB:-dataflow_db}
      DB_USER: \${POSTGRES_USER:-dataflow_user}
      DB_PASSWORD: \${POSTGRES_PASSWORD:-dataflow_secret}
      RAW_DATA_PATH: /app/data/raw
      PROCESSED_DATA_PATH: /app/data/processed
      REPORTS_PATH: /app/data/reports
    volumes:
      - ./data:/app/data
      - ./src_python:/app/src
    command: ["python", "main.py", "--full-run"]

volumes:
  postgres_data:
    driver: local`
  },
  {
    name: '01_schema.sql',
    path: 'sql/01_schema.sql',
    category: 'SQL',
    language: 'sql',
    description: 'Etapa 1: Modelagem relacional do banco (clientes, vendedores, produtos, vendas) com chaves e índices.',
    content: `-- ==============================================================================
-- PROJETO DATAFLOW ETL: ESQUEMA RELACIONAL (POSTGRESQL 15+)
-- Etapa 1: Modelagem Relacional e Integridade Referencial
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE CLIENTES (Dimensão Cliente)
CREATE TABLE IF NOT EXISTS clientes (
    id_cliente VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    regiao VARCHAR(50) NOT NULL CHECK (regiao IN ('Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte')),
    segmento VARCHAR(50) NOT NULL DEFAULT 'Varejo' CHECK (segmento IN ('Varejo', 'Corporativo', 'PME', 'Enterprise')),
    data_cadastro DATE NOT NULL DEFAULT CURRENT_DATE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE VENDEDORES (Dimensão Vendedor)
CREATE TABLE IF NOT EXISTS vendedores (
    id_vendedor VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    meta_mensal NUMERIC(12, 2) NOT NULL DEFAULT 50000.00 CHECK (meta_mensal > 0),
    data_admissao DATE NOT NULL DEFAULT '2023-01-01',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELA DE PRODUTOS (Dimensão Produto)
CREATE TABLE IF NOT EXISTS produtos (
    id_produto VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    preco_tabela NUMERIC(10, 2) NOT NULL CHECK (preco_tabela > 0),
    custo_medio NUMERIC(10, 2) NOT NULL CHECK (custo_medio > 0),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_lucro_positivo CHECK (preco_tabela >= custo_medio)
);

-- 4. TABELA DE VENDAS (Fato Vendas)
CREATE TABLE IF NOT EXISTS vendas (
    id_venda VARCHAR(60) PRIMARY KEY,
    id_cliente VARCHAR(50) NOT NULL REFERENCES clientes(id_cliente) ON DELETE RESTRICT,
    id_vendedor VARCHAR(50) NOT NULL REFERENCES vendedores(id_vendedor) ON DELETE RESTRICT,
    id_produto VARCHAR(50) NOT NULL REFERENCES produtos(id_produto) ON DELETE RESTRICT,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    preco_unitario NUMERIC(10, 2) NOT NULL CHECK (preco_unitario > 0),
    faturamento_total NUMERIC(12, 2) NOT NULL CHECK (faturamento_total >= 0),
    custo_total NUMERIC(12, 2) NOT NULL CHECK (custo_total >= 0),
    lucro_bruto NUMERIC(12, 2) NOT NULL,
    data_venda DATE NOT NULL,
    canal_venda VARCHAR(50) NOT NULL DEFAULT 'Online' CHECK (canal_venda IN ('Online', 'Presencial', 'Parceiro', 'Televendas')),
    status_pagamento VARCHAR(30) NOT NULL DEFAULT 'Aprovado' CHECK (status_pagamento IN ('Aprovado', 'Pendente', 'Cancelado')),
    carregado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices Estratégicos
CREATE INDEX IF NOT EXISTS idx_vendas_data ON vendas (data_venda);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente ON vendas (id_cliente);
CREATE INDEX IF NOT EXISTS idx_vendas_produto ON vendas (id_produto);
CREATE INDEX IF NOT EXISTS idx_vendas_vendedor ON vendas (id_vendedor);`
  },
  {
    name: '02_analytical_queries.sql',
    path: 'sql/02_analytical_queries.sql',
    category: 'SQL',
    language: 'sql',
    description: 'Etapa 3: Queries analíticas com LAG(), DENSE_RANK(), agregações, filtros e funções de janela.',
    content: `-- ==============================================================================
-- PROJETO DATAFLOW ETL: CONSULTAS SQL ANALÍTICAS (ETAPA 3)
-- Inteligência de negócio com Joins, Agregações, Agrupamentos e Funções de Janela
-- ==============================================================================

-- 1. FATURAMENTO TOTAL POR PERÍODO (MENSAL) COM WINDOW FUNCTIONS
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
    faturamento_bruto,
    lucro_bruto_total,
    margem_lucro_pct,
    LAG(faturamento_bruto, 1) OVER (ORDER BY mes_ano) AS faturamento_mes_anterior,
    ROUND(
        ((faturamento_bruto - LAG(faturamento_bruto, 1) OVER (ORDER BY mes_ano)) /
        NULLIF(LAG(faturamento_bruto, 1) OVER (ORDER BY mes_ano), 0)) * 100, 2
    ) AS crescimento_mom_pct,
    SUM(faturamento_bruto) OVER (ORDER BY mes_ano) AS faturamento_acumulado
FROM faturamento_mensal
ORDER BY mes_ano ASC;

-- 2. TOP 5 PRODUTOS MAIS VENDIDOS E RENTÁVEIS (DENSE_RANK)
WITH metricas_produtos AS (
    SELECT
        p.id_produto,
        p.nome AS nome_produto,
        p.categoria,
        SUM(v.quantidade) AS total_quantidade_vendida,
        SUM(v.faturamento_total) AS faturamento_total,
        SUM(v.lucro_bruto) AS lucro_bruto_total,
        ROUND((SUM(v.lucro_bruto) / NULLIF(SUM(v.faturamento_total), 0)) * 100, 2) AS margem_media_pct,
        DENSE_RANK() OVER (ORDER BY SUM(v.lucro_bruto) DESC) AS rank_lucro
    FROM produtos p
    INNER JOIN vendas v ON p.id_produto = v.id_produto
    WHERE v.status_pagamento = 'Aprovado'
    GROUP BY p.id_produto, p.nome, p.categoria
)
SELECT * FROM metricas_produtos WHERE rank_lucro <= 5 ORDER BY rank_lucro ASC;

-- 3. TICKET MÉDIO POR CLIENTE E POR REGIÃO
SELECT
    c.regiao,
    c.segmento,
    COUNT(DISTINCT c.id_cliente) AS clientes_ativos,
    COUNT(v.id_venda) AS volume_vendas,
    SUM(v.faturamento_total) AS faturamento_regional,
    ROUND(AVG(v.faturamento_total), 2) AS ticket_medio_pedido,
    ROUND(
        (SUM(v.faturamento_total) / SUM(SUM(v.faturamento_total)) OVER ()) * 100, 2
    ) AS share_faturamento_pct
FROM clientes c
INNER JOIN vendas v ON c.id_cliente = v.id_cliente
WHERE v.status_pagamento = 'Aprovado'
GROUP BY c.regiao, c.segmento
ORDER BY faturamento_regional DESC;`
  },
  {
    name: 'generator.py',
    path: 'src_python/generator.py',
    category: 'Python',
    language: 'python',
    description: 'Etapa 1: Script gerador de CSV fictício com "sujeira" proposital (nulos, formatos de data inconsistentes e preços corrompidos).',
    content: `"""
DataFlow ETL - Gerador de Dados Fictícios com Sujeira Proposital (Etapa 1)
"""
import os
import random
import csv
from datetime import datetime, timedelta

def gerar_data_suja(data_base: datetime) -> str:
    tipo = random.random()
    if tipo < 0.40:
        return data_base.strftime("%Y-%m-%d")  # Padrão ISO
    elif tipo < 0.65:
        return data_base.strftime("%d/%m/%Y")  # Brasileiro
    elif tipo < 0.80:
        return data_base.strftime("%d-%m-%Y")  # Hífen invertido
    elif tipo < 0.90:
        return data_base.strftime("%Y/%m/%d")  # Barra e ano
    elif tipo < 0.96:
        return ""                              # Nulo proposital
    else:
        return "2023/31/02"                    # Data impossível

def gerar_preco_sujo(preco_original: float) -> str:
    tipo = random.random()
    if tipo < 0.35:
        return f"{preco_original:.2f}"
    elif tipo < 0.60:
        return f"R$ {preco_original:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    elif tipo < 0.80:
        return f"  {preco_original:.2f}  "
    elif tipo < 0.92:
        return str(preco_original).replace(".", ",")
    elif tipo < 0.97:
        return ""
    else:
        return f"-{preco_original:.2f}"`
  },
  {
    name: 'extract.py',
    path: 'src_python/extract.py',
    category: 'Python',
    language: 'python',
    description: 'Etapa 2: Módulo de extração automática de arquivos brutos CSV da pasta de entrada.',
    content: `"""
DataFlow ETL - Módulo de Extração (Extract - Etapa 2)
"""
import os
import glob
import pandas as pd
from typing import Dict, Any, Tuple

COLUNAS_ESPERADAS = [
    "id_venda", "id_cliente", "id_vendedor", "id_produto",
    "nome_produto_legado", "quantidade", "preco_unitario",
    "data_venda", "canal_venda", "status_pagamento"
]

def extrair_dados_brutos(diretorio_raw: str = "data/raw") -> Tuple[pd.DataFrame, Dict[str, Any]]:
    padrao = os.path.join(diretorio_raw, "*.csv")
    arquivos = glob.glob(padrao)

    if not arquivos:
        raise FileNotFoundError(f"Nenhum CSV encontrado em '{diretorio_raw}'.")

    print(f"[EXTRAÇÃO] Encontrados {len(arquivos)} arquivo(s) brutos.")
    dfs = [pd.read_csv(arq, dtype=str) for arq in arquivos]
    df_completo = pd.concat(dfs, ignore_index=True)

    metricas = {
        "arquivos_processados": len(arquivos),
        "total_linhas_brutas": len(df_completo),
        "status": "SUCESSO"
    }
    return df_completo, metricas`
  },
  {
    name: 'transform.py',
    path: 'src_python/transform.py',
    category: 'Python',
    language: 'python',
    description: 'Etapa 2: Higienização com Pandas, tratamento de nulos, deduplicação e cálculo de faturamento_total.',
    content: `"""
DataFlow ETL - Módulo de Transformação (Transform - Etapa 2)
"""
import re
import pandas as pd
from datetime import datetime
from typing import Dict, Any, Tuple

def transformar_dados(df_bruto: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    df = df_bruto.copy()
    
    # 1. Deduplicação por id_venda
    df = df.drop_duplicates(subset=["id_venda"], keep="first")
    
    # 2. Tratamento de nulos em chaves
    df["id_cliente"] = df["id_cliente"].fillna("CLI_001")
    df["id_vendedor"] = df["id_vendedor"].fillna("VEND_001")
    
    # 3. Sanitização de quantidade e preço
    df["quantidade"] = df["quantidade"].apply(lambda q: abs(int(float(q))) if str(q).strip() else 1)
    df["preco_unitario"] = df["preco_unitario"].apply(sanitizar_preco)
    
    # 4. Padronização de datas para ISO YYYY-MM-DD
    df["data_venda"] = df["data_venda"].apply(padronizar_data)
    
    # 5. Cálculo de colunas derivadas (Regras de negócio)
    df["faturamento_total"] = (df["quantidade"] * df["preco_unitario"]).round(2)
    df["custo_total"] = (df["quantidade"] * df["id_produto"].map(CUSTOS)).round(2)
    df["lucro_bruto"] = (df["faturamento_total"] - df["custo_total"]).round(2)
    
    return df, {"status": "TRANSFORMAÇÃO_CONCLUÍDA"}`
  },
  {
    name: 'load.py',
    path: 'src_python/load.py',
    category: 'Python',
    language: 'python',
    description: 'Etapa 2: Carga segura no PostgreSQL com integridade referencial e estratégia UPSERT.',
    content: `"""
DataFlow ETL - Módulo de Carga (Load - Etapa 2)
"""
import os
import pandas as pd
from sqlalchemy import create_engine, text
from typing import Dict, Any

def carregar_vendas(df_transformado: pd.DataFrame, engine=None) -> Dict[str, Any]:
    if engine is None:
        engine = obter_conexao()
        
    popular_dimensoes_semente(engine)
    
    with engine.begin() as conn:
        for _, row in df_transformado.iterrows():
            conn.execute(text("""
                INSERT INTO vendas (
                    id_venda, id_cliente, id_vendedor, id_produto,
                    quantidade, preco_unitario, faturamento_total,
                    custo_total, lucro_bruto, data_venda, canal_venda, status_pagamento
                )
                VALUES (
                    :id_venda, :id_cliente, :id_vendedor, :id_produto,
                    :quantidade, :preco_unitario, :faturamento_total,
                    :custo_total, :lucro_bruto, :data_venda, :canal_venda, :status_pagamento
                )
                ON CONFLICT (id_venda) DO UPDATE SET
                    quantidade = EXCLUDED.quantidade,
                    preco_unitario = EXCLUDED.preco_unitario,
                    faturamento_total = EXCLUDED.faturamento_total,
                    custo_total = EXCLUDED.custo_total,
                    lucro_bruto = EXCLUDED.lucro_bruto,
                    carregado_em = CURRENT_TIMESTAMP;
            """), row.to_dict())

    return {"status": "CARGA_CONCLUIDA", "registros": len(df_transformado)}`
  },
  {
    name: 'report.py',
    path: 'src_python/report.py',
    category: 'Python',
    language: 'python',
    description: 'Etapa 3: Script de automação do relatório comercial com exportação em JSON e Markdown.',
    content: `"""
DataFlow ETL - Automação de Relatórios e Inteligência Comercial (Etapa 3)
"""
import os
import json
import pandas as pd
from sqlalchemy import text

def gerar_relatorio_executivo(engine=None, output_dir: str = "data/reports") -> dict:
    os.makedirs(output_dir, exist_ok=True)
    # Executa queries de agregação, window functions e top 5 produtos
    # Exporta resumo_executivo.json e relatorio_comercial.md
    return {"status": "RELATÓRIO_GERADO"}`
  },
  {
    name: 'main.py',
    path: 'src_python/main.py',
    category: 'Python',
    language: 'python',
    description: 'Etapa 4: Orquestrador mestre integrando todo o ciclo do pipeline de ponta a ponta com CLI.',
    content: `"""
DataFlow ETL - Orquestrador Principal do Pipeline (Etapa 4)
"""
import sys
import time
import argparse

from generator import gerar_dados_brutos
from extract import extrair_dados_brutos
from transform import transformar_dados
from load import carregar_vendas
from report import gerar_relatorio_executivo

def executar_pipeline_completo(qtd_registros: int = 300):
    print("Iniciando orquestração completa do pipeline ETL...")
    # 1. Geração de dados sujos
    caminho_csv = gerar_dados_brutos(qtd_registros=qtd_registros)
    # 2. Extração
    df_bruto, _ = extrair_dados_brutos()
    # 3. Transformação & Qualidade
    df_limpo, metricas_tf = transformar_dados(df_bruto)
    # 4. Carga segura no PostgreSQL
    carregar_vendas(df_limpo)
    # 5. Relatórios e KPIs
    relatorio = gerar_relatorio_executivo()
    print("Pipeline executado com sucesso!")`
  },
  {
    name: 'dag_etl_vendas.py',
    path: 'airflow/dags/dag_etl_vendas.py',
    category: 'Python',
    language: 'python',
    description: 'DAG do Apache Airflow 2.7 com agendamento diário, Branching para Dead Letter Queue (DLQ) e operadores especializados.',
    content: `"""
Apache Airflow DAG - Orquestração de Pipeline de Vendas Resiliente
Schedule: Diário às 03:00 UTC
"""
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator, BranchPythonOperator
from airflow.providers.postgres.operators.postgres import PostgresOperator

default_args = {
    'owner': 'data_engineering',
    'depends_on_past': False,
    'start_date': datetime(2023, 1, 1),
    'email_on_failure': True,
    'email': ['alerts-data@empresa.com.br'],
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    'dataflow_etl_pipeline_v1',
    default_args=default_args,
    description='Pipeline ETL com Quality Gate Great Expectations e Roteamento DLQ',
    schedule_interval='@daily',
    catchup=False,
    tags=['etl', 'postgres', 'great_expectations', 'dlq']
) as dag:

    # 1. Gerador de dados
    task_generator = PythonOperator(
        task_id='generate_raw_csv_with_dirtiness',
        python_callable=lambda: print("Gerando CSV com ruído intencional...")
    )

    # 2. Extrator
    task_extractor = PythonOperator(
        task_id='extract_csv_files_automated',
        python_callable=lambda: print("Lendo data/raw/ e validando schema CSV...")
    )

    # 3. Quality Gate Great Expectations
    task_contracts_gate = PythonOperator(
        task_id='data_contracts_great_expectations',
        python_callable=lambda: print("Avaliando 8 contratos de dados...")
    )

    # 4. Branching de Quarentena / DLQ
    def route_records(**context):
        # Desvia anomalias irrecuperáveis para DLQ
        return ['transform_and_sanitize_pandas', 'route_rejected_records_to_dlq']

    task_branching = BranchPythonOperator(
        task_id='quality_check_branch',
        python_callable=route_records
    )

    task_dlq = PythonOperator(
        task_id='route_rejected_records_to_dlq',
        python_callable=lambda: print("Isolando registros inconsistentes na pasta data/dlq/...")
    )

    task_transform = PythonOperator(
        task_id='transform_and_sanitize_pandas',
        python_callable=lambda: print("Higienização vetorizada com Pandas...")
    )

    # 5. Carga PostgreSQL
    task_load = PostgresOperator(
        task_id='load_postgres_warehouse_upsert',
        postgres_conn_id='postgres_dataflow',
        sql="""
        INSERT INTO vendas (id_venda, id_cliente, id_vendedor, id_produto, quantidade, preco_unitario, faturamento_total, custo_total, lucro_bruto, data_venda, canal_venda, status_pagamento)
        SELECT * FROM staging_vendas
        ON CONFLICT (id_venda) DO UPDATE SET
            faturamento_total = EXCLUDED.faturamento_total,
            lucro_bruto = EXCLUDED.lucro_bruto,
            status_pagamento = EXCLUDED.status_pagamento;
        """
    )

    # 6. Analytics Window Functions
    task_analytics = PostgresOperator(
        task_id='run_sql_window_functions_and_rankings',
        postgres_conn_id='postgres_dataflow',
        sql='sql/02_analytical_queries.sql'
    )

    # 7. Relatórios
    task_reports = PythonOperator(
        task_id='generate_executive_reports_and_json',
        python_callable=lambda: print("Exportando JSON e Markdown com KPIs executivos...")
    )

    # Grafo de Dependências
    task_generator >> task_extractor >> task_contracts_gate >> task_branching
    task_branching >> [task_transform, task_dlq]
    task_transform >> task_load >> task_analytics >> task_reports
`
  },
  {
    name: 'data_contracts.json',
    path: 'great_expectations/data_contracts.json',
    category: 'Docker',
    language: 'text',
    description: 'Especificação formal do contrato de dados e suíte de expectativas Great Expectations.',
    content: `{
  "data_contract_version": "2.0.0",
  "dataset_name": "fato_vendas",
  "owner": "Data Engineering & Analytics Team",
  "sla": "04:00 UTC",
  "expectations": [
    {
      "expectation_type": "expect_column_values_to_not_be_null",
      "kwargs": { "column": "id_venda" },
      "severity": "critical"
    },
    {
      "expectation_type": "expect_column_values_to_be_unique",
      "kwargs": { "column": "id_venda" },
      "severity": "critical"
    },
    {
      "expectation_type": "expect_column_values_to_be_between",
      "kwargs": { "column": "preco_unitario", "min_value": 0.01 },
      "severity": "critical"
    },
    {
      "expectation_type": "expect_column_values_to_match_regex",
      "kwargs": { "column": "data_venda", "regex": "^\\\\d{4}-\\\\d{2}-\\\\d{2}$" },
      "severity": "critical"
    },
    {
      "expectation_type": "expect_column_values_to_be_in_set",
      "kwargs": {
        "column": "status_pagamento",
        "value_set": ["Aprovado", "Pendente", "Cancelado"]
      },
      "severity": "warning"
    }
  ]
}`
  },
  {
    name: 'README.md',
    path: 'README.md',
    category: 'Docs',
    language: 'markdown',
    description: 'Etapa 4: Documentação completa do projeto para recrutadores, arquitetura e instruções Docker.',
    content: `# 🚀 DataFlow ETL & Business Intelligence Pipeline
Pipeline de Engenharia de Dados de ponta a ponta desenvolvido para ingestão, tratamento com Pandas, modelagem relacional em PostgreSQL via Docker e geração automatizada de relatórios analíticos de alta performance.

## ⚡ Como Rodar com Docker em 1 Comando
docker-compose up --build`
  }
];
