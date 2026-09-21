"""
DataFlow ETL - Gerador de Dados Fictícios com "Sujeira" Proposital (Etapa 1)
Simula um cenário real de mercado com inconsistências cadastrais, datas mal formatadas,
valores nulos, moedas com formatos variados e dados duplicados.
"""

import os
import random
import csv
from datetime import datetime, timedelta

# Listas de apoio para geração
CLIENTES = [
    ("CLI_001", "Acme Corporation Ltda", "acme@empresa.com.br", "Sudeste", "Enterprise"),
    ("CLI_002", "Silva & Souza Consultoria", "contato@silvasouza.com", "Sul", "PME"),
    ("CLI_003", "TechNova Soluções Digitais", "financeiro@technova.io", "Nordeste", "Corporativo"),
    ("CLI_004", "Varejo Brasil Supermercados", "compras@varejobrasil.com.br", "Sudeste", "Enterprise"),
    ("CLI_005", "AgroForte Distribuidora", "agro@agroforte.com", "Centro-Oeste", "Corporativo"),
    ("CLI_006", "BioSaúde Farmacêutica", "compras@biosaude.med.br", "Sudeste", "Enterprise"),
    ("CLI_007", "Café do Ponto & Cia", "pedidos@cafedoponto.com", "Sul", "Varejo"),
    ("CLI_008", "EletroMundo Eletrônicos", "gerencia@eletromundo.com.br", "Nordeste", "Varejo"),
    ("CLI_009", "Amazonia Madeiras & Móveis", "contato@amazoniamoveis.com", "Norte", "PME"),
    ("CLI_010", "Minas Aço Engenharia", "suprimentos@minasaco.com.br", "Sudeste", "Corporativo"),
]

VENDEDORES = [
    ("VEND_001", "Mariana Costa", "mariana.costa@empresa.com", 65000.00),
    ("VEND_002", "Lucas Ribeiro", "lucas.ribeiro@empresa.com", 55000.00),
    ("VEND_003", "Camila Albuquerque", "camila.albuquerque@empresa.com", 70000.00),
    ("VEND_004", "Rodrigo Nogueira", "rodrigo.nogueira@empresa.com", 45000.00),
    ("VEND_005", "Beatriz Santos", "beatriz.santos@empresa.com", 60000.00),
]

PRODUTOS = [
    ("PROD_001", "Notebook Corporativo Dell Latitude", "Informática", 5200.00, 3700.00),
    ("PROD_002", "Monitor Ultrawide 34 LG IPS", "Periféricos", 2400.00, 1650.00),
    ("PROD_003", "Licença Cloud Anual Pro", "Software", 1800.00, 450.00),
    ("PROD_004", "Servidor Rack 1U Xeon", "Infraestrutura", 12500.00, 8900.00),
    ("PROD_005", "Cadeira Ergonômica Pro Executive", "Mobiliário", 1450.00, 890.00),
    ("PROD_006", "Switch Gerenciável 24 Portas PoE", "Redes", 3200.00, 2100.00),
    ("PROD_007", "Teclado Mecânico Wireless", "Periféricos", 480.00, 290.00),
    ("PROD_008", "Headset Bluetooth Noise-Cancelling", "Áudio", 690.00, 410.00),
]

CANAIS = ["Online", "Presencial", "Parceiro", "Televendas"]


def gerar_data_suja(data_base: datetime) -> str:
    """Gera datas em formatos variados ou intencionalmente corrompidas."""
    tipo = random.random()
    if tipo < 0.40:
        return data_base.strftime("%Y-%m-%d")  # Padrão ISO
    elif tipo < 0.65:
        return data_base.strftime("%d/%m/%Y")  # Padrão Brasileiro
    elif tipo < 0.80:
        return data_base.strftime("%d-%m-%Y")  # Com hífen invertido
    elif tipo < 0.90:
        return data_base.strftime("%Y/%m/%d")  # Com barra e ano primeiro
    elif tipo < 0.96:
        return ""  # Data nula proposital
    else:
        return "2023/31/02"  # Data inválida proposital (fevereiro com dia 31)


def gerar_preco_sujo(preco_original: float) -> str:
    """Gera strings de preço sujas com símbolos monetários, espaços ou vírgula decimal."""
    tipo = random.random()
    if tipo < 0.35:
        return f"{preco_original:.2f}"
    elif tipo < 0.60:
        return f"R$ {preco_original:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    elif tipo < 0.80:
        return f"  {preco_original:.2f}  "  # Com espaços extras
    elif tipo < 0.92:
        return str(preco_original).replace(".", ",")  # Vírgula no lugar de ponto
    elif tipo < 0.97:
        return ""  # Valor nulo proposital
    else:
        return f"-{preco_original:.2f}"  # Preço negativo proposital


def gerar_dados_brutos(qtd_registros: int = 250, output_path: str = "data/raw/vendas_brutas.csv"):
    """Gera um arquivo CSV simulando dados brutos extraídos de sistemas legados."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    data_inicio = datetime(2023, 1, 1)
    linhas = []

    print(f"[GERADOR] Iniciando simulação de {qtd_registros} vendas com sujeira proposital...")

    for i in range(1, qtd_registros + 1):
        cli = random.choice(CLIENTES)
        vend = random.choice(VENDEDORES)
        prod = random.choice(PRODUTOS)
        
        dias_aleatorios = random.randint(0, 360)
        data_base = data_inicio + timedelta(days=dias_aleatorios)
        
        # Inserção de ruídos controlados
        id_venda = f"VND-{i:05d}"
        id_cliente = cli[0] if random.random() > 0.04 else ""  # 4% de clientes nulos
        id_vendedor = vend[0] if random.random() > 0.03 else "" # 3% de vendedores nulos
        id_produto = prod[0]
        
        quantidade = random.randint(1, 15)
        if random.random() < 0.03:
            quantidade = -quantidade  # Quantidade negativa proposital
        elif random.random() < 0.02:
            quantidade = ""  # Quantidade nula proposital

        preco_unitario = gerar_preco_sujo(prod[3])
        data_venda = gerar_data_suja(data_base)
        canal = random.choice(CANAIS)
        status = random.choices(["Aprovado", "Pendente", "Cancelado"], weights=[88, 8, 4])[0]

        linhas.append({
            "id_venda": id_venda,
            "id_cliente": id_cliente,
            "id_vendedor": id_vendedor,
            "id_produto": id_produto,
            "nome_produto_legado": prod[1],
            "quantidade": str(quantidade),
            "preco_unitario": preco_unitario,
            "data_venda": data_venda,
            "canal_venda": canal,
            "status_pagamento": status,
        })

    # Adicionar 5% de duplicatas para testar deduplicação no ETL
    qtd_duplicatas = int(qtd_registros * 0.05)
    for _ in range(qtd_duplicatas):
        linhas.append(random.choice(linhas).copy())

    random.shuffle(linhas)

    fieldnames = [
        "id_venda", "id_cliente", "id_vendedor", "id_produto",
        "nome_produto_legado", "quantidade", "preco_unitario",
        "data_venda", "canal_venda", "status_pagamento"
    ]

    with open(output_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(linhas)

    print(f"[GERADOR] Sucesso! {len(linhas)} linhas geradas em '{output_path}'.")
    return output_path


if __name__ == "__main__":
    gerar_dados_brutos()
