"""
DataFlow ETL - Módulo de Carga (Load - Etapa 2)
Responsável por conectar com segurança ao PostgreSQL, garantir a integridade
referencial (carga de dimensões caso necessário) e carregar os dados transformados
na tabela fato 'vendas' com controle transacional e tratamento de conflitos.
"""

import os
import pandas as pd
from sqlalchemy import create_engine, text
from typing import Dict, Any

# Dimensões padrão para garantir integridade referencial antes da carga fato
CLIENTES_SEMENTE = [
    {"id_cliente": "CLI_001", "nome": "Acme Corporation Ltda", "email": "acme@empresa.com.br", "regiao": "Sudeste", "segmento": "Enterprise"},
    {"id_cliente": "CLI_002", "nome": "Silva & Souza Consultoria", "email": "contato@silvasouza.com", "regiao": "Sul", "segmento": "PME"},
    {"id_cliente": "CLI_003", "nome": "TechNova Soluções Digitais", "email": "financeiro@technova.io", "regiao": "Nordeste", "segmento": "Corporativo"},
    {"id_cliente": "CLI_004", "nome": "Varejo Brasil Supermercados", "email": "compras@varejobrasil.com.br", "regiao": "Sudeste", "segmento": "Enterprise"},
    {"id_cliente": "CLI_005", "nome": "AgroForte Distribuidora", "email": "agro@agroforte.com", "regiao": "Centro-Oeste", "segmento": "Corporativo"},
    {"id_cliente": "CLI_006", "nome": "BioSaúde Farmacêutica", "email": "compras@biosaude.med.br", "regiao": "Sudeste", "segmento": "Enterprise"},
    {"id_cliente": "CLI_007", "nome": "Café do Ponto & Cia", "email": "pedidos@cafedoponto.com", "regiao": "Sul", "segmento": "Varejo"},
    {"id_cliente": "CLI_008", "nome": "EletroMundo Eletrônicos", "email": "gerencia@eletromundo.com.br", "regiao": "Nordeste", "segmento": "Varejo"},
    {"id_cliente": "CLI_009", "nome": "Amazonia Madeiras & Móveis", "email": "contato@amazoniamoveis.com", "regiao": "Norte", "segmento": "PME"},
    {"id_cliente": "CLI_010", "nome": "Minas Aço Engenharia", "email": "suprimentos@minasaco.com.br", "regiao": "Sudeste", "segmento": "Corporativo"},
]

VENDEDORES_SEMENTE = [
    {"id_vendedor": "VEND_001", "nome": "Mariana Costa", "email": "mariana.costa@empresa.com", "meta_mensal": 65000.00},
    {"id_vendedor": "VEND_002", "nome": "Lucas Ribeiro", "email": "lucas.ribeiro@empresa.com", "meta_mensal": 55000.00},
    {"id_vendedor": "VEND_003", "nome": "Camila Albuquerque", "email": "camila.albuquerque@empresa.com", "meta_mensal": 70000.00},
    {"id_vendedor": "VEND_004", "nome": "Rodrigo Nogueira", "email": "rodrigo.nogueira@empresa.com", "meta_mensal": 45000.00},
    {"id_vendedor": "VEND_005", "nome": "Beatriz Santos", "email": "beatriz.santos@empresa.com", "meta_mensal": 60000.00},
]

PRODUTOS_SEMENTE = [
    {"id_produto": "PROD_001", "nome": "Notebook Corporativo Dell Latitude", "categoria": "Informática", "preco_tabela": 5200.00, "custo_medio": 3700.00},
    {"id_produto": "PROD_002", "nome": "Monitor Ultrawide 34 LG IPS", "categoria": "Periféricos", "preco_tabela": 2400.00, "custo_medio": 1650.00},
    {"id_produto": "PROD_003", "nome": "Licença Cloud Anual Pro", "categoria": "Software", "preco_tabela": 1800.00, "custo_medio": 450.00},
    {"id_produto": "PROD_004", "nome": "Servidor Rack 1U Xeon", "categoria": "Infraestrutura", "preco_tabela": 12500.00, "custo_medio": 8900.00},
    {"id_produto": "PROD_005", "nome": "Cadeira Ergonômica Pro Executive", "categoria": "Mobiliário", "preco_tabela": 1450.00, "custo_medio": 890.00},
    {"id_produto": "PROD_006", "nome": "Switch Gerenciável 24 Portas PoE", "categoria": "Redes", "preco_tabela": 3200.00, "custo_medio": 2100.00},
    {"id_produto": "PROD_007", "nome": "Teclado Mecânico Wireless", "categoria": "Periféricos", "preco_tabela": 480.00, "custo_medio": 290.00},
    {"id_produto": "PROD_008", "nome": "Headset Bluetooth Noise-Cancelling", "categoria": "Áudio", "preco_tabela": 690.00, "custo_medio": 410.00},
]


