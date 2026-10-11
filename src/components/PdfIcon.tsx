import React from 'react';
import { FaFilePdf } from 'react-icons/fa6';

export function PdfIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return <FaFilePdf className={className} />;
}
