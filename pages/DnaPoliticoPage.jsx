import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildCivicAuditPlan, civicAuditQuestions } from '@/lib/civic-audit-plan';
import { polishText } from '@/lib/display-text';

const confidenceLabels = {
  high: 'Alta confiança',
  medium: 'Confiança limitada',
  low: 'Baixa confiança',
};

const DnaPoliticoPage = () => {
  const [step, setStep] = useState('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});

  const question = civicAuditQuestions[currentQuestion];
  const plan = useMemo(() => (step === 'results' ? buildCivicAuditPlan(answers) : null), [answers, step]);
  const progress = ((currentQuestion + 1) / civicAuditQuestions.length) * 100;

  const handleAnswer = (questionId, value) => {
    const nextAnswers = { ...answers, [questionId]: value };
    setAnswers(nextAnswers);

    if (currentQuestion < civicAuditQuestions.length - 1) {
      setCurrentQuestion((previous) => previous + 1);
      return;
    }

    setStep('results');
  };

  const restart = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setStep('intro');
  };

  return (
    <>
      <Helmet>
        <title>Meu Roteiro Cidadão - FISCALIZA</title>
        <meta
          name="description"
          content="Monte um roteiro de fiscalização cidadã sem afinidade inventada, com links para indicadores auditáveis e fontes oficiais."
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50 text-gray-900">
        <section className="border-b bg-white">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                  <ShieldCheck className="h-4 w-4" />
                  Sem match inventado
                </div>
                <h1 className="text-4xl font-black tracking-tight text-gray-950">Meu roteiro cidadão</h1>
                <p className="mt-4 text-lg leading-relaxed text-gray-600">
                  Responda três perguntas e receba um caminho de fiscalização baseado no que o FISCALIZA consegue mostrar com fonte. A ferramenta não mede ideologia, não recomenda parlamentar e não calcula afinidade política.
                </p>
              </div>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900 lg:max-w-sm">
                <div className="mb-2 flex items-center gap-2 font-bold">
                  <AlertTriangle className="h-4 w-4" />
                  Regra de confiabilidade
                </div>
                <p>
                  O resultado é um roteiro educativo. Toda conclusão sobre parlamentar deve vir dos cards com fonte oficial, data de consulta e método de cálculo.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          {step === 'intro' && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="rounded-lg border border-gray-200 bg-white p-7 shadow-sm">
                <ClipboardList className="h-12 w-12 text-blue-600" />
                <h2 className="mt-5 text-2xl font-black text-gray-950">Troque opinião solta por investigação verificável</h2>
                <p className="mt-3 leading-relaxed text-gray-600">
                  A versão antiga tentava cruzar respostas com perfil de partidos. Isso não era forte o suficiente para um site de fiscalização. Agora o caminho é mais honesto: você escolhe prioridade, recorte e profundidade, e o site aponta onde fiscalizar com dados auditáveis.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={() => setStep('quiz')}>
                    Montar meu roteiro
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/rankings">Ir direto aos rankings</Link>
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  'Não usa mapa ideológico por partido.',
                  'Não diz quem vota como você sem fonte nominal.',
                  'Não transforma ausência de dado em conclusão.',
                  'Aponta páginas com método, fonte e aviso de limite.',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-lg border border-green-100 bg-green-50 p-4 text-sm text-green-900">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'quiz' && question && (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-7 shadow-sm"
            >
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between gap-4 text-sm font-bold text-gray-500">
                  <span>Pergunta {currentQuestion + 1} de {civicAuditQuestions.length}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <h2 className="text-2xl font-black text-gray-950">{polishText(question.label)}</h2>
              <div className="mt-6 grid gap-3">
                {question.options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleAnswer(question.id, option.value)}
                    className="group rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-black text-gray-950">{polishText(option.label)}</p>
                        <p className="mt-1 text-sm text-gray-600">{polishText(option.description)}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 shrink-0 text-gray-400 transition group-hover:text-blue-600" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'results' && plan && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase text-blue-700">Resultado educativo</p>
                    <h2 className="mt-2 text-3xl font-black text-gray-950">{polishText(plan.title)}</h2>
                    <p className="mt-3 max-w-3xl leading-relaxed text-gray-700">{polishText(plan.summary)}</p>
                  </div>
                  <Button variant="outline" onClick={restart} className="bg-white">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Refazer
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                {plan.warnings.map((warning) => (
                  <div key={warning} className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{polishText(warning)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4">
                {plan.steps.map((item, index) => (
                  <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="grid gap-4 lg:grid-cols-[72px_1fr_190px] lg:items-start">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-xl font-black text-blue-700">
                        {index + 1}
                      </div>
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">
                            {confidenceLabels[item.confidenceLevel] || 'Confiança limitada'}
                          </span>
                          <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">
                            {polishText(item.sourceName)}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-gray-950">{polishText(item.title)}</h3>
                        <p className="mt-2 leading-relaxed text-gray-600">{polishText(item.description)}</p>
                        <details className="mt-3 text-sm text-gray-500">
                          <summary className="cursor-pointer font-bold text-gray-700">Como este passo foi escolhido</summary>
                          <p className="mt-1">{polishText(item.calculationMethod)}</p>
                        </details>
                      </div>
                      <Button asChild className="bg-blue-600 hover:bg-blue-700">
                        <Link to={item.link}>
                          {polishText(item.linkLabel)}
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default DnaPoliticoPage;
