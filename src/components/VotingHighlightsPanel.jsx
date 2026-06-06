import React from 'react';
import { AlertTriangle, ExternalLink, ListChecks } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { describeVotingForCitizen } from '@/lib/vote-highlights';

const voteClass = (vote = '') => {
  const normalized = String(vote).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  if (normalized.includes('SIM')) return 'bg-green-50 text-green-700 border-green-200';
  if (normalized.includes('NAO')) return 'bg-red-50 text-red-700 border-red-200';
  if (normalized.includes('OBSTRU')) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  if (normalized.includes('ABST')) return 'bg-gray-50 text-gray-700 border-gray-200';
  return 'bg-blue-50 text-blue-700 border-blue-200';
};

const formatDate = (value) => {
  if (!value) return 'Data nao informada';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value).slice(0, 10);
  return parsed.toLocaleDateString('pt-BR');
};

const formatNumber = (value) => Number(value || 0).toLocaleString('pt-BR');

const propositionUrl = (proposition) =>
  proposition?.id
    ? `https://www.camara.leg.br/propostas-legislativas/${proposition.id}`
    : proposition?.uri || '';

const VoteSummary = ({ summary }) => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
    {[
      ['Sim', summary?.sim],
      ['Nao', summary?.nao],
      ['Abstencao', summary?.abstencao],
      ['Obstrucao', summary?.obstrucao],
      ['Outros', summary?.outros],
    ].map(([label, value]) => (
      <div key={label} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
        <p className="text-xs font-bold uppercase text-gray-500">{label}</p>
        <p className="text-xl font-black text-gray-900">{formatNumber(value)}</p>
      </div>
    ))}
  </div>
);

