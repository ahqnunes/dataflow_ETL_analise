-- ==============================================================================
-- PROJETO DATAFLOW ETL: ESQUEMA RELACIONAL (POSTGRESQL 15+)
-- Etapa 1: Modelagem Relacional e Integridade Referencial
-- ==============================================================================

-- Habilita extensão para UUIDs caso necessário
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

-- Índices Estratégicos para Consultas Analíticas (Etapa 3)
CREATE INDEX IF NOT EXISTS idx_vendas_data ON vendas (data_venda);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente ON vendas (id_cliente);
CREATE INDEX IF NOT EXISTS idx_vendas_produto ON vendas (id_produto);
CREATE INDEX IF NOT EXISTS idx_vendas_vendedor ON vendas (id_vendedor);
CREATE INDEX IF NOT EXISTS idx_vendas_status_data ON vendas (status_pagamento, data_venda);

-- Comentários na estrutura do banco
COMMENT ON TABLE clientes IS 'Dimensão de clientes com segmentação regional e comercial';
COMMENT ON TABLE vendedores IS 'Dimensão de vendedores com controle de meta mensal';
COMMENT ON TABLE produtos IS 'Catálogo de produtos com precificação e custo unitário';
COMMENT ON TABLE vendas IS 'Tabela fato contendo todas as transações consolidadas e validadas pelo pipeline ETL';
