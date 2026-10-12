'use client';

import React, { useState } from 'react';
import { Cliente } from '@/lib/types';
import { createCliente, updateCliente } from '@/lib/actions';
import { X, AlertCircle, Search, Loader2, MapPin } from 'lucide-react';

interface ClienteModalProps {
  clienteParaEditar?: Cliente | null;
  onClose: () => void;
  onSaved: (novoCliente?: Cliente) => void;
}

export function ClienteModal({ clienteParaEditar, onClose, onSaved }: ClienteModalProps) {
  const [loading, setLoading] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nomeEmpresa, setNomeEmpresa] = useState(clienteParaEditar?.nome_empresa || '');
  const [nomeContato, setNomeContato] = useState(clienteParaEditar?.nome_contato || '');
  const [telefone, setTelefone] = useState(clienteParaEditar?.telefone_whatsapp || '');
  
  // Endereço completo com CEP (Requisito 7)
  const [cep, setCep] = useState(clienteParaEditar?.cep || '');
  const [endereco, setEndereco] = useState(clienteParaEditar?.endereco || '');
  const [numero, setNumero] = useState(clienteParaEditar?.numero || '');
  const [bairro, setBairro] = useState(clienteParaEditar?.bairro || '');
  const [complemento, setComplemento] = useState(clienteParaEditar?.complemento || '');
  const [cidade, setCidade] = useState(clienteParaEditar?.cidade || 'Conselheiro Lafaiete');
  const [uf, setUf] = useState(clienteParaEditar?.uf || 'MG');
  const [cnpj, setCnpj] = useState(clienteParaEditar?.cnpj || '');

  // Formatação de CEP (99999-999)
  const formatarCep = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  // Formatação dinâmica de CPF (11 dígitos: 000.000.000-00) ou CNPJ (14 dígitos: 00.000.000/0000-00)
  const formatarCpfCnpj = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 11) {
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
      if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    } else {
      if (digits.length <= 12) {
        return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
      }
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
    }
  };

  // Integração automática com ViaCEP (Requisito 7)
  const consultarCep = async (cepParaBuscar: string) => {
    const clean = cepParaBuscar.replace(/\D/g, '');
    if (clean.length !== 8) return;

    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        if (data.logradouro) setEndereco(data.logradouro);
        if (data.bairro) setBairro(data.bairro);
        if (data.localidade) setCidade(data.localidade);
        if (data.uf) setUf(data.uf);

        // Foca automaticamente no campo número para agilizar
        setTimeout(() => {
          document.getElementById('cliente-numero-input')?.focus();
        }, 100);
      }
    } catch (err) {
      console.error('Erro ao buscar dados do CEP:', err);
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatado = formatarCep(e.target.value);
    setCep(formatado);
    if (formatado.replace(/\D/g, '').length === 8) {
      consultarCep(formatado);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeEmpresa.trim()) {
      setError('O Nome da Empresa é obrigatório.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (clienteParaEditar) {
        const res = await updateCliente(clienteParaEditar.id, {
          nome_empresa: nomeEmpresa,
          nome_contato: nomeContato,
          telefone_whatsapp: telefone,
          cep,
          endereco,
          numero,
          bairro,
          complemento,
          cidade,
          uf,
          cnpj,
        });
        if (!res.success) throw new Error(res.error);
        onSaved();
      } else {
        const res = await createCliente({
          nome_empresa: nomeEmpresa,
          nome_contato: nomeContato,
          telefone_whatsapp: telefone,
          cep,
          endereco,
          numero,
          bairro,
          complemento,
          cidade,
          uf,
          cnpj,
        });
        if (!res.success) throw new Error(res.error);
        onSaved({
          id: res.id!,
          nome_empresa: nomeEmpresa,
          nome_contato: nomeContato,
          telefone_whatsapp: telefone,
          cep,
          endereco,
          numero,
          bairro,
          complemento,
          cidade,
          uf,
          cnpj,
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar cliente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-2 sm:p-4 overflow-y-auto animate-modal-backdrop"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 dark:border dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            {clienteParaEditar ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-sm">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 rounded-lg text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Nome da Empresa */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
              Nome da Empresa / Razão Social <span className="text-red-600 dark:text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: PET SHOP DO TOM, PADARIA CENTRAL..."
              value={nomeEmpresa}
              onChange={(e) => setNomeEmpresa(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm dark:bg-zinc-950 dark:text-white dark:placeholder-zinc-500"
            />
          </div>

          {/* Contato e Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                Nome do Contato
              </label>
              <input
                type="text"
                placeholder="Ex: Wellington, Cristina..."
                value={nomeContato}
                onChange={(e) => setNomeContato(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm dark:bg-zinc-950 dark:text-white dark:placeholder-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                placeholder="Ex: (31) 99999-8888"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm dark:bg-zinc-950 dark:text-white dark:placeholder-zinc-500"
              />
            </div>
          </div>

          {/* Seção de Endereço com Busca Automática por CEP (Requisito 7) */}
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-600" />
                <span>Localização & Endereço</span>
              </span>
              <span className="text-[10px] text-zinc-400">Preenchimento automático via CEP</span>
            </div>

            {/* Linha do CEP com busca automática */}
            <div className="flex items-center gap-2">
              <div className="w-44">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                  CEP
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={9}
                    placeholder="00000-000"
                    value={cep}
                    onChange={handleCepChange}
                    className="w-full px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-xs font-mono font-bold dark:bg-zinc-900 dark:text-white"
                  />
                  {buscandoCep && (
                    <Loader2 className="w-3.5 h-3.5 text-red-600 animate-spin absolute right-2.5 top-2" />
                  )}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => consultarCep(cep)}
                  disabled={buscandoCep || cep.replace(/\D/g, '').length !== 8}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  title="Buscar endereço pelo CEP informado"
                >
                  <Search className="w-3 h-3" />
                  <span>Buscar CEP</span>
                </button>
              </div>
            </div>

            {/* Logradouro e Número */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                  Rua / Logradouro
                </label>
                <input
                  type="text"
                  placeholder="Ex: Av. Telésforo Cândido de Rezende"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className="w-full px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-xs dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                  Número
                </label>
                <input
                  id="cliente-numero-input"
                  type="text"
                  placeholder="Ex: 120"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="w-full px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-xs dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500 font-bold"
                />
              </div>
            </div>

            {/* Bairro e Complemento */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  placeholder="Ex: Centro, Sagrado Coração..."
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="w-full px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-xs dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                  Complemento
                </label>
                <input
                  type="text"
                  placeholder="Ex: Sala 2, Galpão A..."
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  className="w-full px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-xs dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
                />
              </div>
            </div>

            {/* Cidade e UF */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-xs dark:bg-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                  UF
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={uf}
                  onChange={(e) => setUf(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-xs text-center font-bold dark:bg-zinc-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* CNPJ ou CPF com máscara dinâmica */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                CPF ou CNPJ
              </label>
              {cnpj.replace(/\D/g, '').length === 11 && (
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
                  CPF identificado
                </span>
              )}
              {cnpj.replace(/\D/g, '').length === 14 && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                  CNPJ identificado
                </span>
              )}
            </div>
            <input
              type="text"
              maxLength={18}
              placeholder="Digite o CPF (11 dígitos) ou CNPJ (14 dígitos)"
              value={cnpj}
              onChange={(e) => setCnpj(formatarCpfCnpj(e.target.value))}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm font-mono dark:bg-zinc-950 dark:text-white dark:placeholder-zinc-500"
            />
          </div>

          {/* Botões Salvar e Cancelar */}
          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-lg shadow-lg shadow-red-900/30 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Salvando...' : 'Salvar Cliente'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
