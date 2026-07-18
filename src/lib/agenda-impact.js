const normalize = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toUpperCase();

const getStatus = (proposal = {}) => proposal?.statusProposicao?.descricaoSituacao
  || proposal?.statusProposicao?.descricaoTramitacao
  || proposal?.ultimoStatus?.descricaoSituacao
  || proposal?.ultimoStatus?.descricaoTramitacao
  || '';

const countParticipants = (votings = []) => new Set(
  votings.flatMap((voting) => (voting.votes || []).map((vote) => vote.deputyId || `${vote.name}-${vote.party}-${vote.state}`)).filter(Boolean)
).size;

const getProcedureDescription = (record = {}) =>
  record.descricaoTramitacao
  || record.descricaoSituacao
  || record.despacho
  || record.descricao
  || 'Movimentação sem descrição resumida';

const getProcedureDate = (record = {}) =>
  record.dataHora || record.data || record.dataTramitacao || '';

export const buildAgendaImpactEvidence = ({
  proposal,
  authors = [],
  votings = [],
  procedures = [],
  themes = [],
  related = [],
} = {}) => {
  if (!proposal) {
    return {
      status: 'unavailable',
      stage: 'Fonte não confirmou a proposição',
      evidence: [],
      warnings: ['Sem a proposição oficial, o FISCALIZA não calcula trajetória nem impacto.'],
    };
  }

  const officialStatus = getStatus(proposal);
  const procedureText = procedures.map(getProcedureDescription).join(' ');
  const normalizedStatus = normalize(`${officialStatus} ${procedureText}`);
  let stage = 'Em tramitação ou situação não conclusiva';
  let stageLevel = 'partial';

  if (['TRANSFORMADO EM NORMA', 'SANCIONAD', 'PROMULGAD'].some((term) => normalizedStatus.includes(term))) {
    stage = 'Resultado legislativo confirmado na fonte';
    stageLevel = 'confirmed';
  } else if (normalizedStatus.includes('APROVAD')) {
    stage = 'Aprovação registrada em etapa da tramitação';
    stageLevel = 'confirmed';
  } else if (['ARQUIVAD', 'REJEITAD', 'RETIRAD'].some((term) => normalizedStatus.includes(term))) {
    stage = 'Tramitação encerrada ou interrompida';
    stageLevel = 'confirmed';
  }

  const participantCount = countParticipants(votings);
  const voteRecordCount = votings.reduce((total, voting) => total + (voting.votes || []).length, 0);
  const evidence = [
    { label: 'Proposição oficial identificada', value: `${proposal.siglaTipo || ''} ${proposal.numero || ''}/${proposal.ano || ''}`.trim(), confirmed: true },
    { label: 'Autores retornados', value: authors.length ? String(authors.length) : 'Não retornado', confirmed: authors.length > 0 },
    { label: 'Votações nominais encontradas', value: String(votings.length), confirmed: votings.length > 0 },
    { label: 'Parlamentares identificados', value: participantCount ? String(participantCount) : 'Não retornado', confirmed: participantCount > 0 },
    { label: 'Registros individuais de voto', value: voteRecordCount ? String(voteRecordCount) : 'Não retornado', confirmed: voteRecordCount > 0 },
    { label: 'Movimentações oficiais', value: procedures.length ? String(procedures.length) : 'Não retornado', confirmed: procedures.length > 0 },
    { label: 'Temas oficiais', value: themes.length ? String(themes.length) : 'Não retornado', confirmed: themes.length > 0 },
  ];
  const timeline = procedures
    .map((item) => ({
      date: getProcedureDate(item),
      description: getProcedureDescription(item),
      organ: item.siglaOrgao || item.descricaoOrgao || item.regime || '',
    }))
    .filter((item) => item.date || item.description)
    .slice(-8)
    .reverse();
  const themeLabels = themes
    .map((item) => item.tema || item.descricao || item.nome)
    .filter(Boolean);

  return {
    status: stageLevel === 'confirmed' ? 'available' : 'partial',
    stage,
    officialStatus: officialStatus || 'Situação não informada',
    evidence,
    timeline,
    themes: themeLabels,
    relatedCount: related.length,
    calculationMethod: 'Classificação da situação atual e das movimentações retornadas pelo endpoint oficial de tramitações da proposição.',
    warnings: [
      'Trajetória legislativa não é o mesmo que impacto social.',
      'O FISCALIZA só poderá associar efeitos em saúde, educação ou economia quando houver base pública, período e local compatíveis.',
      related.length
        ? `${related.length} proposição(ões) relacionada(s) foram encontradas; relação não significa equivalência jurídica.`
        : 'A fonte não retornou proposições relacionadas nesta consulta.',
    ],
  };
};
