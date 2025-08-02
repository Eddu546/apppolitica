import React from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Search, Dna, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OncaLogo from '@/components/OncaLogo';

const HomePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const features = [
    {
      icon: Search,
      title: 'Fiscalize seu Político',
      description: 'Acesse o perfil completo, despesas, votações e atividade legislativa de qualquer deputado ou senador.',
      link: '/deputados',
      cta: 'Começar a Fiscalizar'
    },
    {
      icon: Dna,
      title: 'Meu DNA Político',
      description: 'Responda a um quiz rápido e descubra quais parlamentares votam como você no Congresso.',
      link: '/meu-dna',
      cta: 'Descobrir meu DNA'
    },
    {
      icon: Target,
      title: 'Painel de Desempenho',
      description: 'Compare políticos através de indicadores-chave de desempenho (KPIs) e veja quem realmente trabalha.',
      link: '/analytics',
      cta: 'Analisar Desempenho'
    },
  ];

  return (
    <>
      <Helmet>
        <title>Fiscaliza, MBL! - A Ferramenta de Fiscalização do Cidadão</title>
        <meta name="description" content="Fiscalize deputados e senadores com a plataforma de transparência do MBL. Análise de desempenho, gastos, votações e muito mais." />
      </Helmet>

      <section className="bg-black bg-onca-spots text-gray-100 py-20 md:py-28">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, type: 'spring' }}
        className="inline-block mb-6"
      >
        <OncaLogo className="w-24 h-24" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tighter"
      >
        O poder de fiscalizar,
        <br />
        <span className="text-yellow-400">agora em suas mãos.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto text-gray-300"
      >
        A ferramenta definitiva do MBL para você monitorar, analisar e cobrar os políticos brasileiros. Chega de desculpas.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Digite o nome de um político para começar..."
            className="w-full bg-white/90 border-2 border-gray-300 rounded-lg py-4 pl-6 pr-36 text-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
          />
          <Button
            type="submit"
            size="lg"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-yellow-400 text-black hover:bg-yellow-500 font-bold"
          >
            Fiscalizar
            <Search className="ml-2 w-5 h-5" />
          </Button>
        </form>
      </motion.div>
    </div>
  </div>
  <img  
  src="/onca-texture.png"
  alt="Detalhe de onça"
  className="absolute bottom-1 left 28 w-80 md:w-100 opacity-80 pointer-events-none z-0"
/>
</section>


      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Uma plataforma, três formas de agir.
            </h2>
            <p className="text-xl text-gray-500 max-w-3xl mx-auto">
              Informação é poder. Use-o com sabedoria.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="bg-white rounded-xl p-8 shadow-md border border-gray-200 hover:border-yellow-400 transition-colors flex flex-col hover-lift"
                >
                  <div className="flex-grow">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg mb-6">
                      <Icon className="w-6 h-6 text-yellow-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                    <p className="text-gray-600 mb-6">{feature.description}</p>
                  </div>
                  <Link to={feature.link}>
                    <Button variant="outline" className="w-full border-yellow-400 text-yellow-500 hover:bg-yellow-400 hover:text-black font-semibold">
                      {feature.cta}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            A mudança começa com a sua atitude.
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Junte-se ao MBL e a milhares de brasileiros na luta por um país mais livre e transparente.
          </p>
          <a href="https://mbl.org.br/" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-yellow-400 text-black hover:bg-yellow-500 font-bold px-10">
              Faça Parte do MBL
            </Button>
          </a>
        </div>
      </section>
    </>
  );
};

export default HomePage;