import { agendaOfficialNumberLabels, findMajorAgendaForVoting } from '@/lib/major-agendas';

const normalize = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

export const VOTE_TOPIC_RULES = [
  {
    id: 'seguranca_publica',
    label: 'Seguranca publica e penas',
    keywords: [
      'SEGURANCA PUBLICA',
      'CODIGO PENAL',
      'PENA',
      'PENAS',
      'CRIME',
      'CRIMES',
      'PRISAO',
      'EXECUCAO PENAL',
      'SAIDINHA',
      'POLICIA',
      'HOMICIDIO',
      'FEMINICIDIO',
      'VIOLENCIA',
      'TRAFICO',
      'DROGAS',
      'ARMA',
      'ARMAS',
      'DESARMAMENTO',
      'ANTITERRORISMO',
    ],
  },
  {
    id: 'economia_impostos',
    label: 'Economia, impostos e gasto publico',
    keywords: [
      'IMPOSTO',
      'TRIBUT',
      'TAXA',
      'IOF',
      'ARCABOUCO',
      'ORCAMENTO',
      'DESPESA PUBLICA',
      'GASTO PUBLICO',
      'FISCAL',
      'DIVIDA',
      'SALARIO MINIMO',
      'SERVIDOR PUBLICO',
      'TETO',
      'REFORMA ADMINISTRATIVA',
      'REFORMA TRIBUTARIA',
    ],
  },
  {
    id: 'costumes_direitos',
    label: 'Direitos, costumes e liberdades',
    keywords: [
      'ABORTO',
      'LIBERDADE RELIGIOSA',
      'LIBERDADE DE EXPRESSAO',
      'CENSURA',
      'INTERNET',
      'REDES SOCIAIS',
      'CRIANCA',
      'ADOLESCENTE',
      'MULHER',
      'RACISMO',
      'LGBT',
      'INDIGENA',
      'DIREITOS HUMANOS',
    ],
  },
  {
    id: 'saude_educacao_social',
    label: 'Saude, educacao e programas sociais',
    keywords: [
      'SAUDE',
      'SUS',
      'EDUCACAO',
      'ENSINO',
      'ESCOLA',
      'UNIVERSIDADE',
      'BOLSA FAMILIA',
      'AUXILIO',
      'BENEFICIO',
      'PREVIDENCIA',
      'ASSISTENCIA SOCIAL',
      'MORADIA',
    ],
  },
  {
    id: 'meio_ambiente_agro',
    label: 'Meio ambiente, agro e energia',
    keywords: [
      'MEIO AMBIENTE',
      'AMBIENTAL',
      'LICENCIAMENTO',
      'AMAZONIA',
      'INDIGENA',
      'GARIMPO',
      'MINERACAO',
      'AGRO',
      'AGROPECUARIA',
      'RURAL',
      'ENERGIA',
      'COMBUSTIVEL',
      'PETROLEO',
    ],
  },
  {
    id: 'politica_institucional',
    label: 'Politica, eleicoes e instituicoes',
    keywords: [
      'ELEITORAL',
      'ELEICAO',
      'PARTIDO',
      'MANDATO',
      'IMPEACHMENT',
      'CONGRESSO',
      'SUPREMO',
      'STF',
      'DECRETO',
      'MEDIDA PROVISORIA',
      'PEC',
      'URGENCIA',
      'VOTO SECRETO',
    ],
  },
];

const collectVotingText = (votacao = {}) => {
  const directFields = [
    votacao.descricao,
    votacao.titulo,
    votacao.resultado,
    votacao.objeto,
    votacao.siglaOrgao,
    votacao.ultimaAberturaVotacao?.descricao,
    votacao.ultimaAberturaVotacao?.titulo,
    votacao.ultimaApresentacaoProposicao?.descricao,
    votacao.ultimaApresentacaoProposicao?.titulo,
    votacao.proposicaoObjeto?.ementa,
  ];

  const objectPropositions = [
    ...(Array.isArray(votacao.proposicoesObjeto) ? votacao.proposicoesObjeto : []),
    ...(Array.isArray(votacao.proposicoesAfetadas) ? votacao.proposicoesAfetadas : []),
  ].flatMap((item) => [item?.ementa, item?.descricao, item?.titulo, item?.siglaTipo]);

  return normalize([...directFields, ...objectPropositions].filter(Boolean).join(' '));
};

