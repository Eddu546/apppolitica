import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  ExternalLink,
  FileSearch,
  HeartHandshake,
  Scale,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const principles = [
  {
    icon: ShieldCheck,
    title: 'Fonte antes do número',
    description: 'Todo indicador precisa apontar fonte, data de consulta e método de cálculo. Sem fonte confiável, o dado fica indisponível.',
  },
  {
    icon: Scale,
    title: 'Linguagem responsável',
    description: 'O FISCALIZA mostra pontos de atenção, não acusações. Gasto alto, fornecedor concentrado ou dado ausente exigem análise.',
  },
  {
    icon: FileSearch,
    title: 'Explicação para o cidadão',
    description: 'A plataforma traduz termos como CEAP, proposição, votação nominal e relatoria para uma leitura simples.',
  },
  {
    icon: Target,
    title: 'Fiscalização prática',
    description: 'A meta é ajudar qualquer pessoa a sair da opinião solta e consultar dados públicos com método.',
  },
];

const dataLayers = [
  {
    label: 'Dados oficiais',
    value: 'Câmara e Senado',
    description: 'Listas de parlamentares, despesas, proposições, eventos, votos e fichas oficiais quando a API retorna dados.',
  },
  {
    label: 'Indicadores calculados',
    value: 'FISCALIZA',
    description: 'Somas, médias, rankings e pontos de atenção calculados pelo site a partir das fontes oficiais disponíveis.',
  },
  {
    label: 'Correções validadas',
    value: 'Manual',
    description: 'Informações enviadas por usuários entram apenas após análise, fonte e revisão. Nada altera dado oficial automaticamente.',
  },
];

const whatWeDo = [
  'Soma despesas parlamentares retornadas pela API oficial.',
  'Mostra médias, ranking e comparação quando o cache anual está sincronizado.',
  'Exibe proposições, discursos, atividades e votações com fonte visível.',
  'Cria páginas internas de fonte para explicar método, endpoint e limitação do dado.',
];

const whatWeDoNotDo = [
  'Não inventa faltas, presenças ou relatorias quando a fonte não confirma.',
  'Não chama proposição apresentada de proposição aprovada.',
  'Não transforma ponto de atenção em acusação de crime.',
  'Não usa ranking ou índice como verdade oficial sobre qualidade do mandato.',
];

const sources = [
  {
    title: 'Câmara dos Deputados - Dados Abertos',
    description: 'Deputados, despesas CEAP, proposições, eventos, discursos, votações e votos nominais quando disponíveis.',
    href: 'https://dadosabertos.camara.leg.br',
  },
  {
    title: 'Senado Federal - Dados Abertos',
    description: 'Ficha oficial de senadores e integrações adicionais somente quando houver endpoint confirmável e normalizado.',
    href: 'https://legis.senado.leg.br/dadosabertos',
  },
  {
    title: 'Portal da Transparência do Senado',
    description: 'Fonte auxiliar para consulta manual de despesas e dados ainda não normalizados dentro do FISCALIZA.',
    href: 'https://www6g.senado.leg.br/transparencia/sen/',
  },
];

const AboutPage = () => (
  <>
    <Helmet>
      <title>Sobre o Projeto - FISCALIZA</title>
      <meta
        name="description"
        content="Conheça a missão, as fontes e os limites metodológicos do FISCALIZA."
      />
    </Helmet>

    <div className="min-h-screen bg-gray-50 text-gray-900">
      <section className="border-b border-yellow-400/20 bg-black text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-3 py-1 text-sm font-bold text-yellow-300">
              <ShieldCheck className="h-4 w-4" />
              Transparência pública com método
            </div>
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">
              Sobre o <span className="text-yellow-300">FISCALIZA</span>
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-zinc-300">
              O FISCALIZA nasceu para transformar dados públicos legislativos em informação simples, rastreável e útil para o cidadão comum acompanhar deputados e senadores.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild className="bg-yellow-400 text-black hover:bg-yellow-300">
                <Link to="/deputados">Ver deputados</Link>
              </Button>
              <Button asChild variant="outline" className="border-yellow-400/40 bg-transparent text-yellow-100 hover:bg-yellow-400/10">
                <Link to="/roadmap">Ver roteiro do projeto</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-3">
          {dataLayers.map((item) => (
            <div key={item.label} className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase text-gray-500">{item.label}</p>
              <p className="mt-2 text-2xl font-black text-gray-950">{item.value}</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.description}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Target className="h-6 w-6 text-yellow-700" />
              <h2 className="text-2xl font-black text-gray-950">Missão</h2>
            </div>
            <p className="text-sm leading-relaxed text-gray-700">
              A missão do FISCALIZA é reduzir a distância entre dados oficiais e fiscalização cidadã. O projeto organiza informações sobre gastos, proposições, votações, atividades registradas e pontos de atenção, sempre deixando claro o que é dado oficial e o que é cálculo do site.
            </p>
            <div className="mt-5 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm leading-relaxed text-yellow-950">
              Quando a fonte não sustenta uma conclusão, a plataforma prefere mostrar “dado indisponível” a publicar número bonito sem base.
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {principles.map((principle, index) => {
              const Icon = principle.icon;
              return (
                <motion.div
                  key={principle.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.04 }}
                  className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50 text-yellow-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-black text-gray-950">{principle.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{principle.description}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-green-200 bg-green-50 p-6">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-700" />
              <h2 className="text-xl font-black text-green-950">O que o FISCALIZA faz</h2>
            </div>
            <ul className="space-y-3 text-sm leading-relaxed text-green-950">
              {whatWeDo.map((item) => (
                <li key={item} className="rounded-lg bg-white/70 p-3">{item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-yellow-700" />
              <h2 className="text-xl font-black text-yellow-950">O que o FISCALIZA não faz</h2>
            </div>
            <ul className="space-y-3 text-sm leading-relaxed text-yellow-950">
              {whatWeDoNotDo.map((item) => (
                <li key={item} className="rounded-lg bg-white/70 p-3">{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-10 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Database className="h-6 w-6 text-yellow-700" />
            <h2 className="text-2xl font-black text-gray-950">Fontes usadas</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {sources.map((source) => (
              <a
                key={source.title}
                href={source.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-gray-100 bg-gray-50 p-4 transition-colors hover:border-yellow-300 hover:bg-yellow-50"
              >
                <h3 className="font-black text-gray-950">{source.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{source.description}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-yellow-800">
                  Abrir fonte <ExternalLink className="h-4 w-4" />
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <HeartHandshake className="h-6 w-6 text-yellow-700" />
                <h2 className="text-2xl font-black text-gray-950">Independência e apoio transparente</h2>
              </div>
              <p className="text-sm leading-relaxed text-gray-700">
                O FISCALIZA possui uma página oficial de apoio com custos, metas e regras de independência. Contribuições ao projeto não são doação eleitoral, não financiam campanha e não compram alteração de dados, rankings ou validações.
              </p>
            </div>
            <Button asChild className="shrink-0 bg-yellow-400 font-black text-black hover:bg-yellow-300">
              <Link to="/apoie">Ver custos e apoio</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  </>
);

export default AboutPage;
