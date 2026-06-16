import React from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  DollarSign,
  ExternalLink,
  FileText,
  Instagram,
  Scale,
  Search,
  ShieldCheck,
  Twitter,
  Youtube,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const socialLinks = [
  { label: 'YouTube', href: 'https://www.youtube.com/@eduardowilliammm', icon: Youtube },
  { label: 'Instagram', href: 'https://www.instagram.com/eduardowilliamm', icon: Instagram },
  { label: 'X', href: 'https://x.com/eduardowilliamm', icon: Twitter },
  { label: 'TikTok', href: 'https://www.tiktok.com/@eduardowilliamm' },
  { label: 'Kwai', href: 'https://k.kwai.com/u/@eduardowilliamm/wCvcQcF5' },
];

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
        <title>FISCALIZA - Transparência pública por Eduardo William</title>
      </Helmet>

      <section className="relative overflow-hidden bg-black px-4 pb-16 pt-14 text-white sm:px-6 md:pb-20 md:pt-16 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(250,204,21,0.14),transparent_34%),linear-gradient(135deg,#050505_0%,#111111_55%,#1f1600_100%)]" />
        <img
          src="/fiscaliza-onca-investigadora.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[-40px] right-[-40px] hidden w-[460px] opacity-10 mix-blend-screen md:block lg:w-[560px]"
        />

        <div className="relative z-10 mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-5xl text-center"
          >
            <span className="mb-5 inline-flex items-center rounded-full border border-yellow-400/40 bg-yellow-400/10 px-4 py-1.5 text-sm font-bold text-yellow-200">
              <ShieldCheck className="mr-2 h-4 w-4" /> Transparência, fiscalização e mandato aberto
            </span>
            <h1 className="mb-6 text-5xl font-black leading-tight md:text-7xl">
              Fiscalize quem <span className="text-yellow-300">você elegeu</span>
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-lg leading-relaxed text-zinc-200 md:text-xl">
              O FISCALIZA transforma dados oficiais da Câmara e do Senado em informação simples para o cidadão acompanhar gastos,
              proposições, pautas e votações com fonte visível.
            </p>

            <form onSubmit={handleSearch} className="relative mx-auto mb-7 max-w-xl">
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Busque por deputado ou senador..."
                className="w-full rounded-full border border-yellow-300/30 bg-white py-4 pl-14 pr-32 text-base text-gray-950 shadow-2xl shadow-yellow-950/20 focus:outline-none focus:ring-4 focus:ring-yellow-400/40 sm:text-lg"
              />
              <Button
                type="submit"
                size="lg"
                className="absolute bottom-2 right-2 top-2 rounded-full bg-yellow-400 px-5 font-black text-black hover:bg-yellow-300"
              >
                Buscar
              </Button>
            </form>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button asChild size="lg" className="h-14 rounded-lg bg-yellow-400 px-6 text-base font-black text-black shadow-lg shadow-yellow-950/20 hover:bg-yellow-300">
                <Link to="/deputados">Ver deputados <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button asChild size="lg" className="h-14 rounded-lg border border-white/25 bg-white/10 px-6 text-base font-bold text-white hover:bg-white/20">
                <Link to="/comparar"><Scale className="mr-2 h-5 w-5" /> Comparar</Link>
              </Button>
              <Button asChild size="lg" className="h-14 rounded-lg border border-white/25 bg-white/10 px-6 text-base font-bold text-white hover:bg-white/20">
                <Link to="/meu-roteiro"><ClipboardList className="mr-2 h-5 w-5" /> Meu roteiro</Link>
              </Button>
              <Button asChild size="lg" className="h-14 rounded-lg border border-white/25 bg-white/10 px-6 text-base font-bold text-white hover:bg-white/20">
                <Link to="/pautas"><FileText className="mr-2 h-5 w-5" /> Ver pautas</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-yellow-200 bg-yellow-50 py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-wide text-yellow-700">Pré-candidatura pela Paraíba</p>
            <h2 className="text-3xl font-black text-gray-950 md:text-4xl">Eduardo William e a defesa de uma política fiscalizável</h2>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-gray-700">
              Minha pré-candidatura a deputado federal pela Paraíba nasce da ideia de que o cidadão não deve depender de boato,
              recorte ou promessa para acompanhar a vida pública. Transparência precisa ser simples, verificável e acessível.
            </p>
            <p className="mt-4 max-w-3xl leading-relaxed text-gray-700">
              O FISCALIZA foi criado como uma ferramenta cívica para aproximar dados oficiais da população: gastos declarados,
              proposições, votações, alertas responsáveis e fontes abertas. A mensagem é direta: quem ocupa cargo público precisa
              ser acompanhado com método, fonte e responsabilidade.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {socialLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-yellow-300 bg-white px-4 py-2 text-sm font-black text-gray-950 shadow-sm transition hover:border-yellow-500 hover:bg-yellow-100"
                  >
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                    {item.label}
                    <ExternalLink className="h-3.5 w-3.5 text-gray-500" />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-yellow-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-black text-yellow-300">
              <BarChart3 className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-black text-gray-950">Compromisso público</h3>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-gray-700">
              <p><strong>Dados reais:</strong> nenhum KPI deve aparecer como verdade se a fonte oficial não sustentar o cálculo.</p>
              <p><strong>Fonte visível:</strong> o cidadão precisa saber de onde veio cada número antes de tirar conclusão.</p>
              <p><strong>Fiscalização sem acusação automática:</strong> alerta é ponto de atenção, não sentença.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                <FileText className="h-6 w-6 text-yellow-700" />
              </div>
              <h3 className="mb-3 text-xl font-black">Indicadores auditáveis</h3>
              <p className="text-gray-600">Proposições, discursos e atividades aparecem com fonte oficial e aviso quando a leitura é limitada.</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-black">
                <DollarSign className="h-6 w-6 text-yellow-300" />
              </div>
              <h3 className="mb-3 text-xl font-black">Auditoria de gastos</h3>
              <p className="text-gray-600">Soma da Cota Parlamentar a partir dos valores líquidos retornados pela API da Câmara.</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                <Scale className="h-6 w-6 text-yellow-700" />
              </div>
              <h3 className="mb-3 text-xl font-black">Comparação responsável</h3>
              <p className="text-gray-600">Compare dados concretos sem transformar ausência de registro em acusação automática.</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-black">
                <ClipboardList className="h-6 w-6 text-yellow-300" />
              </div>
              <h3 className="mb-3 text-xl font-black">Roteiro cidadão</h3>
              <p className="text-gray-600">Monte um caminho de fiscalização sem afinidade inventada e com links para dados verificáveis.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-zinc-950 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-black">Fiscalize por pauta nacional</h2>
                <p className="mt-2 max-w-3xl text-zinc-200">
                  Comece por temas como Reforma Tributária, PL das Fake News, saidinhas, armas ou marco temporal.
                  Veja o número oficial e depois confira os votos nominais nos perfis.
                </p>
              </div>
              <Button asChild className="bg-yellow-400 font-black text-black hover:bg-yellow-300">
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