const collectRawVotingText = (votacao = {}) => {
  const fields = [
    votacao.descricao,
    votacao.titulo,
    votacao.resultado,
    votacao.objeto,
    votacao.ultimaAberturaVotacao?.descricao,
    votacao.ultimaAberturaVotacao?.titulo,
    votacao.ultimaApresentacaoProposicao?.descricao,
    votacao.ultimaApresentacaoProposicao?.titulo,
    votacao.proposicaoObjeto?.ementa,
    ...(Array.isArray(votacao.proposicoesObjeto) ? votacao.proposicoesObjeto : []).flatMap((item) => [
      item?.siglaTipo,
      item?.numero,
      item?.ano,
      item?.ementa,
      item?.descricao,
      item?.titulo,
    ]),
    ...(Array.isArray(votacao.proposicoesAfetadas) ? votacao.proposicoesAfetadas : []).flatMap((item) => [
      item?.siglaTipo,
      item?.numero,
      item?.ano,
      item?.ementa,
      item?.descricao,
      item?.titulo,
    ]),
  ];

  return fields.filter(Boolean).join(' ');
};

export const classifyVotingTopics = (votacao = {}) => {
  const text = collectVotingText(votacao);

  return VOTE_TOPIC_RULES
    .map((rule) => {
      const matchedKeywords = rule.keywords.filter((keyword) => text.includes(normalize(keyword)));
      return matchedKeywords.length
        ? { id: rule.id, label: rule.label, matchedKeywords }
        : null;
    })
    .filter(Boolean);
};

const extractMainMatterFromObjects = (votacao = {}) => {
  const candidates = [
    votacao.proposicaoObjeto,
    ...(Array.isArray(votacao.proposicoesObjeto) ? votacao.proposicoesObjeto : []),
    ...(Array.isArray(votacao.proposicoesAfetadas) ? votacao.proposicoesAfetadas : []),
  ].filter(Boolean);

  const candidate = candidates.find((item) => item.siglaTipo && (item.numero || item.ano || item.id));
  if (!candidate) return null;

  return {
    type: candidate.siglaTipo,
    number: candidate.numero ? String(candidate.numero) : '',
    year: candidate.ano ? String(candidate.ano) : '',
    id: candidate.id ? String(candidate.id) : '',
    label: `${candidate.siglaTipo}${candidate.numero ? ` ${candidate.numero}` : ''}${candidate.ano ? `/${candidate.ano}` : ''}`.trim(),
    source: 'proposicoesObjeto',
  };
};

const extractMainMatterFromText = (text = '') => {
  const cleanText = String(text || '');
  const searchableText = normalize(cleanText).replace(/[\u00ba\u00aa.]/g, ' ');
  const phrasePatterns = [
    { type: 'PLP', pattern: /\bPROJETO DE LEI COMPLEMENTAR\s*(?:N|NO|NUMERO)?\s*(\d{1,5})(?:(?:\s*\/\s*|\s*,?\s*DE\s*)(\d{2,4}))?/ },
    { type: 'PL', pattern: /\bPROJETO DE LEI\s*(?:N|NO|NUMERO)?\s*(\d{1,5})(?:(?:\s*\/\s*|\s*,?\s*DE\s*)(\d{2,4}))?/ },
    { type: 'PEC', pattern: /\bPROPOSTA DE EMENDA (?:A|A CONSTITUICAO|CONSTITUCIONAL)\s*(?:N|NO|NUMERO)?\s*(\d{1,5})(?:(?:\s*\/\s*|\s*,?\s*DE\s*)(\d{2,4}))?/ },
    { type: 'MPV', pattern: /\bMEDIDA PROVISORIA\s*(?:N|NO|NUMERO)?\s*(\d{1,5})(?:(?:\s*\/\s*|\s*,?\s*DE\s*)(\d{2,4}))?/ },
  ];

  for (const { type, pattern } of phrasePatterns) {
    const match = searchableText.match(pattern);
    if (match) {
      const number = match[1] || '';
      const year = match[2] || '';
      return {
        type,
        number,
        year,
        label: `${type} ${number}${year ? `/${year}` : ''}`,
        source: 'descricao',
      };
    }
  }

  const patterns = [
    /\b(PEC|PLP|PL|MPV|PDL|PRC|REQ|MSC|INC|EMC|EMP|DTQ)\s*[-.]?\s*(\d{1,5})(?:\s*\/\s*(\d{2,4}))?/i,
    /\b(Emenda|Subemenda|Destaque|Requerimento)\s*(?:n(?:o|\u00ba|\.)*)?\s*(\d{1,5})(?:\s*\/\s*(\d{2,4}))?/i,
  ];

  for (const pattern of patterns) {
    const match = searchableText.match(pattern);
    if (match) {
      const type = match[1].toUpperCase();
      const number = match[2] || '';
      const afterMatch = cleanText.slice((match.index || 0) + match[0].length, (match.index || 0) + match[0].length + 24);
      const nearbyYear = afterMatch.match(/\bde\s*(\d{4})\b/i)?.[1] || '';
      const year = match[3] || nearbyYear;
      return {
        type,
        number,
        year,
        label: `${type} ${number}${year ? `/${year}` : ''}`,
        source: 'descricao',
      };
    }
  }

  return null;
};

