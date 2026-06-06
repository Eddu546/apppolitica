import React from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, FileText, DollarSign, ShieldCheck, Scale, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HomePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (event) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>FISCALIZA - Auditoria Cidadã e Transparência Política</title>
      </Helmet>

      <section className="relative overflow-hidden bg-slate-900 px-4 py-16 text-white sm:px-6 md:py-20 lg:px-8">
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="mb-6 inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-bold text-blue-200">
                <ShieldCheck className="mr-2 h-4 w-4" /> Auditoria Legislativa 2.0
              </span>
              <h1 className="mb-6 text-5xl font-extrabold md:text-7xl">
                Fiscalize quem <span className="text-blue-300">você elegeu</span>
              </h1>
              <p className="mx-auto mb-10 max-w-3xl text-xl leading-relaxed text-gray-200">
                Acompanhe despesas, proposições, discursos e atividades registradas com fonte e nível de confiança.
                Dados oficiais transformados em informação auditável para o cidadão.
              </p>

              <form onSubmit={handleSearch} className="relative mx-auto mb-8 max-w-xl">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Busque por deputado ou senador..."
                  className="w-full rounded-full border-0 bg-white py-4 pl-8 pr-32 text-base text-gray-900 shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/50 sm:text-lg"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="absolute bottom-2 right-2 top-2 rounded-full bg-blue-600 px-5 font-bold text-white hover:bg-blue-700"
                >
                  Buscar
                </Button>
              </form>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Button asChild size="lg" className="h-14 rounded-lg bg-blue-600 px-6 text-base font-bold text-white shadow-lg shadow-blue-950/20 hover:bg-blue-700">
                  <Link to="/deputados">Ver Deputados <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
                <Button asChild size="lg" className="h-14 rounded-lg border border-white/30 bg-white/10 px-6 text-base font-bold text-white hover:bg-white/20">
                  <Link to="/comparar"><Scale className="mr-2 h-5 w-5" /> Comparar</Link>
                </Button>
                <Button asChild size="lg" className="h-14 rounded-lg border border-white/30 bg-white/10 px-6 text-base font-bold text-white hover:bg-white/20">
                  <Link to="/meu-roteiro"><ClipboardList className="mr-2 h-5 w-5" /> Meu Roteiro</Link>
                </Button>
                <Button asChild size="lg" className="h-14 rounded-lg border border-white/30 bg-white/10 px-6 text-base font-bold text-white hover:bg-white/20">
                  <Link to="/pautas"><FileText className="mr-2 h-5 w-5" /> Ver Pautas</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mb-3 text-xl font-bold">Indicadores auditáveis</h3>
              <p className="text-gray-600">Proposições, discursos e atividades aparecem com fonte oficial e aviso quando a leitura é limitada.</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mb-3 text-xl font-bold">Auditoria de gastos</h3>
              <p className="text-gray-600">Soma da Cota Parlamentar a partir dos valores líquidos retornados pela API da Câmara.</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <Scale className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="mb-3 text-xl font-bold">Comparação responsável</h3>
              <p className="text-gray-600">Compare dados concretos sem transformar ausência de registro em acusação automática.</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                <ClipboardList className="h-6 w-6 text-yellow-700" />
              </div>
              <h3 className="mb-3 text-xl font-bold">Roteiro cidadão</h3>
              <p className="text-gray-600">Monte um caminho de fiscalização sem afinidade inventada e com links para dados verificáveis.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-black text-gray-950">Fiscalize por pauta nacional</h2>
                <p className="mt-2 max-w-3xl text-gray-700">
                  Comece por temas como Reforma Tributária, PL das Fake News, saidinhas, armas ou marco temporal.
                  Veja o número oficial e depois confira os votos nominais nos perfis.
                </p>
              </div>
              <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
                <Link to="/pautas">Abrir pautas nacionais</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
