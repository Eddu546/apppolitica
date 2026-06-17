import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Gift,
  HeartHandshake,
  Receipt,
  Scale,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/legislative-logic';
import {
  SUPPORT_MONTHLY_GOAL,
  SUPPORT_URL,
  getSupportBudgetShare,
  supportBudgetItems,
  supportRewards,
  supportTransparencyRules,
} from '@/lib/support';

const SupportPage = () => (
  <>
    <Helmet>
      <title>Apoie o FISCALIZA - Transparência com prestação de contas</title>
      <meta
        name="description"
        content="Apoie a manutenção do FISCALIZA com custos, metas e regras de independência pública."
      />
    </Helmet>

    <div className="min-h-screen bg-gray-50 text-gray-900">
      <section className="border-b border-yellow-400/20 bg-black text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-3 py-1 text-sm font-bold text-yellow-300">
              <HeartHandshake className="h-4 w-4" />
              Apoio transparente e independente
            </div>
            <h1 className="text-4xl font-black tracking-tight md:text-6xl">
              Ajude a manter o <span className="text-yellow-300">FISCALIZA</span> no ar
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-zinc-300">
              O FISCALIZA organiza dados públicos legislativos para que qualquer cidadão acompanhe gastos, propostas, votações e pontos de atenção com fonte visível. Seu apoio ajuda a manter essa ferramenta gratuita, verificável e em evolução.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-yellow-400 font-black text-black hover:bg-yellow-300">
                <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
                  Apoiar no APOIA.se <ExternalLink className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-yellow-400/40 bg-transparent text-yellow-100 hover:bg-yellow-400/10">
                <Link to="/sobre">Entender o projeto</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-yellow-200">Meta mensal inicial</p>
                <p className="mt-2 text-4xl font-black text-yellow-300">{formatCurrency(SUPPORT_MONTHLY_GOAL)}</p>
              </div>
              <Target className="h-10 w-10 text-yellow-300" />
            </div>
            <p className="mt-4 leading-relaxed text-zinc-200">
              Valor estimado para manter evolução técnica, pesquisa de dados, comunicação, ferramentas e uma pequena reserva operacional. A infraestrutura continua priorizando opções gratuitas sempre que possível.
            </p>
            <div className="mt-5 rounded-lg border border-yellow-400/30 bg-black/40 p-4 text-sm leading-relaxed text-yellow-50">
              O apoio ao FISCALIZA não é doação eleitoral, não financia campanha e não compra alteração de dados, ranking ou validação.
            </div>
          </motion.div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-yellow-50 text-yellow-800">
              <Receipt className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-black text-gray-950">Custos declarados</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              A meta é formada por itens públicos e revisáveis. Se os custos mudarem, a página deve ser atualizada.
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-yellow-50 text-yellow-800">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-black text-gray-950">Independência</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Apoiadores não têm acesso privilegiado para mudar dados públicos, análises ou pontos de atenção.
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-yellow-50 text-yellow-800">
              <Scale className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-black text-gray-950">Separação eleitoral</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Contribuir com o projeto cívico não equivale a doar para pré-campanha, campanha ou partido político.
            </p>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Receipt className="h-6 w-6 text-yellow-700" />
              <h2 className="text-2xl font-black text-gray-950">Como a meta foi calculada</h2>
            </div>
            <div className="space-y-4">
              {supportBudgetItems.map((item) => {
                const share = getSupportBudgetShare(item.value);
                return (
                  <div key={item.label} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-black text-gray-950">{item.label}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-gray-600">{item.description}</p>
                      </div>
                      <p className="shrink-0 text-lg font-black text-gray-950">{formatCurrency(item.value)}</p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                      <div className="h-full rounded-full bg-yellow-400" style={{ width: `${share}%` }} />
                    </div>
                    <p className="mt-1 text-xs font-bold text-gray-500">{share}% da meta mensal</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Gift className="h-6 w-6 text-yellow-700" />
              <h2 className="text-2xl font-black text-gray-950">Recompensas simples</h2>
            </div>
            <div className="space-y-4">
              {supportRewards.map((reward) => (
                <div key={reward.title} className="rounded-lg border border-yellow-100 bg-yellow-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-gray-950">{reward.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-gray-700">{reward.description}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-black px-3 py-1 text-sm font-black text-yellow-300">
                      {formatCurrency(reward.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <div className="mb-5 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-yellow-800" />
            <h2 className="text-2xl font-black text-yellow-950">Regras de confiança</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {supportTransparencyRules.map((rule) => (
              <div key={rule} className="flex gap-3 rounded-lg bg-white/80 p-4 text-sm leading-relaxed text-yellow-950">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-yellow-700" />
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-lg border border-gray-100 bg-black p-6 text-white shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black">Apoiar é ajudar a manter a fiscalização pública viva.</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-300">
                O site continuará gratuito para consulta. A contribuição serve para manter desenvolvimento, validação de dados e melhoria contínua da plataforma.
              </p>
            </div>
            <Button asChild className="bg-yellow-400 font-black text-black hover:bg-yellow-300">
              <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
                Ir para o APOIA.se <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </section>
      </main>
    </div>
  </>
);

export default SupportPage;