const inferPopularName = (votacao = {}) => {
  const text = collectVotingText(votacao);
  const candidates = [
    ['saida temporaria', ['SAIDINHA', 'SAIDA TEMPORARIA']],
    ['aumento ou reducao de pena', ['PENA', 'CODIGO PENAL', 'EXECUCAO PENAL']],
    ['seguranca publica', ['SEGURANCA PUBLICA', 'POLICIA', 'CRIME', 'CRIMES', 'VIOLENCIA']],
    ['armas e desarmamento', ['ARMA', 'ARMAS', 'DESARMAMENTO']],
    ['reforma tributaria ou impostos', ['REFORMA TRIBUTARIA', 'IMPOSTO', 'TRIBUT', 'TAXA']],
    ['arcabouco fiscal e gasto publico', ['ARCABOUCO', 'ORCAMENTO', 'DESPESA PUBLICA', 'FISCAL']],
    ['redes sociais e liberdade de expressao', ['REDES SOCIAIS', 'INTERNET', 'LIBERDADE DE EXPRESSAO', 'CENSURA']],
    ['aborto', ['ABORTO']],
    ['direitos de mulheres, criancas ou minorias', ['MULHER', 'CRIANCA', 'ADOLESCENTE', 'RACISMO', 'LGBT']],
    ['saude publica', ['SAUDE', 'SUS']],
    ['educacao', ['EDUCACAO', 'ENSINO', 'ESCOLA', 'UNIVERSIDADE']],
    ['meio ambiente e licenciamento', ['MEIO AMBIENTE', 'AMBIENTAL', 'LICENCIAMENTO', 'AMAZONIA']],
    ['agro, mineracao ou energia', ['AGRO', 'RURAL', 'MINERACAO', 'GARIMPO', 'ENERGIA', 'PETROLEO']],
    ['eleicoes e regras politicas', ['ELEITORAL', 'ELEICAO', 'PARTIDO', 'MANDATO']],
  ];

  const found = candidates.find(([, keywords]) => keywords.some((keyword) => text.includes(keyword)));
  return found?.[0] || '';
};

const inferVotingAction = (text = '') => {
  const normalized = normalize(text);
  if (normalized.includes('EMENDA')) return 'Votacao de emenda';
  if (normalized.includes('DESTAQUE')) return 'Votacao de destaque';
  if (normalized.includes('REQUERIMENTO')) return 'Votacao de requerimento';
  if (normalized.includes('TURNO')) return 'Votacao em turno';
  if (normalized.includes('REDACAO FINAL')) return 'Votacao de redacao final';
  if (normalized.includes('MERITO')) return 'Votacao de merito';
  return 'Votacao nominal';
};