const VotingHighlightsPanel = ({ votacoes = [], ano, metric }) => {
  const summary = metric?.breakdown || {};
  const meta = votacoes.__meta || {};

  return (
    <div className="space-y-5">
      <Card className="border-blue-100 bg-blue-50">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-800">
                <ListChecks className="h-5 w-5" />
                Votacoes nominais relevantes em {ano}
              </div>
              <p className="max-w-4xl text-sm leading-relaxed text-blue-950">
                Este painel mostra um recorte de votacoes nominais abertas que geram mais interesse publico, como seguranca, penas, economia, direitos, saude, educacao, meio ambiente e temas institucionais. Ele nao tenta listar todas as votacoes do ano.
              </p>
            </div>
            <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-bold text-blue-700">
              Fonte: Dados Abertos da Camara
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 text-sm text-yellow-950">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              A propria documentacao da Camara informa que o endpoint de votos por votacao nao lista deputados ausentes. Por isso, esta tela mostra apenas voto registrado; ela nao transforma ausencia de registro em falta.
            </p>
          </div>
        </CardContent>
      </Card>

      <VoteSummary summary={summary} />

      {votacoes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ListChecks className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <h2 className="text-lg font-black text-gray-900">Nenhuma votacao relevante com voto registrado foi encontrada</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
              Isso pode significar que a API nao retornou votos para o recorte selecionado, que o parlamentar nao aparece nos registros consultados ou que as votacoes mais relevantes do periodo nao tinham voto nominal aberto disponivel.
            </p>
            <div className="mx-auto mt-5 grid max-w-4xl gap-3 text-left text-xs text-gray-600 sm:grid-cols-5">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="font-bold text-gray-900">Plenario retornado</p>
                <p>{formatNumber(meta.totalPlenaryCandidates)} votacoes candidatas</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="font-bold text-gray-900">Base geral retornada</p>
                <p>{formatNumber(meta.totalGeneralCandidates)} votacoes candidatas</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="font-bold text-gray-900">Candidatas checadas</p>
                <p>{formatNumber(meta.totalCandidatesChecked)} com busca de votos</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="font-bold text-gray-900">Arquivo anual</p>
                <p>{meta.annualVotingFileUsed ? 'Usado' : 'Nao usado'}; votos do deputado: {formatNumber(meta.annualVoteRecordsForDeputy)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="font-bold text-gray-900">Proposicoes ligadas</p>
                <p>{formatNumber(meta.votingObjectRelations)} objetos; {formatNumber(meta.affectedPropositionRelations)} afetadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {votacoes.map((votacao) => {
            const vote = votacao.deputyVote?.vote || 'Voto nao informado';
            const totals = votacao.totals || {};
            const topics = votacao.topics || [];
            const citizenDescription = describeVotingForCitizen(votacao);

            return (
              <Card key={votacao.id}>
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-xs font-black ${voteClass(vote)}`}>
                          Voto: {vote}
                        </span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                          {formatDate(votacao.dataHoraRegistro || votacao.data)}
                        </span>
                        {topics.map((topic) => (
                          <span key={topic.id} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                            {topic.label}
                          </span>
                        ))}
                        {citizenDescription.matter?.label && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            {citizenDescription.matter.label}
                          </span>
                        )}
                        {citizenDescription.agenda && (
                          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                            Pauta nacional cadastrada
                          </span>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-black uppercase text-gray-500">{citizenDescription.subtitle}</p>
                        <h3 className="mt-1 text-lg font-black text-gray-950">{citizenDescription.title}</h3>
                        {citizenDescription.agenda && (
                          <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm leading-relaxed text-indigo-950">
                            <p className="font-bold">Resumo da pauta: {citizenDescription.agenda.resumo_curto}</p>
                            <p className="mt-1">
                              Voto nominal na pauta: {citizenDescription.agenda.houve_voto_nominal}.
                              {citizenDescription.agenda.observacao_voto ? ` ${citizenDescription.agenda.observacao_voto}` : ''}
                            </p>
                          </div>
                        )}
                        {citizenDescription.rawDescription && (
                          <p className="mt-2 text-sm leading-relaxed text-gray-700">
                            Descricao oficial: {citizenDescription.rawDescription}
                          </p>
                        )}
                        {votacao.resultado && (
                          <p className="mt-2 text-sm leading-relaxed text-gray-600">{votacao.resultado}</p>
                        )}
                      </div>

                      {citizenDescription.warnings.length > 0 && (
                        <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-3 text-xs leading-relaxed text-yellow-900">
                          {citizenDescription.warnings.join(' ')}
                        </div>
                      )}

                      {citizenDescription.matter && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-800">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-xs font-black uppercase text-slate-500">
                                {citizenDescription.matterConfidence === 'possible_official_object'
                                  ? 'Possivel objeto oficial da votacao'
                                  : citizenDescription.matterConfidence === 'officially_affected'
                                    ? 'Proposicao afetada pela votacao'
                                    : 'Materia identificada no texto'}
                              </p>
                              <p className="mt-1 font-black text-slate-950">{citizenDescription.matter.label || 'Materia sem numero informado'}</p>
                              {citizenDescription.matter.ementa && (
                                <p className="mt-1 text-slate-700">{citizenDescription.matter.ementa}</p>
                              )}
                            </div>
                            {propositionUrl(citizenDescription.matter) && (
                              <a
                                href={propositionUrl(citizenDescription.matter)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
                              >
                                Ver proposicao <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {citizenDescription.affectedPropositions.length > 1 && (
                        <details className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600">
                          <summary className="cursor-pointer font-bold text-gray-800">
                            Outras proposicoes relacionadas ({citizenDescription.affectedPropositions.length - 1})
                          </summary>
                          <div className="mt-2 grid gap-2">
                            {citizenDescription.affectedPropositions.slice(1, 6).map((item, itemIndex) => (
                              <div key={`${item.id || item.label}-${itemIndex}`} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <span>
                                  <strong>{item.label || 'Proposicao sem numero'}</strong>
                                  {item.effect ? ` - ${item.effect}` : ''}
                                </span>
                                {propositionUrl(item) && (
                                  <a href={propositionUrl(item)} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-700 hover:underline">
                                    abrir
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </details>
                      )}

                      {(totals.sim || totals.nao || totals.abstencao || totals.obstrucao || totals.total) && (
                        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                          <span className="rounded bg-gray-50 px-2 py-1">Sim: {formatNumber(totals.sim)}</span>
                          <span className="rounded bg-gray-50 px-2 py-1">Nao: {formatNumber(totals.nao)}</span>
                          <span className="rounded bg-gray-50 px-2 py-1">Abstencao: {formatNumber(totals.abstencao)}</span>
                          <span className="rounded bg-gray-50 px-2 py-1">Obstrucao: {formatNumber(totals.obstrucao)}</span>
                        </div>
                      )}

                      <details className="text-xs text-gray-500">
                        <summary className="cursor-pointer font-bold text-gray-700">Por que apareceu neste recorte?</summary>
                        <p className="mt-1">
                          Pontuacao de relevancia: {formatNumber(votacao.relevanceScore)}. O recorte considera tema, Plenario, volume de votos, margem apertada e tipo da materia quando essas informacoes aparecem nos dados oficiais.
                        </p>
                      </details>
                    </div>

                    <Button asChild variant="outline" className="shrink-0">
                      <a href={votacao.sourceUrl || `https://dadosabertos.camara.leg.br/api/v2/votacoes/${votacao.id}/votos`} target="_blank" rel="noopener noreferrer">
                        Fonte <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VotingHighlightsPanel;
