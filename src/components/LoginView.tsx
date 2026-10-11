'use client';

import React, { useState } from 'react';
import { Usuario } from '@/lib/types';
import { loginUsuario } from '@/lib/actions';
import { Flame, Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onLoginSucesso: (usuario: Usuario) => void;
}

export function LoginView({ onLoginSucesso }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(true);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!email.trim() || !senha.trim()) {
      setErro('Por favor, preencha o e-mail e a senha.');
      return;
    }

    try {
      setCarregando(true);
      const res = await loginUsuario(email, senha);

      if (!res.success || !res.usuario) {
        setErro(res.error || 'Credenciais inválidas. Verifique os dados informados.');
        return;
      }

      // Salva sessão localmente se lembrar estiver ativo
      if (typeof window !== 'undefined') {
        if (lembrar) {
          localStorage.setItem('usuario_extintores', JSON.stringify(res.usuario));
        } else {
          sessionStorage.setItem('usuario_extintores', JSON.stringify(res.usuario));
        }
      }

      onLoginSucesso(res.usuario);
    } catch (err) {
      console.error('Erro de login:', err);
      setErro('Ocorreu um erro ao conectar ao servidor. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-950 to-red-950 flex flex-col justify-center items-center p-4 sm:p-6 text-zinc-100">
      
      {/* Container Central */}
      <div className="w-full max-w-md space-y-6">
        
        {/* Logo e Cabeçalho */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-red-500 text-white shadow-xl shadow-red-900/40 border border-red-400/30">
            <Flame className="w-9 h-9 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Recarga de Extintores
            </h1>
            <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mt-0.5">
              AVCB • Lafaiete e Região
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Mário Luiz Gomes da Silva • Gestão Integrada
            </p>
          </div>
        </div>

        {/* Card de Formulário */}
        <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          <div className="border-b border-zinc-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span>Acesso Restrito ao Sistema</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Identifique-se para gerenciar pedidos, clientes e laudos.
            </p>
          </div>

          {/* Mensagem de Erro */}
          {erro && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl flex items-start gap-2.5 text-xs text-red-200 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{erro}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Campo E-mail */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-300">
                E-mail cadastrado
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@gmail.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-300">
                Senha de acesso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 transition"
                  title={mostrarSenha ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {mostrarSenha ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Lembrar e Dica */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-400 hover:text-zinc-300 select-none">
                <input
                  type="checkbox"
                  checked={lembrar}
                  onChange={(e) => setLembrar(e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-red-600 focus:ring-red-500"
                />
                <span>Lembrar neste navegador</span>
              </label>
            </div>

            {/* Botão de Entrar */}
            <button
              type="submit"
              disabled={carregando}
              className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-900/30 transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {carregando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando credenciais...</span>
                </>
              ) : (
                <span>Entrar no Sistema</span>
              )}
            </button>
          </form>

        </div>

        {/* Rodapé de Segurança */}
        <div className="text-center text-[11px] text-zinc-500 space-y-1">
          <p className="flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Conexão Segura SSL • Neon Postgres Cloud</span>
          </p>
          <p>© {new Date().getFullYear()} Mário Luiz Gomes da Silva • CNPJ: 48.080.460/0001-01</p>
        </div>

      </div>

    </div>
  );
}