export const describeVotingForCitizen = (votacao = {}) => {
  const rawText = collectRawVotingText(votacao);
  const officialObject = (votacao.officialObjects || [])[0] || null;
  const officialAffected = (votacao.affectedPropositions || [])[0] || null;
  const matter =
    officialObject ||
    officialAffected ||
    extractMainMatterFromObjects(votacao) ||
    extractMainMatterFromText(rawText);
  const agenda = findMajorAgendaForVoting({ matter, text: rawText });
  const agendaNumbers = agendaOfficialNumberLabels(agenda);
  const popularName = agenda?.apelido_pauta || inferPopularName(votacao);
  const action = inferVotingAction(rawText);
  const fallbackTitle =
    votacao.descricao ||
    votacao.ultimaAberturaVotacao?.descricao ||
    votacao.ultimaApresentacaoProposicao?.descricao ||
    'Votacao sem descricao resumida';

  const matterLabel = matter?.label || agendaNumbers.join(' / ') || 'Materia nao identificada';
  const title = agenda
    ? `${agenda.apelido_pauta} (${agendaNumbers.join(' / ') || matterLabel})`
    : [matterLabel, popularName ? `tema: ${popularName}` : ''].filter(Boolean).join(' - ');
  const matterConfidence = officialObject
    ? 'possible_official_object'
    : officialAffected
      ? 'officially_affected'
      : matter
        ? 'inferred_from_description'
        : 'unknown';

  return {
    title,
    subtitle: action,
    matter,
    officialObjects: votacao.officialObjects || [],
    affectedPropositions: votacao.affectedPropositions || [],
    matterConfidence,
    agenda,
    popularName,
    action,
    rawDescription: fallbackTitle,
    warnings: [
      ...(!matter && !agenda ? ['Nao foi possivel identificar o numero da materia na resposta oficial.'] : []),
      ...(matterConfidence === 'possible_official_object' ? ['A Camara informa esta proposicao como possivel objeto oficial da votacao.'] : []),
      ...(matterConfidence === 'officially_affected' ? ['A Camara informa esta proposicao como afetada pela votacao; pode nao ser o objeto exato votado.'] : []),
      ...(matterConfidence === 'inferred_from_description' ? ['Materia identificada a partir do texto da votacao, nao por vinculo estruturado de proposicao.'] : []),
      ...(!matter && agenda ? ['Pauta reconhecida por cadastro tematico; o numero especifico da votacao nao apareceu claramente na descricao oficial.'] : []),
      ...(!popularName ? ['Sem nome popular confirmado; o tema foi exibido apenas pelos dados oficiais disponiveis.'] : []),
    ],
  };
};

const parseNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const extractVotingTotals = (votacao = {}) => {
  const sim = parseNumber(votacao.votosSim ?? votacao.votosFavoraveis ?? votacao.sim);
  const nao = parseNumber(votacao.votosNao ?? votacao.votosContrarios ?? votacao.nao);
  const abstencao = parseNumber(votacao.votosAbstencao ?? votacao.abstencoes);
  const obstrucao = parseNumber(votacao.votosObstrucao ?? votacao.obstrucoes);
  const outros = parseNumber(votacao.votosOutros ?? votacao.outros);
  const total = parseNumber(votacao.totalVotos ?? votacao.quorum) || sim + nao + abstencao + obstrucao + outros;

  return { sim, nao, abstencao, obstrucao, outros, total };
};

export const isPlenaryVoting = (votacao = {}) => {
  const text = normalize(`${votacao.siglaOrgao || ''} ${votacao.nomeOrgao || ''}`);
  const idOrgao = String(votacao.idOrgao || votacao.orgao?.id || '');
  return idOrgao === '180' || text.includes('PLEN') || text.includes('PLENARIO');
};

export const scoreVotingRelevance = (votacao = {}) => {
  const topics = classifyVotingTopics(votacao);
  const totals = extractVotingTotals(votacao);
  const text = collectVotingText(votacao);

  let score = 0;

  score += topics.length * 35;
  if (isPlenaryVoting(votacao)) score += 20;
  if (totals.total >= 400) score += 18;
  else if (totals.total >= 250) score += 10;

  const simNaoTotal = totals.sim + totals.nao;
  if (simNaoTotal > 0) {
    const margin = Math.abs(totals.sim - totals.nao) / simNaoTotal;
    if (margin <= 0.12) score += 14;
    else if (margin <= 0.25) score += 8;
  }

  if (text.includes('PEC')) score += 10;
  if (text.includes('PLP')) score += 8;
  if (text.includes('MPV') || text.includes('MEDIDA PROVISORIA')) score += 8;
  if (text.includes('URGENCIA')) score += 6;

  return score;
};

const getVotingDate = (votacao = {}) =>
  votacao.dataHoraRegistro || votacao.data || votacao.dataHora || votacao.dataHoraAbertura || '';

export const selectRelevantVotacoes = (votacoes = [], options = {}) => {
  const { limit = 24, includeFallback = true } = options;
  const unique = new Map();

  votacoes.forEach((votacao) => {
    if (votacao?.id && !unique.has(String(votacao.id))) {
      unique.set(String(votacao.id), votacao);
    }
  });

  const scored = Array.from(unique.values())
    .map((votacao) => ({
      ...votacao,
      topics: classifyVotingTopics(votacao),
      relevanceScore: scoreVotingRelevance(votacao),
    }))
    .filter((votacao) => votacao.relevanceScore > 0)
    .sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
      return String(getVotingDate(b)).localeCompare(String(getVotingDate(a)));
    });

  if (scored.length || !includeFallback) {
    return scored.slice(0, limit);
  }

  return Array.from(unique.values())
    .filter(isPlenaryVoting)
    .sort((a, b) => String(getVotingDate(b)).localeCompare(String(getVotingDate(a))))
    .slice(0, limit)
    .map((votacao) => ({
      ...votacao,
      topics: [],
      relevanceScore: 1,
    }));
};

