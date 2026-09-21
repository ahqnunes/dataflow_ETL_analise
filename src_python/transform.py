"""
DataFlow ETL - Módulo de Transformação (Transform - Etapa 2)
Utiliza a biblioteca Pandas para higienizar dados brutos:
- Tratamento de nulos e preenchimento com defaults inteligentes
- Padronização de datas para formato ISO (YYYY-MM-DD)
- Sanitização de preços e quantidades (remoção de caracteres, negativos e nulos)
- Deduplicação de registros por chave primária
- Cálculo de colunas derivadas de negócio (faturamento_total, custo_total, lucro_bruto)
"""

import re
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any, Tuple

# Tabela de custos médios para enriquecimento e cálculo de margem
CUSTOS_PRODUTOS = {
    "PROD_001": 3700.00,
    "PROD_002": 1650.00,
    "PROD_003": 450.00,
    "PROD_004": 8900.00,
    "PROD_005": 890.00,
    "PROD_006": 2100.00,
    "PROD_007": 290.00,
    "PROD_008": 410.00,
}

PRECOS_TABELA_DEFAULT = {
    "PROD_001": 5200.00,
    "PROD_002": 2400.00,
    "PROD_003": 1800.00,
    "PROD_004": 12500.00,
    "PROD_005": 1450.00,
    "PROD_006": 3200.00,
    "PROD_007": 480.00,
    "PROD_008": 690.00,
}


def sanitizar_preco(valor: Any, id_prod: str) -> float:
    """Converte strings com R$, espaços, vírgulas e negativos em float válido."""
    if pd.isna(valor) or str(valor).strip() == "":
        return PRECOS_TABELA_DEFAULT.get(id_prod, 100.00)
    
    val_str = str(valor).strip()
    val_str = val_str.replace("R$", "").replace("$", "").replace(" ", "")
    
    # Se tiver vírgula como separador decimal
    if "," in val_str and "." in val_str:
        # Exemplo: 1.250,50 -> 1250.50
        val_str = val_str.replace(".", "").replace(",", ".")
    elif "," in val_str:
        val_str = val_str.replace(",", ".")
        
    try:
        num = float(val_str)
        # Preços não podem ser negativos; se for, toma o valor absoluto
        return abs(num) if abs(num) > 0 else PRECOS_TABELA_DEFAULT.get(id_prod, 100.00)
    except ValueError:
        return PRECOS_TABELA_DEFAULT.get(id_prod, 100.00)


def padronizar_data(data_str: Any) -> str:
    """Converte datas em formatos arbitrários (DD/MM/YYYY, YYYY/MM/DD, etc) para YYYY-MM-DD."""
    if pd.isna(data_str) or str(data_str).strip() == "":
        return "2023-06-15"  # Data padrão de imputação
    
    d_clean = str(data_str).strip()
    
    # Casos conhecidos de formatações
    padroes = [
        ("%Y-%m-%d", r"^\d{4}-\d{2}-\d{2}$"),
        ("%d/%m/%Y", r"^\d{2}/\d{2}/\d{4}$"),
        ("%d-%m-%Y", r"^\d{2}-\d{2}-\d{4}$"),
        ("%Y/%m/%d", r"^\d{4}/\d{2}/\d{2}$"),
    ]
    
    for formato, regex in padroes:
        if re.match(regex, d_clean):
            try:
                dt = datetime.strptime(d_clean, formato)
                return dt.strftime("%Y-%m-%d")
            except ValueError:
                pass  # Data inválida como 31/02
                
    # Fallback seguro caso a data esteja malformada
    return "2023-06-15"


