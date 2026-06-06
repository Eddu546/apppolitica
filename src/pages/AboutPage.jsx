import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Target, Eye, Code2, Database, Shield, Users } from 'lucide-react';

const AboutPage = () => {
  const values = [
    {
      icon: Eye,
      title: 'Transparência',
      description: 'Acreditamos que todo cidadão tem o direito de saber como seus representantes atuam e como o dinheiro público é gasto.',
    },
    {
      icon: Shield,
      title: 'Independência',
      description: 'Somos uma iniciativa sem vínculos partidários ou financiamento governamental. Nosso compromisso é com o cidadão.',
    },
    {
      icon: Code2,
      title: 'Dados Abertos',
      description: 'Utilizamos APIs públicas oficiais e indicamos quando um dado é limitado ou indisponível.',
    },
    {
      icon: Users,
      title: 'Engajamento Cívico',
      description: 'Queremos transformar dados complexos em informação acessível para que qualquer pessoa possa fiscalizar o poder.',
    },
  ];

  const techStack = [
    { name: 'React 18', desc: 'Interface de usuário' },
    { name: 'Vite', desc: 'Build e desenvolvimento' },
    { name: 'TailwindCSS', desc: 'Estilização' },
    { name: 'Recharts', desc: 'Visualizações' },
    { name: 'Framer Motion', desc: 'Animações' },
    { name: 'API Câmara', desc: 'Dados dos Deputados' },
    { name: 'API Senado', desc: 'Dados dos Senadores' },
    { name: 'Vercel', desc: 'Hospedagem' },
  ];

  return (
    <>
      <Helmet>
        <title>Sobre o Projeto - FISCALIZA</title>
        <meta name="description" content="Conheça a missão do FISCALIZA, a plataforma independente de transparência política brasileira." />
      </Helmet>
      <div className="bg-white text-gray-900">
        {/* Hero */}
        <div className="bg-gradient-to-br from-slate-900 to-blue-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
                Sobre o <span className="text-blue-400">FISCALIZA</span>
              </h1>
              <p className="text-xl md:text-2xl max-w-3xl mx-auto text-gray-300">
                Promovendo a transparência e o engajamento cívico através da fiscalização do poder.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Missão */}
        <div className="bg-gray-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold">Nossa Missão</h2>
                </div>
                <p className="text-gray-600 leading-relaxed text-lg mb-4">
                  Nossa missão é simples: democratizar o acesso aos dados públicos. O FISCALIZA transforma planilhas complexas do governo em informações claras e visuais, permitindo que qualquer cidadão atue como um fiscal do uso do dinheiro público.
                </p>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Somos uma iniciativa independente, sem vínculos partidários, construída sobre dados abertos oficiais e metodologia cautelosa. Quando a API não sustenta uma conclusão, o indicador aparece como limitado ou indisponível.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="grid grid-cols-2 gap-4"
              >
                {[
                  { label: 'Deputados Monitorados', value: '513' },
                  { label: 'Senadores Monitorados', value: '81' },
                  { label: 'Anos de Dados', value: '3+' },
                  { label: 'APIs Integradas', value: '2' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
                    <div className="text-3xl font-extrabold text-blue-600 mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Valores */}
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Nossos Valores</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <motion.div
                    key={value.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{value.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{value.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stack Tecnológico */}
        <div className="bg-gray-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Stack Tecnológico</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                O FISCALIZA é construído com tecnologias modernas e de código aberto, garantindo performance, escalabilidade e manutenibilidade.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {techStack.map((tech) => (
                <div key={tech.name} className="bg-white rounded-lg p-4 border border-gray-200 text-center hover:border-blue-300 transition-colors">
                  <div className="font-bold text-gray-900 text-sm">{tech.name}</div>
                  <div className="text-gray-500 text-xs mt-1">{tech.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fontes de Dados */}
        <div className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Database className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Fontes de Dados</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Os dados exibidos no FISCALIZA vêm das APIs públicas oficiais. A curadoria do site se limita a organizar, somar e explicar limitações metodológicas para evitar rankings ou acusações sem base auditável.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <a
                href="https://dadosabertos.camara.leg.br"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-blue-50 border border-blue-200 rounded-xl p-6 hover:bg-blue-100 transition-colors text-left"
              >
                <h3 className="font-bold text-blue-900 mb-2">API da Câmara dos Deputados</h3>
                <p className="text-blue-700 text-sm">Dados de deputados, proposições, votações, despesas e eventos legislativos.</p>
              </a>
              <a
                href="https://legis.senado.leg.br/dadosabertos"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-green-50 border border-green-200 rounded-xl p-6 hover:bg-green-100 transition-colors text-left"
              >
                <h3 className="font-bold text-green-900 mb-2">API do Senado Federal</h3>
                <p className="text-green-700 text-sm">Dados de senadores, matérias legislativas, votações, comissões e relatorias.</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutPage;
