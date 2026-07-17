import React from 'react';
import { Loader2 } from 'lucide-react';

const PageLoader = ({ label = 'Carregando página...' }) => (
  <div className="mx-auto flex min-h-[55vh] max-w-7xl items-center justify-center px-4 py-16" role="status" aria-live="polite">
    <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-white px-5 py-4 text-sm font-bold text-gray-700 shadow-sm">
      <Loader2 className="h-5 w-5 animate-spin text-yellow-600" aria-hidden="true" />
      <span>{label}</span>
    </div>
  </div>
);

export default PageLoader;