export const normalizeDeputyVoteRecord = (record = {}) => {
  const deputado = record.deputado_ || record.deputado || record.parlamentar || {};
  const id =
    deputado.id ??
    deputado.idDeputado ??
    record.idDeputado ??
    record.deputado_id ??
    record.deputadoId ??
    record.idParlamentar ??
    record.parlamentarId;

  return {
    deputyId: id ? String(id) : '',
    name: deputado.nome || deputado.nomeEleitoral || record.nome || record.nomeDeputado || record.deputado_nome || '',
    party: deputado.siglaPartido || record.siglaPartido || record.deputado_siglaPartido || '',
    state: deputado.siglaUf || deputado.uf || record.siglaUf || record.uf || record.deputado_siglaUf || '',
    vote: record.tipoVoto || record.voto || record.valorVoto || record.opcao || '',
    votedAt: record.dataRegistroVoto || record.dataHoraRegistro || record.dataHoraVoto || record.data || '',
    raw: record,
  };
};

export const getVotingRecordId = (record = {}) =>
  String(record.idVotacao || record.votacao_id || record.id_votacao || record.votacao?.id || '');

export const normalizeVotingPropositionRecord = (record = {}) => {
  const proposicao = record.proposicao || {};
  const type = record.siglaTipo || record.proposicao_siglaTipo || proposicao.siglaTipo || record.tipo || '';
  const number = record.numero || record.proposicao_numero || proposicao.numero || '';
  const year = record.ano || record.proposicao_ano || proposicao.ano || '';
  const id =
    record.idProposicao ||
    record.proposicao_id ||
    proposicao.id ||
    record.uriProposicao?.match(/\/proposicoes\/(\d+)/)?.[1] ||
    '';
  const label = type
    ? `${type}${number ? ` ${number}` : ''}${year ? `/${year}` : ''}`.trim()
    : '';

  return {
    id: id ? String(id) : '',
    type,
    number: number ? String(number) : '',
    year: year ? String(year) : '',
    label,
    ementa: record.ementa || record.proposicao_ementa || proposicao.ementa || record.descricao || record.titulo || '',
    uri:
      record.uriProposicao ||
      record.proposicao_uri ||
      proposicao.uri ||
      (id ? `https://dadosabertos.camara.leg.br/api/v2/proposicoes/${id}` : ''),
    effect: record.efeito || record.descricaoEfeito || record.descricao || '',
    raw: record,
  };
};

export const getVotingPropositionRecordId = (record = {}) =>
  String(record.idVotacao || record.votacao_id || record.id_votacao || record.votacao?.id || '');

export const findDeputyVoteRecord = (records = [], deputadoId) => {
  const expectedId = String(deputadoId || '');
  if (!expectedId) return null;

  return records
    .map(normalizeDeputyVoteRecord)
    .find((record) => String(record.deputyId) === expectedId) || null;
};

export const attachDeputyVoteToVoting = (votacao, records = [], deputadoId) => {
  const deputyVote = findDeputyVoteRecord(records, deputadoId);
  if (!deputyVote) return null;

  return {
    ...votacao,
    deputyVote,
    topics: votacao.topics || classifyVotingTopics(votacao),
    relevanceScore: votacao.relevanceScore ?? scoreVotingRelevance(votacao),
    totals: extractVotingTotals(votacao),
  };
};

export const summarizeDeputyVotes = (votacoes = []) =>
  votacoes.reduce(
    (acc, votacao) => {
      const vote = normalize(votacao.deputyVote?.vote);
      if (vote.includes('SIM')) acc.sim += 1;
      else if (vote.includes('NAO')) acc.nao += 1;
      else if (vote.includes('ABST')) acc.abstencao += 1;
      else if (vote.includes('OBSTRU')) acc.obstrucao += 1;
      else acc.outros += 1;
      acc.total += 1;
      return acc;
    },
    { total: 0, sim: 0, nao: 0, abstencao: 0, obstrucao: 0, outros: 0 }
  );
