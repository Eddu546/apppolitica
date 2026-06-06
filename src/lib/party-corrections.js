const PARTY_CORRECTIONS_BY_CAMARA_ID = {
  '204536': {
    party: 'MISSÃO',
    sourceName: 'Camara dos Deputados - Perfil parlamentar',
    sourceUrl: 'https://www.camara.leg.br/deputados/204536',
    reason: 'A pagina oficial da Camara informa Kim Kataguiri como MISSÃO-SP.',
  },
};

export const getPartyCorrectionByCamaraId = (id) =>
  PARTY_CORRECTIONS_BY_CAMARA_ID[String(id)] || null;

export const getCorrectedPartyForCamaraId = (id, fallbackParty) =>
  getPartyCorrectionByCamaraId(id)?.party || fallbackParty || '';

export const applyPartyCorrectionToDeputy = (deputado) => {
  if (!deputado) return deputado;
  const correction = getPartyCorrectionByCamaraId(deputado.id);
  if (!correction) return deputado;

  return {
    ...deputado,
    siglaPartido: correction.party,
    partido: correction.party,
    partyCorrection: correction,
  };
};

export const applyPartyCorrectionToDeputadoInfo = (deputado) => {
  if (!deputado) return deputado;
  const id = deputado.ultimoStatus?.id || deputado.id;
  const correction = getPartyCorrectionByCamaraId(id);
  if (!correction) return deputado;

  return {
    ...deputado,
    siglaPartido: correction.party,
    partido: correction.party,
    partyCorrection: correction,
    ultimoStatus: deputado.ultimoStatus
      ? {
        ...deputado.ultimoStatus,
        siglaPartido: correction.party,
        partyCorrection: correction,
      }
      : deputado.ultimoStatus,
  };
};

export const applyPartyCorrectionToSummary = (summary) => {
  if (!summary) return summary;
  const correction = getPartyCorrectionByCamaraId(summary.deputado_id);
  if (!correction) return summary;

  return {
    ...summary,
    partido: correction.party,
    partyCorrection: correction,
  };
};
