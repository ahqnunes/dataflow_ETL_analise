"""
DataFlow ETL - Orquestrador Principal do Pipeline (Etapa 4)
Script mestre que automatiza e orquestra o ciclo completo de ponta a ponta:
1. Geração de dados simulados com sujeira proposital (generator.py)
2. Extração de arquivos brutos (extract.py)
3. Transformação, limpeza e derivação de colunas com Pandas (transform.py)
4. Carga segura no PostgreSQL com integridade referencial (load.py)
5. Execução de queries analíticas e geração de relatórios executivos (report.py)
"""

import sys
import time
import argparse
from datetime import datetime

from generator import gerar_dados_brutos
from extract import extrair_dados_brutos
from transform import transformar_dados
from load import carregar_vendas
from report import gerar_relatorio_executivo


def imprimir_banner():
    banner = r"""
================================================================================
  ____        _        _____ _                 ______ _____ _      
 |  _ \      | |      |  ___| |               |  ____|_   _| |     
 | | | | __ _| |_ __ _| |_  | | _____      __ | |__    | | | |     
 | | | |/ _` | __/ _` |  _| | |/ _ \ \ /\ / / |  __|   | | | |     
 | |_| | (_| | || (_| | |   | | (_) \ V  V /  | |____ _| |_| |____ 
 |____/ \__,_|\__\__,_\_|   |_|\___/ \_/\_/   |______|_____|______|
                                                                   
 Pipeline de Engenharia de Dados & Analytics de Ponta a Ponta
================================================================================
    """
    print(banner)


def executar_pipeline_completo(qtd_registros: int = 300, pular_geracao: bool = False):
    inicio_tempo = time.time()
    imprimir_banner()
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Iniciando ciclo orquestrado do DataFlow ETL...\n")

    try:
        # FASE 1: GERAÇÃO DE DADOS BRUTOS (SE NECESSÁRIO)
        if not pular_geracao:
            print(">>> [FASE 1/5] Gerando arquivo bruto com sujeira controlada...")
            caminho_csv = gerar_dados_brutos(qtd_registros=qtd_registros)
            print(f" -> Arquivo gerado em: {caminho_csv}\n")
        else:
            print(">>> [FASE 1/5] Pulando geração; utilizando arquivos existentes em data/raw/...\n")

        # FASE 2: EXTRAÇÃO
        print(">>> [FASE 2/5] Executando rotina de Extração (Extract)...")
        df_bruto, metricas_extracao = extrair_dados_brutos()
        print(f" -> Arquivos processados: {metricas_extracao['arquivos_processados']}")
        print(f" -> Total de registros brutos lidos: {metricas_extracao['total_linhas_brutas']}\n")

        # FASE 3: TRANSFORMAÇÃO & DATA QUALITY
        print(">>> [FASE 3/5] Executando higienização e derivações (Transform)...")
        df_limpo, metricas_transformacao = transformar_dados(df_bruto)
        print(f" -> Duplicatas eliminadas: {metricas_transformacao['duplicadas_removidas']}")
        print(f" -> Registros finais higienizados: {metricas_transformacao['linhas_limpas']}")
        print(f" -> Faturamento total calculado: R$ {metricas_transformacao['faturamento_total_calculado']:,.2f}\n")

        # FASE 4: CARGA NO BANCO DE DADOS
        print(">>> [FASE 4/5] Conectando ao PostgreSQL e carregando Fato Vendas (Load)...")
        metricas_carga = carregar_vendas(df_limpo)
        print(f" -> Tabela destino: {metricas_carga['tabela_destino']}")
        print(f" -> Registros inseridos/atualizados: {metricas_carga['registros_carregados']}\n")

        # FASE 5: ANALYTICS & RELATÓRIOS
        print(">>> [FASE 5/5] Executando consultas analíticas e gerando relatórios executivos...")
        relatorio = gerar_relatorio_executivo()
        kpis = relatorio["kpis_principais"]
        print(f" -> Faturamento Consolidado: R$ {kpis['faturamento_total']:,.2f}")
        print(f" -> Lucro Bruto Total: R$ {kpis['lucro_total']:,.2f}")
        print(f" -> Margem Bruta: {kpis['margem_bruta_pct']:.2f}%")
        print(f" -> Ticket Médio: R$ {kpis['ticket_medio_geral']:,.2f}\n")

        tempo_total = time.time() - inicio_tempo
        print("================================================================================")
        print(f" PIPELINE EXECUTADO COM SUCESSO EM {tempo_total:.2f} SEGUNDOS!")
        print(" Relatórios gerados em: 'data/reports/relatorio_comercial.md' e '.json'")
        print("================================================================================")

    except Exception as e:
        print(f"\n[ERRO CRÍTICO NO PIPELINE] Falha durante a execução: {str(e)}", file=sys.stderr)
        raise e


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Orquestrador do Pipeline DataFlow ETL")
    parser.add_argument("--full-run", action="store_true", help="Executa o pipeline completo de ponta a ponta")
    parser.add_argument("--skip-generate", action="store_true", help="Pula a geração de novos arquivos brutos")
    parser.add_argument("--records", type=int, default=300, help="Quantidade de registros a simular")
    
    args = parser.parse_args()
    executar_pipeline_completo(qtd_registros=args.records, pular_geracao=args.skip_generate)
