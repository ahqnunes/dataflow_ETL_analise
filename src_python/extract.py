"""
DataFlow ETL - Módulo de Extração (Extract - Etapa 2)
Responsável por escanear o diretório de entrada (data/raw/), validar arquivos,
extrair dados brutos e retornar um DataFrame inicial com metadados de ingestão.
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
    """
    Localiza e extrai os arquivos brutos CSV da pasta especificada.
    
    Retorna:
        Tuple[pd.DataFrame, Dict[str, Any]]: DataFrame com dados brutos concatenados
        e dicionário contendo métricas da extração.
    """
    padrao_arquivos = os.path.join(diretorio_raw, "*.csv")
    arquivos_encontrados = glob.glob(padrao_arquivos)

    if not arquivos_encontrados:
        raise FileNotFoundError(
            f"[EXTRAÇÃO ERRO] Nenhum arquivo CSV encontrado em '{diretorio_raw}'. "
            "Execute primeiramente o script 'generator.py'."
        )

    print(f"[EXTRAÇÃO] Encontrados {len(arquivos_encontrados)} arquivo(s) bruto(s) em '{diretorio_raw}'.")
    
    dfs = []
    total_linhas_lidas = 0

    for arq in arquivos_encontrados:
        print(f" -> Lendo arquivo: {os.path.basename(arq)}...")
        df_temp = pd.read_csv(arq, dtype=str)  # Lê como string para preservar a 'sujeira'
        
        # Validação simples de schema mínimo
        colunas_faltantes = set(COLUNAS_ESPERADAS) - set(df_temp.columns)
        if colunas_faltantes:
            print(f" [AVISO] Colunas ausentes no arquivo {arq}: {colunas_faltantes}")
            
        dfs.append(df_temp)
        total_linhas_lidas += len(df_temp)

    df_completo = pd.concat(dfs, ignore_index=True)
    
    metricas = {
        "arquivos_processados": len(arquivos_encontrados),
        "total_linhas_brutas": total_linhas_lidas,
        "colunas_identificadas": list(df_completo.columns),
        "status": "SUCESSO"
    }

    print(f"[EXTRAÇÃO CONCLUÍDA] Total de {total_linhas_lidas} linhas carregadas na memória com sucesso.")
    return df_completo, metricas


if __name__ == "__main__":
    df, stats = extrair_dados_brutos()
    print("Métricas de Extração:", stats)
    print(df.head())
