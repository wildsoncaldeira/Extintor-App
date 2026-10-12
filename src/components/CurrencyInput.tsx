'use client';

import React from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  autoFocus?: boolean;
}

export function CurrencyInput({
  value,
  onChange,
  prefix = 'R$',
  placeholder = '0,00',
  className = '',
  disabled = false,
  id,
  name,
  autoFocus,
}: CurrencyInputProps) {
  // Converte valor em reais para centavos inteiros (ex: 15.50 -> 1550)
  const cents = Math.round((Number(value) || 0) * 100);

  // Formata os centavos no padrão brasileiro da direita para a esquerda: "0,00"
  const formatted = (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove qualquer caractere que não seja número
    const rawDigits = e.target.value.replace(/\D/g, '');
    const newCents = parseInt(rawDigits || '0', 10);
    const newValue = newCents / 100;
    onChange(newValue);
  };

  return (
    <div className="relative flex items-center w-full">
      {prefix && (
        <span className="absolute left-3 text-xs font-bold text-zinc-400 dark:text-zinc-500 pointer-events-none select-none">
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode="numeric"
        id={id}
        name={name}
        autoFocus={autoFocus}
        disabled={disabled}
        value={formatted}
        placeholder={placeholder}
        onChange={handleChange}
        className={`w-full ${prefix ? 'pl-9' : 'pl-3'} pr-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-zinc-950 dark:text-white font-medium ${className}`}
      />
    </div>
  );
}
