import { describe, expect, it } from 'vitest';
import {
  attachDeputyVoteToVoting,
  classifyVotingTopics,
  describeVotingForCitizen,
  findDeputyVoteRecord,
  getVotingRecordId,
  getVotingPropositionRecordId,
  normalizeVotingPropositionRecord,
  scoreVotingRelevance,
  selectRelevantVotacoes,
  summarizeDeputyVotes,
  isPlenaryVoting,
} from './vote-highlights';

const seguranca = {
  id: 'v1',
  siglaOrgao: 'PLEN',
  descricao: 'Votacao nominal sobre aumento de pena para crimes violentos',
  resultado: 'Aprovado',
  votosSim: 280,
  votosNao: 210,
};

const administrativo = {
  id: 'v2',
  siglaOrgao: 'COM',
  descricao: 'Requerimento administrativo interno',
  resultado: 'Aprovado',
};

describe('vote highlights', () => {
  it('classifies public security and penalty votes', () => {
    const topics = classifyVotingTopics(seguranca);

    expect(topics.map((topic) => topic.id)).toContain('seguranca_publica');
    expect(scoreVotingRelevance(seguranca)).toBeGreaterThan(scoreVotingRelevance(administrativo));
  });

  it('identifies plenary votes by official orgao id', () => {
    expect(isPlenaryVoting({ idOrgao: 180 })).toBe(true);
    expect(isPlenaryVoting({ idOrgao: 200 })).toBe(false);
  });

  it('selects relevant votes without duplicating ids', () => {
    const selected = selectRelevantVotacoes([administrativo, seguranca, seguranca], { limit: 5 });

    expect(selected).toHaveLength(1);
    expect(selected[0].id).toBe('v1');
    expect(selected[0].topics[0].label).toContain('Seguranca');
  });

  it('finds a deputy vote in official vote records', () => {
    const record = findDeputyVoteRecord(
      [
        { deputado_: { id: 10, nome: 'Outro' }, tipoVoto: 'Sim' },
        { deputado_: { id: 204536, nome: 'Kim Kataguiri', siglaPartido: 'MISSAO', siglaUf: 'SP' }, tipoVoto: 'Nao' },
      ],
      204536
    );

    expect(record).toMatchObject({
      deputyId: '204536',
      vote: 'Nao',
      party: 'MISSAO',
    });
  });

  it('normalizes annual file vote records', () => {
    const record = findDeputyVoteRecord(
      [
        {
          idVotacao: 'abc-1',
          deputado_id: 204536,
          deputado_nome: 'Kim Kataguiri',
          deputado_siglaPartido: 'MISSAO',
          deputado_siglaUf: 'SP',
          voto: 'Sim',
        },
      ],
      204536
    );

    expect(record).toMatchObject({
      deputyId: '204536',
      name: 'Kim Kataguiri',
      vote: 'Sim',
    });
    expect(getVotingRecordId(record.raw)).toBe('abc-1');
  });

  it('describes the main bill and popular topic for citizens', () => {
    const description = describeVotingForCitizen({
      descricao: 'Aprovada a Medida Provisoria n 1202/2023, sobre imposto e regras tributarias',
      proposicoesObjeto: [{ siglaTipo: 'MPV', numero: 1202, ano: 2023 }],
    });

    expect(description.title).toContain('MPV 1202/2023');
    expect(description.title).toContain('reforma tributaria ou impostos');
    expect(description.subtitle).toBe('Votacao nominal');
  });

  it('identifies amendments and keeps official description visible', () => {
    const description = describeVotingForCitizen({
      descricao: 'Aprovada a Emenda n 3, de 2024, sobre aumento de pena no Codigo Penal',
    });

    expect(description.title).toContain('EMENDA 3/2024');
    expect(description.title).toContain('aumento ou reducao de pena');
    expect(description.subtitle).toBe('Votacao de emenda');
    expect(description.rawDescription).toContain('Emenda n 3');
  });

  it('prefers the main project when amendments reference a bill', () => {
    const description = describeVotingForCitizen({
      descricao: 'Aprovadas as Emendas do Senado Federal ao Projeto de Lei no 327, de 2021, com excecao da Emenda n 3.',
    });

    expect(description.title).toContain('PL 327/2021');
    expect(description.subtitle).toBe('Votacao de emenda');
  });

  it('uses the national agenda registry when only the theme is visible', () => {
    const description = describeVotingForCitizen({
      descricao: 'Rejeitado o Requerimento sobre a Reforma Tributaria, IBS, CBS e Imposto Seletivo.',
    });

    expect(description.title).toContain('Reforma Tributária');
    expect(description.title).toContain('PEC 45/2019');
    expect(description.agenda.houve_voto_nominal).toBe('sim');
    expect(description.warnings.join(' ')).toContain('cadastro tematico');
  });

  it('uses official voting object relations before text inference', () => {
    const officialObject = normalizeVotingPropositionRecord({
      idVotacao: 'v3',
      idProposicao: 999,
      siglaTipo: 'PL',
      numero: 490,
      ano: 2007,
      ementa: 'Define regras para demarcacao de terras indigenas.',
    });
    const description = describeVotingForCitizen({
      descricao: 'Aprovada a Emenda n 3.',
      officialObjects: [officialObject],
    });

    expect(getVotingPropositionRecordId(officialObject.raw)).toBe('v3');
    expect(description.title).toContain('Marco Temporal');
    expect(description.matter.label).toBe('PL 490/2007');
    expect(description.matterConfidence).toBe('possible_official_object');
    expect(description.warnings.join(' ')).toContain('possivel objeto oficial');
  });

  it('attaches and summarizes votes without treating missing records as absence', () => {
    const attached = attachDeputyVoteToVoting(
      seguranca,
      [{ deputado_: { id: 204536 }, tipoVoto: 'Sim' }],
      204536
    );
    const missing = attachDeputyVoteToVoting(seguranca, [], 204536);
    const summary = summarizeDeputyVotes([attached, { deputyVote: { vote: 'Obstrucao' } }]);

    expect(attached.deputyVote.vote).toBe('Sim');
    expect(missing).toBeNull();
    expect(summary).toMatchObject({ total: 2, sim: 1, obstrucao: 1 });
  });
});
