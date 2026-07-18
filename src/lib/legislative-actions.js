const normalize = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toUpperCase();

const includesAny = (text, terms) => terms.some((term) => text.includes(term));

const resultText = (voting) => normalize([
  voting?.resultado,
  voting?.descricao,
  voting?.descricaoUltimaAberturaVotacao,
  voting?.proposicaoObjeto,
].filter(Boolean).join(' '));

const getVote = (voting) => normalize(voting?.deputyVote?.vote || voting?.voto || '');

export const classifyLegislativeAction = (voting = {}) => {
  const text = resultText(voting);
  const vote = getVote(voting);
  const totals = voting.totals || {};
  const margin = Math.abs(Number(totals.sim || 0) - Number(totals.nao || 0));
  const isRejected = includesAny(text, ['REJEITAD', 'NAO APROVAD']);
  const isApproved = includesAny(text, ['APROVAD']);
  const isChange = includesAny(text, ['EMENDA', 'DESTAQUE', 'SUBSTITUTIVO', 'TEXTO-BASE', 'TEXTO BASE']);
  const isDelay = includesAny(text, ['RETIRADA DE PAUTA', 'ADIAMENTO', 'INVERSAO DE PAUTA']);
  const isObstruction = vote.includes('OBSTRU') || text.includes('OBSTRUCAO');

  if (isObstruction) {
    return { type: 'obstruction', label: 'Obstrução registrada', explanation: 'A fonte oficial registrou obstrução nesta votação. Isso é uma atuação regimental e não prova, sozinha, que a proposta foi barrada.' };
  }
  if (isDelay && vote.includes('SIM')) {
    return { type: 'procedural', label: 'Apoiou medida para adiar ou retirar a pauta', explanation: 'O voto foi favorável a um requerimento de retirada, adiamento ou reorganização da pauta.' };
  }
  if (isRejected && vote.includes('NAO')) {
    return { type: 'contributed_to_rejection', label: 'Votou contra matéria rejeitada', explanation: 'O parlamentar votou “Não” e o resultado oficial indica rejeição. O FISCALIZA diz que o voto contribuiu para o resultado, não que o causou sozinho.' };
  }
  if (isApproved && vote.includes('SIM')) {
    return { type: 'supported_approval', label: 'Votou a favor de matéria aprovada', explanation: 'O parlamentar votou “Sim” e o resultado oficial indica aprovação.' };
  }
  if (isChange && (vote.includes('SIM') || vote.includes('NAO'))) {
    return { type: 'text_change', label: 'Participou de decisão sobre alteração do texto', explanation: 'A votação cita emenda, destaque ou substitutivo. O voto individual está registrado, mas é preciso ler o objeto oficial para saber o efeito jurídico exato.' };
  }
  if (margin > 0 && margin <= 5 && (vote.includes('SIM') || vote.includes('NAO'))) {
    return { type: 'close_vote', label: 'Votou em disputa apertada', explanation: `A diferença registrada entre “Sim” e “Não” foi de ${margin} voto(s). O voto individual integrou uma decisão apertada, sem ser chamado automaticamente de decisivo.` };
  }

  return { type: 'recorded_vote', label: 'Voto nominal registrado', explanation: 'A fonte oficial registra a posição individual nesta votação, sem evidência suficiente para afirmar que ela aprovou, barrou ou alterou a matéria.' };
};

export const buildLegislativeActionsSummary = (votings = []) => {
  const actions = votings.map((voting) => ({
    ...classifyLegislativeAction(voting),
    voting,
    sourceUrl: voting.sourceUrl || (voting.id ? `https://dadosabertos.camara.leg.br/api/v2/votacoes/${voting.id}/votos` : ''),
  }));

  const counts = actions.reduce((acc, action) => {
    acc[action.type] = (acc[action.type] || 0) + 1;
    return acc;
  }, {});

  return {
    status: actions.length ? 'partial' : 'unavailable',
    actions,
    counts,
    total: actions.length,
    calculationMethod: 'Classificação textual de um recorte de votos nominais oficiais. O resultado, o tipo de votação e o voto individual são usados apenas quando aparecem na fonte.',
    warnings: [
      'Este painel cobre o recorte de votações carregado no perfil, não toda a atuação anual.',
      'Contribuir para um resultado não significa causá-lo sozinho.',
    ],
  };
};
