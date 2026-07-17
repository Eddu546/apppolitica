import React from 'react';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[FISCALIZA] Falha inesperada na interface.', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-16">
        <section className="w-full max-w-xl rounded-lg border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-700">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-2xl font-black text-gray-950">Esta página encontrou um problema</h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Nenhum dado foi substituído ou inventado. Recarregue a consulta ou volte ao início enquanto a fonte é verificada.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button type="button" onClick={() => window.location.reload()} className="bg-yellow-400 text-black hover:bg-yellow-300">
              <RotateCcw className="mr-2 h-4 w-4" /> Recarregar
            </Button>
            <Button asChild variant="outline">
              <a href="/"><Home className="mr-2 h-4 w-4" /> Voltar ao início</a>
            </Button>
          </div>
        </section>
      </main>
    );
  }
}

export default AppErrorBoundary;
