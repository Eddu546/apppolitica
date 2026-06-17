import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Database,
  FileSearch,
  HeartHandshake,
  Map,
  Rocket,
  SearchCheck,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const roadmapItems = [
  {
    status: 'done',
    title: 'KPIs auditáveis',
    description:
      'Cards com fonte, data de consulta, nível de confiança, método de cálculo e aviso quando a fonte não sustenta uma conclusão.',
    icon: CheckCircle2,
  },
  {
    status: 'done',
    title: 'Cache gratuito de rankings',
    description:
      'Resumos anuais de despesas no Supabase Free para média nacional, média estadual, rankings e pontos de atenção com base persistente.',
    icon: Database,
  },
  {
    status: 'done',
    title: 'Páginas internas de fonte',
    description:
      'Explicação em português para despesas, proposições, eventos, discursos e votações, com endpoint técnico e limitação do dado.',
    icon: FileSearch,
  },
  {
    status: 'done',
    title: 'Busca global mais inteligente',
    description:
      'Busca por deputado, senador, partido, UF e pautas nacionais, priorizando correspondências mais fortes.',
    icon: SearchCheck,
  },
  {
    status: 'done',
    title: 'Pontos de atenção responsáveis',
    description:
      'Sinais de concentração de fornecedor, gasto acima da média, categorias sensíveis e dados ausentes, sempre com linguagem neutra.',
    icon: ShieldAlert,
  },
  {
    status: 'done',
    title: 'Apoio transparente',
    description:
      'Página oficial com custos, meta mensal, recompensas, link APOIA.se e aviso de separação entre projeto cívico e doação eleitoral.',
    icon: HeartHandshake,
    href: '/apoie',
  },
  {
    status: 'active',
    title: 'Senado com honestidade metodológica',
    description:
      'Ficha oficial, contato, mandato e suplentes já aparecem. Despesas, votações e relatorias seguem indisponíveis até fonte normalizada.',
    icon: FileSearch,
  },
  {
    status: 'active',
    title: 'Pautas nacionais com impacto público',
    description:
      'Páginas de PLs e PECs relevantes mostram autores, situação, votações e listas de votos quando a Câmara retorna dados nominais.',
    icon: Map,
  },
  {
    status: 'next',
    title: 'Sincronizações mais automáticas',
    description:
      'Preparar jobs gratuitos e retomada de falhas para manter cache anual atualizado com menos trabalho manual.',
    icon: Wrench,
  },
];

const statusConfig = {
  done: {
    label: 'Concluído',
    badgeClass: 'bg-green-50 text-green-700 border-green-200',
    iconClass: 'bg-green-100 text-green-700',
    lineClass: 'bg-green-500',
    width: '100%',
  },
  active: {
    label: 'Em andamento',
    badgeClass: 'bg-yellow-50 text-yellow-900 border-yellow-200',
    iconClass: 'bg-yellow-100 text-yellow-800',
    lineClass: 'bg-yellow-500',
    width: '64%',
  },
  next: {
    label: 'Próximo',
    badgeClass: 'bg-gray-50 text-gray-700 border-gray-200',
    iconClass: 'bg-gray-100 text-gray-700',
    lineClass: 'bg-gray-400',
    width: '28%',
  },
};

const phases = [
  {
    title: '1. Confiabilidade',
    text: 'Todo número precisa ter fonte, data e método. Esta etapa já virou o centro do produto.',
  },
  {
    title: '2. Utilidade pública',
    text: 'Rankings, alertas, pautas e busca precisam responder perguntas reais do cidadão.',
  },
  {
    title: '3. Sustentabilidade',
    text: 'Apoio financeiro deve vir com prestação de contas, custos claros e separação de campanha eleitoral.',
  },
];

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
      <section className="border-b border-yellow-400/20 bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-3 py-1 text-sm font-bold text-yellow-300">
                <Rocket className="h-4 w-4" />
                Evolução com dados reais
              </div>
              <h1 className="text-4xl font-black tracking-tight md:text-5xl">Roteiro de expansão</h1>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-zinc-300">
                O FISCALIZA cresce em camadas: confiabilidade primeiro, utilidade pública depois, sustentabilidade com prestação de contas. Qualquer KPI sem fonte confirmável continua bloqueado.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-yellow-400 text-black hover:bg-yellow-300">
                <Link to="/saude">Ver saúde do sistema</Link>
              </Button>
              <Button asChild variant="outline" className="border-yellow-400/40 bg-transparent text-yellow-100 hover:bg-yellow-400/10">
                <Link to="/apoie">Apoiar o projeto</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="mb-8 grid gap-4 md:grid-cols-3">
          {phases.map((phase) => (
            <div key={phase.title} className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="font-black text-gray-950">{phase.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{phase.text}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {roadmapItems.map((item, index) => {
            const config = statusConfig[item.status];
            const Icon = item.icon;
            const content = (
              <>
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
                  <div className={`h-full ${config.lineClass}`} style={{ width: config.width }} />
                </div>
              </>
            );

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.04 }}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
              >
                {item.href ? <Link to={item.href}>{content}</Link> : content}
              </motion.div>
            );
          })}
        </section>

        <section className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-5 text-yellow-950">
          <h2 className="font-black">Critério para entrar no produto</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Um recurso só vira número público quando tem fonte rastreável, método explicável e tratamento para dado parcial. Relatorias, faltas e presença percentual continuam bloqueadas quando a fonte atual não permite calcular com segurança.
          </p>
        </section>
      </main>
    </div>
  </>
);

export default RoadmapPage;