def obter_conexao():
    """Gera conexão com o banco de dados PostgreSQL via variáveis de ambiente."""
    user = os.getenv("DB_USER", "dataflow_user")
    pwd = os.getenv("DB_PASSWORD", "dataflow_secret")
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    db = os.getenv("DB_NAME", "dataflow_db")
    
    url = f"postgresql://{user}:{pwd}@{host}:{port}/{db}"
    return create_engine(url)


def popular_dimensoes_semente(engine):
    """Garante que as tabelas dimensionais estejam populadas antes de carregar a fato."""
    print("[CARGA] Garantindo integridade das dimensões (Clientes, Vendedores, Produtos)...")
    with engine.begin() as conn:
        for c in CLIENTES_SEMENTE:
            conn.execute(text("""
                INSERT INTO clientes (id_cliente, nome, email, regiao, segmento)
                VALUES (:id_cliente, :nome, :email, :regiao, :segmento)
                ON CONFLICT (id_cliente) DO NOTHING;
            """), c)
            
        for v in VENDEDORES_SEMENTE:
            conn.execute(text("""
                INSERT INTO vendedores (id_vendedor, nome, email, meta_mensal)
                VALUES (:id_vendedor, :nome, :email, :meta_mensal)
                ON CONFLICT (id_vendedor) DO NOTHING;
            """), v)
            
        for p in PRODUTOS_SEMENTE:
            conn.execute(text("""
                INSERT INTO produtos (id_produto, nome, categoria, preco_tabela, custo_medio)
                VALUES (:id_produto, :nome, :categoria, :preco_tabela, :custo_medio)
                ON CONFLICT (id_produto) DO NOTHING;
            """), p)


def carregar_vendas(df_transformado: pd.DataFrame, engine=None) -> Dict[str, Any]:
    """
    Carrega o DataFrame limpo na tabela 'vendas' do PostgreSQL.
    Realiza upsert com ON CONFLICT (id_venda) DO UPDATE.
    """
    if engine is None:
        engine = obter_conexao()
        
    popular_dimensoes_semente(engine)
    
    print(f"[CARGA] Iniciando inserção de {len(df_transformado)} vendas no PostgreSQL...")
    
    linhas_inseridas = 0
    with engine.begin() as conn:
        for _, row in df_transformado.iterrows():
            dados = row.to_dict()
            conn.execute(text("""
                INSERT INTO vendas (
                    id_venda, id_cliente, id_vendedor, id_produto,
                    quantidade, preco_unitario, faturamento_total,
                    custo_total, lucro_bruto, data_venda, canal_venda,
                    status_pagamento
                )
                VALUES (
                    :id_venda, :id_cliente, :id_vendedor, :id_produto,
                    :quantidade, :preco_unitario, :faturamento_total,
                    :custo_total, :lucro_bruto, :data_venda, :canal_venda,
                    :status_pagamento
                )
                ON CONFLICT (id_venda) DO UPDATE SET
                    quantidade = EXCLUDED.quantidade,
                    preco_unitario = EXCLUDED.preco_unitario,
                    faturamento_total = EXCLUDED.faturamento_total,
                    custo_total = EXCLUDED.custo_total,
                    lucro_bruto = EXCLUDED.lucro_bruto,
                    data_venda = EXCLUDED.data_venda,
                    canal_venda = EXCLUDED.canal_venda,
                    status_pagamento = EXCLUDED.status_pagamento,
                    carregado_em = CURRENT_TIMESTAMP;
            """), dados)
            linhas_inseridas += 1

    metricas = {
        "tabela_destino": "vendas",
        "registros_carregados": linhas_inseridas,
        "estrategia_conflito": "UPSERT (ON CONFLICT id_venda)",
        "status": "CARGA_CONCLUIDA"
    }
    
    print(f"[CARGA CONCLUÍDA] Sucesso! {linhas_inseridas} registros gravados no PostgreSQL.")
    return metricas


if __name__ == "__main__":
    from extract import extrair_dados_brutos
    from transform import transformar_dados
    df_raw, _ = extrair_dados_brutos()
    df_clean, _ = transformar_dados(df_raw)
    res = carregar_vendas(df_clean)
    print("Resultado da Carga:", res)
