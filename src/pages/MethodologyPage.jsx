import React from 'react';
import { Helmet } from 'react-helmet';
import { AlertTriangle, BookOpenCheck, Database, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { MANDATE_SCORE_COMPONENTS, SCORE_VERSION } from '@/lib/mandate-score';

const rules = [
  ['Dado oficial', 'É reproduzido de uma fonte pública identificada, com data de consulta e link.'],
  ['Indicador calculado', 'É produzido pelo FISCALIZA a partir de dados oficiais e sempre mostra a fórmula.'],
  ['Dado parcial', 'A fonte respondeu, mas não cobre todo o período, toda a Casa ou todas as etapas.'],
  ['Dado indisponível', 'A fonte não respondeu ou não sustenta a conclusão. Nenhum zero é inventado.'],
];

const MethodologyPage = () => (
  <div className="min-h-screen bg-gray-50 pb-16">
    <Helmet><title>Metodologia - FISCALIZA</title></Helmet>
    <div className="border-b bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-start gap-4">
          <BookOpenCheck className="mt-1 h-10 w-10 text-yellow-300" />
          <div>
            <p className="text-xs font-black uppercase text-yellow-300">Documento público · versão {SCORE_VERSION}</p>
            <h1 className="mt-1 text-4xl font-black">Como o FISCALIZA calcula e confere dados</h1>
            <p className="mt-3 max-w-4xl text-zinc-300">
              Esta página registra as regras usadas pelo site. Alterações relevantes de fórmula devem mudar a versão e permanecer explicadas aqui.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {rules.map(([title, description]) => (
          <Card key={title}><CardContent className="p-5"><h2 className="font-black text-gray-950">{title}</h2><p className="mt-2 text-sm leading-6 text-gray-600">{description}</p></CardContent></Card>
        ))}
      </section>

      <section className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
        <div className="flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-yellow-800" /><h2 className="text-2xl font-black text-gray-950">Nota do mandato · versão {SCORE_VERSION}</h2></div>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-gray-700">
          É um indicador do FISCALIZA, não uma nota oficial da Câmara. A nota só aparece com pelo menos 50% de cobertura e não mede honestidade, ideologia ou impacto social.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {MANDATE_SCORE_COMPONENTS.map((component) => (
            <div key={component.id} className="rounded-lg border border-yellow-200 bg-white p-4">
              <p className="text-xs font-black uppercase text-gray-500">{component.label}</p>
              <p className="mt-1 text-2xl font-black">{component.weight}%</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card><CardContent className="p-6"><div className="flex items-center gap-2"><Database className="h-5 w-5 text-yellow-700" /><h2 className="text-xl font-black">Fontes integradas</h2></div><ul className="mt-4 space-y-3 text-sm leading-6 text-gray-700"><li>Câmara dos Deputados: perfil, histórico, despesas CEAP, proposições, eventos, discursos, órgãos, votações e votos.</li><li>Portal do Deputado: totais anuais de propostas, relatorias, votações, discursos e presença.</li><li>Portal da Transparência da CGU: emendas, execução financeira, localidade e favorecido quando retornados.</li><li>Senado Federal: somente campos confirmados pela integração atual; demais indicadores ficam indisponíveis.</li></ul></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-700" /><h2 className="text-xl font-black">Limitações públicas</h2></div><ul className="mt-4 space-y-3 text-sm leading-6 text-gray-700"><li>Ausência de voto não é transformada em falta.</li><li>Proposta apresentada não é chamada de aprovada.</li><li>Proposta relatada não é chamada automaticamente de relatório aprovado.</li><li>Trajetória legislativa não é o mesmo que impacto social.</li><li>Rankings nacionais exigem base sincronizada suficientemente ampla.</li></ul></CardContent></Card>
      </section>

      <section className="rounded-lg border bg-white p-6">
        <h2 className="text-xl font-black">Histórico metodológico</h2>
        <div className="mt-4 border-l-2 border-yellow-400 pl-4">
          <p className="font-black">Versão {SCORE_VERSION}</p>
          <p className="mt-1 text-sm leading-6 text-gray-600">Pesos atuais da nota, cobertura mínima, auditoria de definições, contexto de mandato parcial, rede de fornecedores e trajetória oficial de proposições.</p>
        </div>
      </section>
    </div>
  </div>
);

export default MethodologyPage;
