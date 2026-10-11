'use client';

import React, { useState } from 'react';
import { Cliente } from '@/lib/types';
import { createCliente, updateCliente } from '@/lib/actions';
import { X, AlertCircle } from 'lucide-react';

interface ClienteModalProps {
  clienteParaEditar?: Cliente | null;
  onClose: () => void;
  onSaved: (novoCliente?: Cliente) => void;
}

export function ClienteModal({ clienteParaEditar, onClose, onSaved }: ClienteModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nomeEmpresa, setNomeEmpresa] = useState(clienteParaEditar?.nome_empresa || '');
  const [nomeContato, setNomeContato] = useState(clienteParaEditar?.nome_contato || '');
  const [telefone, setTelefone] = useState(clienteParaEditar?.telefone_whatsapp || '');
  const [endereco, setEndereco] = useState(clienteParaEditar?.endereco || '');
  const [cidade, setCidade] = useState(clienteParaEditar?.cidade || 'Conselheiro Lafaiete');
  const [uf, setUf] = useState(clienteParaEditar?.uf || 'MG');
  const [cnpj, setCnpj] = useState(clienteParaEditar?.cnpj || '');

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
          endereco,
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
          endereco,
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
          endereco,
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

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
              Nome da Empresa <span className="text-red-600 dark:text-red-400">*</span>
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
                Telefone WhatsApp
              </label>
              <input
                type="text"
                placeholder="Ex: 31999998888"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm dark:bg-zinc-950 dark:text-white dark:placeholder-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
              Endereço
            </label>
            <input
              type="text"
              placeholder="Rua, número, bairro..."
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm dark:bg-zinc-950 dark:text-white dark:placeholder-zinc-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                Cidade
              </label>
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm dark:bg-zinc-950 dark:text-white dark:placeholder-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                UF
              </label>
              <input
                type="text"
                maxLength={2}
                value={uf}
                onChange={(e) => setUf(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm text-center font-bold dark:bg-zinc-950 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
              CNPJ ou CPF
            </label>
            <input
              type="text"
              placeholder="00.000.000/0001-00"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm dark:bg-zinc-950 dark:text-white dark:placeholder-zinc-500"
            />
          </div>

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
