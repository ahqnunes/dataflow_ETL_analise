import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  X,
  ArrowRight,
  FileText
} from 'lucide-react';
import { RawSaleRecord } from '../types/pipeline';
import { parseUploadedCsv } from '../services/pipelineSimulator';

interface CsvUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (records: RawSaleRecord[]) => void;
}

export const CsvUploaderModal: React.FC<CsvUploaderModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<RawSaleRecord[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setErrorMsg('Por favor, selecione um arquivo no formato .csv.');
      return;
    }
    setErrorMsg('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const records = parseUploadedCsv(text);
      if (records.length === 0) {
        setErrorMsg('O arquivo CSV parece estar vazio ou com cabeçalho inválido.');
        return;
      }
      setParsedPreview(records);
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    const templateContent = `id_venda,id_cliente,id_vendedor,id_produto,quantidade,preco_unitario,data_venda,canal_venda,status_pagamento
VEN_CUSTOM_01,CLI_001,VEND_001,PROD_001,3,R$ 5.200,00,2023-04-12,Online,Aprovado
VEN_CUSTOM_02,CLI_002,VEND_002,PROD_002,5,  2400.00  ,12/05/2023,Presencial,Aprovado
VEN_CUSTOM_03,,VEND_003,PROD_003,2,1800,2023-06-19,Televendas,Aprovado
VEN_CUSTOM_04,CLI_004,VEND_004,PROD_004,-1,12500,2023/31/02,Online,Cancelado
VEN_CUSTOM_05,CLI_005,VEND_005,PROD_005,4,1450,2023-07-22,Parceiro,Aprovado`;

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_vendas_dataflow.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirm = () => {
    if (parsedPreview.length > 0) {
      onUploadSuccess(parsedPreview);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-cyan-400" />
            Upload de CSV Personalizado de Vendas
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Envie sua própria planilha bruta com colunas de vendas para que o pipeline Pandas & PostgreSQL faça a limpeza, cálculo de métricas e gráficos.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-cyan-400 bg-cyan-950/20'
              : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 rounded-full bg-cyan-950/60 border border-cyan-800 text-cyan-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-200">
              {fileName ? fileName : 'Arraste seu arquivo CSV aqui ou clique para selecionar'}
            </div>
            <p className="text-xs text-slate-500">
              Suporta formato padrão CSV delimitado por vírgula com ou sem ruídos.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-900 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Preview of parsed rows */}
        {parsedPreview.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {parsedPreview.length} registros identificados com sucesso
              </span>
              <span>Prévia dos primeiros registros:</span>
            </div>

            <div className="max-h-36 overflow-auto border border-slate-800 rounded-lg bg-slate-900 text-[11px] font-mono">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950 text-slate-400 sticky top-0">
                  <tr>
                    <th className="p-2">ID Venda</th>
                    <th className="p-2">Cliente</th>
                    <th className="p-2">Qtd</th>
                    <th className="p-2">Preço Unit.</th>
                    <th className="p-2">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {parsedPreview.slice(0, 5).map((r, i) => (
                    <tr key={i}>
                      <td className="p-2 text-slate-300">{r.id_venda}</td>
                      <td className="p-2 text-slate-300">{r.id_cliente || 'NULL'}</td>
                      <td className="p-2 text-slate-300">{r.quantidade}</td>
                      <td className="p-2 text-slate-300">{r.preco_unitario}</td>
                      <td className="p-2 text-slate-300">{r.data_venda}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-900">
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-all font-mono"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" /> Baixar Modelo CSV de Teste
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-900 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={parsedPreview.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              Processar no Pipeline
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
