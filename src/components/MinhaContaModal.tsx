'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Usuario } from '@/lib/types';
import { updateUsuarioPerfil } from '@/lib/actions';
import {
  X,
  User,
  Mail,
  Lock,
  Camera,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  KeyRound,
} from 'lucide-react';

interface MinhaContaModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: Usuario;
  onUsuarioAtualizado: (novoUsuario: Usuario) => void;
}

export default function MinhaContaModal({
  isOpen,
  onClose,
  usuario,
  onUsuarioAtualizado,
}: MinhaContaModalProps) {
  const [nome, setNome] = useState(usuario.nome || '');
  const [email, setEmail] = useState(usuario.email || '');
  const [fotoUrl, setFotoUrl] = useState<string | null>(usuario.foto_url || null);
  
  const [alterarSenha, setAlterarSenha] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNome(usuario.nome || '');
      setEmail(usuario.email || '');
      setFotoUrl(usuario.foto_url || null);
      setAlterarSenha(false);
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmaSenha('');
      setErro(null);
      setSucesso(false);
    }
  }, [isOpen, usuario]);

  if (!isOpen) return null;

  // Processa upload de imagem e comprime via Canvas para base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErro('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar para no máximo 300x300 mantendo proporção
        const canvas = document.createElement('canvas');
        const maxDim = 300;
        let w = img.width;
        let h = img.height;

        if (w > h) {
          if (w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          }
        } else {
          if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setFotoUrl(dataUrl);
          setErro(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoverFoto = () => {
    setFotoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(false);

    if (!nome.trim()) {
      setErro('O nome não pode estar em branco.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErro('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (alterarSenha) {
      if (!senhaAtual) {
        setErro('Informe sua senha atual para autorizar a alteração.');
        return;
      }
      if (novaSenha.length < 6) {
        setErro('A nova senha deve ter no mínimo 6 caracteres.');
        return;
      }
      if (novaSenha !== confirmaSenha) {
        setErro('A confirmação da nova senha não confere.');
        return;
      }
    }

    setSalvando(true);
    try {
      const res = await updateUsuarioPerfil(usuario.id, {
        nome: nome.trim(),
        email: email.trim(),
        foto_url: fotoUrl,
        senhaAtual: alterarSenha ? senhaAtual : undefined,
        novaSenha: alterarSenha ? novaSenha : undefined,
      });

      if (!res.success || !res.usuario) {
        setErro(res.error || 'Erro ao atualizar perfil.');
        setSalvando(false);
        return;
      }

      onUsuarioAtualizado(res.usuario);
      setSucesso(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErro(err?.message || 'Erro inesperado ao salvar perfil.');
    } finally {
      setSalvando(false);
    }
  };

  // Fechar com tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const iniciais = (nome || usuario.nome || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white dark:bg-[#18181c] rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[92vh]"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#141418]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-transparent dark:border-red-900/60">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Minha Conta</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Gerencie seus dados pessoais, foto e segurança</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSalvar} className="p-6 overflow-y-auto space-y-6 flex-1">
          {erro && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
              <span>{erro}</span>
            </div>
          )}

          {sucesso && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
              <span>Perfil atualizado com sucesso! Fechando...</span>
            </div>
          )}

          {/* Foto de Perfil */}
          <div className="flex flex-col items-center sm:flex-row sm:items-center gap-5 p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80">
            <div className="relative group shrink-0">
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt={nome}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-white dark:ring-zinc-700 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white font-bold text-2xl flex items-center justify-center ring-4 ring-white dark:ring-zinc-700 shadow-md">
                  {iniciais}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-slate-900 dark:bg-zinc-700 text-white shadow hover:bg-red-600 transition-colors cursor-pointer"
                title="Alterar foto"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Foto de Perfil</p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">JPG, PNG ou WEBP. A foto será ajustada automaticamente.</p>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  Selecionar foto
                </button>
                {fotoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoverFoto}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remover
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Dados Pessoais */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Nome Completo *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                E-mail de Acesso *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@empresa.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                />
              </div>
            </div>
          </div>

          {/* Alteração de Senha */}
          <div className="border-t border-slate-200 dark:border-zinc-800 pt-4">
            <button
              type="button"
              onClick={() => {
                setAlterarSenha(!alterarSenha);
                setSenhaAtual('');
                setNovaSenha('');
                setConfirmaSenha('');
              }}
              className="w-full flex items-center justify-between py-2 text-left text-sm font-semibold text-slate-800 dark:text-zinc-200 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                Alterar Senha de Acesso
              </span>
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                {alterarSenha ? 'Cancelar alteração' : 'Mudar senha'}
              </span>
            </button>

            {alterarSenha && (
              <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 space-y-3.5 animate-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Senha Atual *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                      placeholder="Digite sua senha atual"
                      className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Nova Senha *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        placeholder="Mínimo 6 dígitos"
                        className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Confirmar Nova Senha *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={confirmaSenha}
                        onChange={(e) => setConfirmaSenha(e.target.value)}
                        placeholder="Repita a nova senha"
                        className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-md shadow-red-600/20 transition-all disabled:opacity-50"
            >
              {salvando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Salvar Alterações</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
