import React from 'react';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NotFoundPage = () => (
  <div className="min-h-[65vh] bg-gray-50 px-4 py-16">
    <Helmet><title>Página não encontrada - FISCALIZA</title></Helmet>
    <section className="mx-auto max-w-2xl rounded-lg border border-yellow-200 bg-white p-8 text-center shadow-sm sm:p-12">
      <p className="text-sm font-black uppercase text-yellow-700">Erro 404</p>
      <h1 className="mt-3 text-3xl font-black text-gray-950">Esta página não foi encontrada</h1>
      <p className="mx-auto mt-4 max-w-lg leading-relaxed text-gray-600">
        O endereço pode ter mudado ou estar incompleto. Use a busca para encontrar um parlamentar ou volte à página inicial.
      </p>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild className="bg-yellow-400 text-black hover:bg-yellow-300">
          <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao início</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/deputados"><Search className="mr-2 h-4 w-4" /> Buscar deputados</Link>
        </Button>
      </div>
    </section>
  </div>
);

export default NotFoundPage;
