'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Cliente, Pedido, ClienteAnexo } from '@/lib/types';
import { getClienteAnexos, uploadClienteAnexo, deleteClienteAnexo } from '@/lib/actions';
import { WhatsAppIcon } from './WhatsAppIcon';
import { 
  Building2, 
  User, 
  Phone, 
  MapPin, 
  Edit, 
  X, 
  Calendar, 
  FileText, 
  Receipt,
  ExternalLink,
  ChevronRight,
  Paperclip,
  Upload,
  Download,
  Trash2,
  File,
  FileSpreadsheet,
  Image as ImageIcon,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface ClienteDetalhesModalProps {
  cliente: Cliente | null;
  pedidos?: Pedido[];
  zIndexClass?: string;
  onClose: () => void;
  onEditarCliente: (cliente: Cliente) => void;
  onVerPedido?: (pedido: Pedido) => void;
}

export function ClienteDetalhesModal({
  cliente,
  pedidos = [],
  zIndexClass = 'z-[60]',
  onClose,
  onEditarCliente,
  onVerPedido,
}: ClienteDetalhesModalProps) {
  const [anexos, setAnexos] = useState<ClienteAnexo[]>([]);
  const [carregandoAnexos, setCarregandoAnexos] = useState(false);
  const [enviandoAnexo, setEnviandoAnexo] = useState(false);
  const [erroAnexo, setErroAnexo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cliente?.id) {
      setCarregandoAnexos(true);
      setErroAnexo(null);
      getClienteAnexos(cliente.id)
        .then((data) => setAnexos(data))
        .catch((err) => console.error('Erro ao buscar anexos:', err))
        .finally(() => setCarregandoAnexos(false));
    }
  }, [cliente?.id]);

  if (!cliente) return null;

  // Filtrar pedidos desse cliente
  const pedidosDoCliente = pedidos.filter(
    (p) => p.cliente_id === cliente.id || (p.legacy_id && p.legacy_id === cliente.legacy_id)
  );

  const totalGasto = pedidosDoCliente.reduce((acc, p) => acc + Number(p.valor_total || 0), 0);

  const formatBytes = (bytes?: number | null) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleUploadArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !cliente?.id) return;

    setEnviandoAnexo(true);
    setErroAnexo(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Limite de 5MB por arquivo
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`O arquivo "${file.name}" excede o tamanho máximo permitido de 5MB.`);
        }

        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await uploadClienteAnexo({
          cliente_id: cliente.id,
          nome_arquivo: file.name,
          tipo_arquivo: file.type || 'application/octet-stream',
          tamanho_bytes: file.size,
          conteudo_base64: base64,
        });

        if (!res.success) {
          throw new Error(res.error || `Erro ao anexar "${file.name}"`);
        }

        if (res.anexo) {
          setAnexos((prev) => [res.anexo!, ...prev]);
        }
      }
    } catch (err: any) {
      console.error('Erro no upload de anexo:', err);
      setErroAnexo(err?.message || 'Erro ao realizar upload do arquivo.');
    } finally {
      setEnviandoAnexo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleBaixarAnexo = (anexo: ClienteAnexo) => {
    if (!anexo.conteudo_base64) {
      alert('Arquivo não disponível para visualização.');
      return;
    }

    const a = document.createElement('a');
    a.href = anexo.conteudo_base64;
    a.download = anexo.nome_arquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExcluirAnexo = async (anexo: ClienteAnexo) => {
    if (!confirm(`Deseja realmente excluir o anexo "${anexo.nome_arquivo}"?`)) return;

    try {
      const res = await deleteClienteAnexo(anexo.id, cliente.id);
      if (!res.success) {
        alert(res.error || 'Erro ao excluir anexo.');
        return;
      }
      setAnexos((prev) => prev.filter((a) => a.id !== anexo.id));
    } catch (err) {
      console.error('Erro ao excluir anexo:', err);
      alert('Erro ao excluir anexo.');
    }
  };

  const getFileIcon = (nome: string, tipo?: string | null) => {
    const ext = nome.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || tipo?.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />;
    }
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext || '') || tipo?.includes('image')) {
      return <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext || '') || tipo?.includes('sheet')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    }
    return <File className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />;
  };

  const getWhatsAppUrl = () => {
    if (!cliente.telefone_whatsapp) return '#';
    const cleanPhone = cliente.telefone_whatsapp.replace(/\D/g, '');
    const phone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(`Olá ${cliente.nome_contato || cliente.nome_empresa}, tudo bem?`)}`;
  };

  const getMapsUrl = () => {
    const enderecoCompleto = [
      cliente.endereco,
      cliente.numero ? `nº ${cliente.numero}` : null,
      cliente.bairro,
    ].filter(Boolean).join(', ');
    const query = [enderecoCompleto, cliente.cidade, cliente.uf, cliente.cep, 'Brasil'].filter(Boolean).join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || cliente.nome_empresa)}`;
  };

  const formatMoeda = (val: number) => {
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Orçamento':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/80';
      case 'Aprovado':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80';
      case 'Pago':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
    }
  };

  return (
    <div 
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-black/60 p-2 sm:p-4 overflow-y-auto animate-modal-backdrop`}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl bg-white dark:bg-[#18181c] text-zinc-900 dark:text-zinc-100 rounded-2xl shadow-2xl border border-transparent dark:border-zinc-700 overflow-hidden flex flex-col max-h-[95vh] animate-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Barra superior de controle */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#121214]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 dark:border dark:border-red-800/80 text-red-700 dark:text-red-400 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-zinc-900 dark:text-white leading-tight">
                {cliente.nome_empresa}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Cadastro de Cliente
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão Editar Cliente */}
            <button
              onClick={() => onEditarCliente(cliente)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-2xs transition cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Editar</span>
            </button>

            {/* Botão WhatsApp Contorno Verde Oficial */}
            {cliente.telefone_whatsapp && (
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                title="Conversar no WhatsApp"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-950 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-2 border-emerald-500 rounded-full shadow-2xs transition cursor-pointer"
              >
                <WhatsAppIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>WhatsApp</span>
              </a>
            )}

            {/* Fechar */}
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo do Modal */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm">
          
          {/* Grid com Informações do Cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Bloco 1: Dados Cadastrais */}
            <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Informações de Contato
                </span>
                {cliente.cnpj && (
                  <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                    CNPJ: {cliente.cnpj}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">Nome / Razão Social:</span>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{cliente.nome_empresa}</p>
                </div>

                {cliente.nome_contato && (
                  <div>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">Responsável:</span>
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 mt-0.5">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      {cliente.nome_contato}
                    </p>
                  </div>
                )}

                {cliente.telefone_whatsapp && (
                  <div>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">Telefone / WhatsApp:</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <a 
                        href={`tel:${cliente.telefone_whatsapp.replace(/\D/g, '')}`}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {cliente.telefone_whatsapp}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bloco 2: Localização e Endereço */}
            <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Endereço & Localização
                </span>
                <a
                  href={getMapsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Google Maps</span>
                </a>
              </div>

              <div className="space-y-2">
                {cliente.cep && (
                  <div>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">CEP:</span>
                    <p className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">
                      {cliente.cep}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">Logradouro / Número:</span>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {cliente.endereco || 'Endereço não informado'}
                    {cliente.numero ? `, nº ${cliente.numero}` : ''}
                    {cliente.complemento ? ` (${cliente.complemento})` : ''}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">Bairro:</span>
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {cliente.bairro || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">Cidade / UF:</span>
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {cliente.cidade || 'Conselheiro Lafaiete'} / {cliente.uf || 'MG'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Resumo Financeiro / Histórico de Pedidos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Histórico de Pedidos ({pedidosDoCliente.length})
                </h4>
              </div>
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-950 dark:border dark:border-zinc-800 px-2.5 py-1 rounded-full">
                Total Faturado: <strong className="text-red-700 dark:text-red-400">{formatMoeda(totalGasto)}</strong>
              </span>
            </div>

            {pedidosDoCliente.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                Nenhum pedido registrado para este cliente até o momento.
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden shadow-2xs">
                {pedidosDoCliente.map((ped) => (
                  <div
                    key={ped.id}
                    onClick={() => onVerPedido && onVerPedido(ped)}
                    className="p-3.5 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60 transition flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-red-700 dark:text-red-400 group-hover:underline">
                            #{ped.numero_pedido}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(ped.status)}`}>
                            {ped.status}
                          </span>
                        </div>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" /> {formatDate(ped.data_pedido)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-black text-sm text-zinc-900 dark:text-white">
                        {formatMoeda(ped.valor_total)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seção de Anexos & Documentos do Cliente */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Anexos & Documentos ({anexos.length})
                </h4>
              </div>

              {/* Input escondido e Botão de Upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleUploadArquivo}
                  className="hidden"
                  id="cliente-file-upload-input"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={enviandoAnexo}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {enviandoAnexo ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>+ Anexar Arquivo</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Aviso de erro se houver */}
            {erroAnexo && (
              <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{erroAnexo}</span>
              </div>
            )}

            {/* Lista ou Estado Vazio de Anexos */}
            {carregandoAnexos ? (
              <div className="p-6 text-center text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                <span>Carregando anexos do cliente...</span>
              </div>
            ) : anexos.length === 0 ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="p-6 text-center bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/40 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 cursor-pointer transition group"
              >
                <Upload className="w-6 h-6 text-zinc-400 group-hover:text-red-500 mx-auto mb-1.5 transition" />
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  Nenhum anexo registrado para este cliente até o momento.
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Clique aqui ou no botão acima para anexar laudos técnicos, fotos de extintores, notas ou documentos (máx. 5 MB por arquivo).
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden shadow-2xs">
                {anexos.map((anexo) => (
                  <div
                    key={anexo.id}
                    className="p-3 sm:p-3.5 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60 transition flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 shrink-0 border border-zinc-200/80 dark:border-zinc-800">
                        {getFileIcon(anexo.nome_arquivo, anexo.tipo_arquivo)}
                      </div>
                      <div className="overflow-hidden">
                        <p 
                          className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate cursor-pointer hover:text-red-600 dark:hover:text-red-400 transition"
                          title={anexo.nome_arquivo}
                          onClick={() => handleBaixarAnexo(anexo)}
                        >
                          {anexo.nome_arquivo}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                          <span className="font-mono">{formatBytes(anexo.tamanho_bytes)}</span>
                          <span>•</span>
                          <span>{anexo.created_at ? formatDate(anexo.created_at.split('T')[0]) : ''}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleBaixarAnexo(anexo)}
                        title="Baixar ou visualizar anexo"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                        <span className="hidden sm:inline">Baixar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExcluirAnexo(anexo)}
                        title="Excluir anexo"
                        className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Rodapé com botões de ação */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <button
            onClick={() => onEditarCliente(cliente)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-2xs transition cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Editar Cadastro</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-lg transition cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