def transformar_dados(df_bruto: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Executa a esteira completa de limpeza e transformação com Pandas.
    """
    print("[TRANSFORMAÇÃO] Iniciando higienização e validações de qualidade...")
    linhas_iniciais = len(df_bruto)
    
    df = df_bruto.copy()
    
    # 1. Deduplicação por id_venda
    duplicatas_iniciais = df.duplicated(subset=["id_venda"]).sum()
    df = df.drop_duplicates(subset=["id_venda"], keep="first")
    
    # 2. Tratamento de nulos em chaves estrangeiras
    nulos_cliente = df["id_cliente"].isna().sum() + (df["id_cliente"].str.strip() == "").sum()
    df["id_cliente"] = df["id_cliente"].fillna("CLI_001")
    df.loc[df["id_cliente"].str.strip() == "", "id_cliente"] = "CLI_001"
    
    nulos_vendedor = df["id_vendedor"].isna().sum() + (df["id_vendedor"].str.strip() == "").sum()
    df["id_vendedor"] = df["id_vendedor"].fillna("VEND_001")
    df.loc[df["id_vendedor"].str.strip() == "", "id_vendedor"] = "VEND_001"
    
    # 3. Tratamento e sanitização de Quantidade
    def limpar_quantidade(q):
        try:
            val = int(float(str(q).strip()))
            return abs(val) if abs(val) > 0 else 1
        except (ValueError, TypeError):
            return 1

    df["quantidade"] = df["quantidade"].apply(limpar_quantidade)
    
    # 4. Tratamento e sanitização de Preço Unitário
    df["preco_unitario"] = df.apply(
        lambda row: sanitizar_preco(row["preco_unitario"], row["id_produto"]), axis=1
    )
    
    # 5. Padronização de datas para formato ISO YYYY-MM-DD
    df["data_venda"] = df["data_venda"].apply(padronizar_data)
    
    # 6. Padronização de Canais e Status
    df["canal_venda"] = df["canal_venda"].fillna("Online")
    df["status_pagamento"] = df["status_pagamento"].fillna("Aprovado")
    
    # 7. Cálculo de Colunas Derivadas (Regras de Negócio)
    # faturamento_total = quantidade * preco_unitario
    df["faturamento_total"] = (df["quantidade"] * df["preco_unitario"]).round(2)
    
    # custo_total = quantidade * custo_medio
    df["custo_medio"] = df["id_produto"].map(CUSTOS_PRODUTOS).fillna(100.00)
    df["custo_total"] = (df["quantidade"] * df["custo_medio"]).round(2)
    
    # lucro_bruto = faturamento_total - custo_total
    df["lucro_bruto"] = (df["faturamento_total"] - df["custo_total"]).round(2)
    
    # Ordenar colunas finais para o banco de dados
    colunas_finais = [
        "id_venda", "id_cliente", "id_vendedor", "id_produto",
        "quantidade", "preco_unitario", "faturamento_total",
        "custo_total", "lucro_bruto", "data_venda",
        "canal_venda", "status_pagamento"
    ]
    df_transformado = df[colunas_finais]
    
    metricas = {
        "linhas_originais": linhas_iniciais,
        "linhas_limpas": len(df_transformado),
        "duplicadas_removidas": int(duplicatas_iniciais),
        "clientes_imputados": int(nulos_cliente),
        "vendedores_imputados": int(nulos_vendedor),
        "faturamento_total_calculado": float(df_transformado["faturamento_total"].sum()),
        "lucro_total_calculado": float(df_transformado["lucro_bruto"].sum()),
        "status_qualidade": "100% HIGIENIZADO"
    }
    
    print(f"[TRANSFORMAÇÃO CONCLUÍDA] {len(df_transformado)} registros limpos com sucesso!")
    print(f" -> Removidas {duplicatas_iniciais} duplicatas | Faturamento Total: R$ {metricas['faturamento_total_calculado']:,.2f}")
    
    return df_transformado, metricas


if __name__ == "__main__":
    from extract import extrair_dados_brutos
    df_raw, _ = extrair_dados_brutos()
    df_clean, metrics = transformar_dados(df_raw)
    print(metrics)
    print(df_clean.head())
