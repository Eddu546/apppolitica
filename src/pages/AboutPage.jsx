import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Target, Database } from 'lucide-react';

const AboutPage = () => {
  return (
    <>
      <Helmet>
        <title>Sobre o Projeto - Fiscaliza, MBL!</title>
        <meta name="description" content="Conheça a missão, a metodologia e as fontes de dados do Fiscaliza, MBL!, a plataforma de transparência do Movimento Brasil Livre." />
      </Helmet>

      <div className="bg-white text-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
              Sobre o <span className="text-yellow-500">Fiscaliza, MBL!</span>
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto text-gray-600">
              Promovendo a transparência e o engajamento cívico através da fiscalização do poder.
            </p>
          </motion.div>
        </div>

        <div className="bg-gray-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center mr-4">
                    <Target className="w-6 h-6 text-black" />
                  </div>
                  <h2 className="text-3xl font-bold">Nossa Missão</h2>
                </div>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Nossa missão é simples e direta: dar poder ao cidadão comum. Acreditamos que a fiscalização constante dos políticos é a ferramenta mais eficaz para combater a corrupção e o desperdício de dinheiro público. O Fiscaliza, MBL! transforma dados brutos e complexos em informações claras e acionáveis, permitindo que qualquer pessoa possa atuar como um verdadeiro fiscal do poder.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <img  class="rounded-lg shadow-xl" alt="Membros do MBL em uma manifestação" src="https://images.unsplash.com/photo-1667293271727-a93ca2bab7d4" />
              </motion.div>
            </div>
          </div>
        </div>

        <div className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Metodologia e Fontes de Dados
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Compromisso com a precisão e a transparência total.
              </p>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
              <h3 className="text-2xl font-semibold text-yellow-500 mb-4">Fontes de Dados</h3>
              <p className="text-gray-700 mb-6">
                Todas as informações apresentadas nesta plataforma são obtidas exclusivamente de fontes públicas e oficiais, garantindo a credibilidade e a precisão dos dados. Nossas principais fontes são:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-8">
                <li>API de Dados Abertos da Câmara dos Deputados</li>
                <li>API de Dados Abertos do Senado Federal</li>
                <li>Portais de Transparência do Governo Federal</li>
              </ul>

              <h3 className="text-2xl font-semibold text-yellow-500 mb-4">Cálculo dos KPIs de Desempenho</h3>
              <p className="text-gray-700 mb-6">
                O "Painel de Desempenho Parlamentar" é o coração da nossa análise. Os indicadores (KPIs) são calculados da seguinte forma:
              </p>
              <dl className="space-y-4">
                <div>
                  <dt className="font-semibold text-gray-900">Eficácia Legislativa:</dt>
                  <dd className="text-gray-600 ml-4">Mede o sucesso de um parlamentar em avançar suas proposições (projetos de lei, PECs, etc.) pelas comissões e plenário. Uma pontuação mais alta indica maior capacidade de articulação e aprovação de suas pautas.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-900">Responsabilidade Fiscal:</dt>
                  <dd className="text-gray-600 ml-4">Analisa os gastos da Cota para o Exercício da Atividade Parlamentar (CEAP). A pontuação é inversamente proporcional ao valor gasto, comparando-o com a média de seus pares. Menos gastos resultam em uma pontuação maior.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-900">Lealdade Partidária:</dt>
                  <dd className="text-gray-600 ml-4">Calcula a porcentagem de vezes que o parlamentar votou de acordo com a orientação de seu partido nas votações nominais. Uma pontuação alta indica grande alinhamento com a bancada.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-900">Presença e Participação:</dt>
                  <dd className="text-gray-600 ml-4">Reflete a assiduidade do político nas sessões deliberativas do plenário. Faltas, mesmo que justificadas, impactam negativamente a pontuação. O indicador mede o compromisso básico de estar presente para debater e votar.</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutPage;