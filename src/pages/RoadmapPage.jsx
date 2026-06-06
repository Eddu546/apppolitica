import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Database, FileSearch, Map, Rocket, ShieldAlert, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';

const roadmapItems = [
  {
    status: 'done',
    title: 'KPIs auditáveis',
    description:
      'Cards de indicadores com fonte, data de consulta, nível de confiança, método de cálculo e aviso quando a fonte não sustenta uma conclusão.',
    icon: CheckCircle2,
  },
  {
    status: 'done',
    title: 'Cache gratuito de rankings',
    description:
      'Resumos anuais de despesas no Supabase Free para calcular média nacional, média estadual e rankings sem sobrecarregar a API oficial.',
    icon: Database,
  },
  {
    status: 'done',
    title: 'Pontos de atenção responsáveis',
    description:
      'Sinais de concentração de fornecedor, categorias sensíveis e comparação com média. A página orienta a leitura da fonte oficial sem acusar irregularidade.',
    icon: ShieldAlert,
  },
  {
    status: 'active',
    title: 'Roteiro cidadão',
    description:
      'Ferramenta educativa que ajuda o usuário a escolher o caminho de fiscalização, sem calcular afinidade política ou recomendar parlamentar por ideologia.',
    icon: Map,
  },
  {
    status: 'next',
    title: 'Senado com mais profundidade',
    description:
      'Expandir adaptadores do Senado somente onde houver endpoint oficial confirmável para despesas, matérias, votações, presença ou relatorias.',
    icon: FileSearch,
  },
  {
    status: 'next',
    title: 'Jobs gratuitos e persistência futura',
    description:
      'Preparar sincronizações agendadas em ferramentas gratuitas e manter separação entre dado bruto, agregado e métrica validada manualmente.',
    icon: Wrench,
  },
];

const statusConfig = {
  done: {
    label: 'Concluído',
    badgeClass: 'bg-green-50 text-green-700 border-green-200',
    iconClass: 'bg-green-100 text-green-700',
    lineClass: 'bg-green-500',
  },
  active: {
    label: 'Em andamento',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    iconClass: 'bg-blue-100 text-blue-700',
    lineClass: 'bg-blue-500',
  },
  next: {
    label: 'Próximo',
    badgeClass: 'bg-gray-50 text-gray-700 border-gray-200',
    iconClass: 'bg-gray-100 text-gray-700',
    lineClass: 'bg-gray-400',
  },
};

const RoadmapPage = () => (
  <>
    <Helmet>
      <title>Roteiro de Expansão - FISCALIZA</title>
      <meta
        name="description"
        content="Veja o que já foi implementado e quais são os próximos passos do FISCALIZA com foco em dados reais."
      />
    </Helmet>

    <div className="min-h-screen bg-gray-50 text-gray-900">
      <section className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                <Rocket className="h-4 w-4" />
                Evolução com dados reais
              </div>
              <h1 className="text-4xl font-black tracking-tight text-gray-950">Roteiro de expansão</h1>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-gray-600">
                O projeto cresce em camadas: primeiro confiabilidade, depois comparativos, depois automação. Qualquer KPI sem fonte confirmável fica como indisponível até existir base oficial segura.
              </p>
            </div>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link to="/meu-roteiro">Montar roteiro cidadão</Link>
            </Button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-2">
          {roadmapItems.map((item, index) => {
            const config = statusConfig[item.status];
            const Icon = item.icon;

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.04 }}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${config.iconClass}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${config.badgeClass}`}>
                      {config.label}
                    </span>
                    <h2 className="mt-3 text-xl font-black text-gray-950">{item.title}</h2>
                    <p className="mt-2 leading-relaxed text-gray-600">{item.description}</p>
                  </div>
                </div>
                <div className="mt-5 h-1 overflow-hidden rounded-full bg-gray-100">
                  <div className={`h-full ${config.lineClass}`} style={{ width: item.status === 'done' ? '100%' : item.status === 'active' ? '64%' : '28%' }} />
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-5 text-yellow-950">
          <h2 className="font-black">Critério para entrar no produto</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Um recurso só vira número público quando tem fonte rastreável, método explicável e tratamento para dado parcial. Relatorias, faltas e presença percentual continuam bloqueadas quando a fonte atual não permite calcular com segurança.
          </p>
        </div>
      </main>
    </div>
  </>
);

export default RoadmapPage;
