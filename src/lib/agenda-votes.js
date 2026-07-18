const DEFAULT_OPTIONS = {
  batchSize: 4,
  maxCandidates: 30,
  maxNominalVotings: 8,
  maxSourceFailures: 3,
  maxEmptyVotings: 5,
};

const getNominalHintScore = (voting = {}) => {
  const text = [
    voting.descricao,
    voting.titulo,
    voting.tipoVotacao,
    voting.ultimaAberturaVotacao?.descricao,
  ]
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  if (text.includes('NOMINAL')) return 2;
  if (voting.aprovacao !== undefined || voting.resultado) return 1;
  return 0;
};

const prioritizeVotingCandidates = (votings = []) =>
  votings
    .filter((voting) => voting?.id)
    .map((voting, originalIndex) => ({ voting, originalIndex, score: getNominalHintScore(voting) }))
    .sort((a, b) => b.score - a.score || a.originalIndex - b.originalIndex)
    .map(({ voting }) => voting);

export const findVotingRecordsWithIndividualVotes = async (
  votingRecords = [],
  fetchVotes,
  options = {}
) => {
  const settings = { ...DEFAULT_OPTIONS, ...options };
  const candidates = prioritizeVotingCandidates(votingRecords).slice(0, settings.maxCandidates);
  const nominalVotings = [];
  const emptyVotings = [];
  let checked = 0;
  let failed = 0;

  for (let index = 0; index < candidates.length; index += settings.batchSize) {
    const batch = candidates.slice(index, index + settings.batchSize);
    const results = await Promise.all(
      batch.map(async (voting) => {
        try {
          const votes = (await fetchVotes(voting.id)) || [];
          const sourceError = votes.__meta?.error || '';
          return {
            ...voting,
            votes,
            voteLoadStatus: sourceError ? 'error' : votes.length ? 'nominal' : 'without_individual_records',
            voteLoadError: sourceError,
          };
        } catch (error) {
          const votes = [];
          votes.__meta = { error: error?.message || 'Falha ao consultar votos individuais.' };
          return {
            ...voting,
            votes,
            voteLoadStatus: 'error',
            voteLoadError: votes.__meta.error,
          };
        }
      })
    );

    checked += results.length;
    results.forEach((voting) => {
      if (voting.voteLoadStatus === 'nominal') nominalVotings.push(voting);
      else emptyVotings.push(voting);
      if (voting.voteLoadStatus === 'error') failed += 1;
    });

    if (nominalVotings.length >= settings.maxNominalVotings) break;
    if (failed >= settings.maxSourceFailures && nominalVotings.length === 0) break;
  }

  const displayed = nominalVotings.length
    ? nominalVotings.slice(0, settings.maxNominalVotings)
    : emptyVotings.slice(0, settings.maxEmptyVotings);

  displayed.__meta = {
    totalCandidates: votingRecords.filter((voting) => voting?.id).length,
    candidateLimit: settings.maxCandidates,
    checked,
    nominalVotings: nominalVotings.length,
    withoutIndividualRecords: emptyVotings.filter((voting) => voting.voteLoadStatus !== 'error').length,
    failed,
    stoppedAfterSourceFailures: failed >= settings.maxSourceFailures && nominalVotings.length === 0,
  };

  return displayed;
};

