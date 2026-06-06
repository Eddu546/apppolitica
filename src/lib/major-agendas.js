const normalize = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

export const MAJOR_AGENDAS = [
  {
    id: 'reforma-previdencia',
    apelido_pauta: 'Reforma da Previdência',
    numero_proposicao: ['PEC 6/2019'],
    tipo: 'PEC',
    ano_pauta: 2019,
    tema: 'economia',
    resumo_curto: 'Mudança nas regras de aposentadoria, idade mínima, transição e benefícios. Virou a EC 103/2019.',
    houve_voto_nominal: 'sim',
    observacao_voto: 'Votações nominais ocorreram em etapas da tramitação da PEC.',
    keywords: [
      ['REFORMA DA PREVIDENCIA'],
      ['APOSENTADORIA', 'IDADE MINIMA'],
      ['EC 103', 'PREVIDENCIA'],
    ],
  },
  {
    id: 'pacote-anticrime',
    apelido_pauta: 'Pacote Anticrime / endurecimento penal',
    numero_proposicao: ['PL 10372/2018'],
    tipo: 'PL',
    ano_pauta: 2018,
    tema: 'seguranca',
    resumo_curto: 'Combate ao crime organizado, tráfico, milícias, crimes violentos e crimes hediondos. Originou a Lei 13.964/2019.',
    houve_voto_nominal: 'sim',
    observacao_voto: 'Pode aparecer como votação do projeto, substitutivo, destaques ou emendas.',
    keywords: [
      ['ANTICRIME'],
      ['CRIME ORGANIZADO', 'MILICIA'],
      ['CRIMES HEDIONDOS'],
    ],
  },
  {
    id: 'marco-saneamento',
    apelido_pauta: 'Novo Marco do Saneamento',
    numero_proposicao: ['PL 4162/2019'],
    tipo: 'PL',
    ano_pauta: 2019,
    tema: 'economia',
    resumo_curto: 'Mudança nas regras do saneamento básico, abrindo mais espaço para concessões e iniciativa privada.',
    houve_voto_nominal: 'sim',
    observacao_voto: 'Pode aparecer como projeto, substitutivo ou destaques relacionados ao saneamento.',
    keywords: [
      ['MARCO DO SANEAMENTO'],
      ['SANEAMENTO BASICO'],
      ['CONCESSOES', 'SANEAMENTO'],
    ],
  },
  {
    id: 'pec-precatorios',
    apelido_pauta: 'PEC dos Precatórios / Auxílio Brasil',
    numero_proposicao: ['PEC 23/2021'],
    tipo: 'PEC',
    ano_pauta: 2021,
    tema: 'economia',
    resumo_curto: 'Mudou o regime de pagamento de precatórios e abriu espaço fiscal para ampliar o Auxílio Brasil. Relacionada às ECs 113/2021 e 114/2021.',
    houve_voto_nominal: 'sim',
    observacao_voto: 'Pode aparecer como votação em primeiro/segundo turno e destaques.',
    keywords: [
      ['PRECATORIOS'],
      ['AUXILIO BRASIL'],
      ['EC 113'],
      ['EC 114'],
    ],
  },
  {
    id: 'marco-temporal',
    apelido_pauta: 'Marco Temporal das Terras Indígenas',
    numero_proposicao: ['PL 490/2007'],
    tipo: 'PL',
    ano_pauta: 2007,
    tema: 'meio ambiente',
    resumo_curto: 'Define regras para demarcação de terras indígenas, com tese de ocupação em 5/10/1988.',
    houve_voto_nominal: 'sim',
    observacao_voto: 'Foi aprovado na Câmara em 2023; pode aparecer como PL, substitutivo ou destaques.',
    keywords: [
      ['MARCO TEMPORAL'],
      ['TERRAS INDIGENAS'],
      ['DEMARCACAO', 'INDIGENA'],
    ],
  },
  {
    id: 'pl-fake-news',
    apelido_pauta: 'PL das Fake News / regulação das redes sociais',
    numero_proposicao: ['PL 2630/2020'],
    tipo: 'PL',
    ano_pauta: 2020,
    tema: 'internet',
    resumo_curto: 'Lei Brasileira de Liberdade, Responsabilidade e Transparência na Internet. Debate sobre plataformas, moderação, liberdade de expressão e desinformação.',
    houve_voto_nominal: 'parcial',
    observacao_voto: 'Nem toda movimentação da pauta tem voto nominal individual; requer leitura da descrição oficial.',
    keywords: [
      ['FAKE NEWS'],
      ['DESINFORMACAO', 'PLATAFORMAS'],
      ['REDES SOCIAIS', 'MODERACAO'],
      ['LIBERDADE', 'RESPONSABILIDADE', 'INTERNET'],
    ],
  },
  {
    id: 'arcabouco-fiscal',
    apelido_pauta: 'Novo Arcabouço Fiscal',
    numero_proposicao: ['PLP 93/2023'],
    tipo: 'PLP',
    ano_pauta: 2023,
    tema: 'economia',
    resumo_curto: 'Substituiu o teto de gastos por um novo regime fiscal. Virou a LC 200/2023.',
    houve_voto_nominal: 'sim',
    observacao_voto: 'Pode aparecer como PLP, destaques ou emendas relacionados ao regime fiscal.',
    keywords: [
      ['ARCOBOUCO FISCAL'],
      ['ARCABOUCO FISCAL'],
      ['REGIME FISCAL'],
      ['TETO DE GASTOS'],
      ['LC 200'],
    ],
  },
  {
    id: 'reforma-tributaria',
    apelido_pauta: 'Reforma Tributária',
    numero_proposicao: ['PEC 45/2019', 'PLP 68/2024'],
    tipo: 'PEC / PLP',
    ano_pauta: 2019,
    tema: 'economia',
    resumo_curto: 'A PEC virou a EC 132/2023, criando a base da reforma do consumo. O PLP 68/2024 regulamenta IBS, CBS e Imposto Seletivo.',
    houve_voto_nominal: 'sim',
    observacao_voto: 'Pode aparecer como PEC, PLP, emendas, destaques ou requerimentos da pauta tributária.',
    keywords: [
      ['REFORMA TRIBUTARIA'],
      ['IBS', 'CBS'],
      ['IMPOSTO SELETIVO'],
      ['EC 132'],
      ['TRIBUTARIA', 'CONSUMO'],
    ],
  },
  {
    id: 'taxa-blusinhas',
    apelido_pauta: 'Taxa das Blusinhas / imposto da Shopee, Shein e AliExpress',
    numero_proposicao: ['PL 914/2024'],
    tipo: 'PL',
    ano_pauta: 2024,
    tema: 'economia',
    resumo_curto: 'Projeto do Programa Mover que incluiu taxação de compras internacionais de até US$ 50.',
    houve_voto_nominal: 'parcial',
    observacao_voto: 'A votação principal da taxa na Câmara foi simbólica; nem sempre há voto nominal individual confiável.',
    keywords: [
      ['TAXA DAS BLUSINHAS'],
      ['COMPRAS INTERNACIONAIS'],
      ['REMESSA', '50'],
      ['SHOPEE'],
      ['SHEIN'],
      ['ALIEXPRESS'],
      ['PROGRAMA MOVER'],
    ],
  },
  {
    id: 'escala-6x1',
    apelido_pauta: 'Fim da Escala 6x1 / jornada 5x2',
    numero_proposicao: ['PEC 221/2019', 'PEC 8/2025'],
    tipo: 'PEC',
    ano_pauta: 2019,
    tema: 'trabalho',
    resumo_curto: 'Redução da jornada e debate sobre fim da escala 6x1. A PEC 8/2025 foi ligada ao debate da escala 6x1/4x3.',
    houve_voto_nominal: 'parcial',
    observacao_voto: 'Pode estar em fases de comissão ou debates sem voto nominal de todos os deputados.',
    keywords: [
      ['ESCALA 6X1'],
      ['JORNADA 5X2'],
      ['JORNADA', '6X1'],
      ['4X3'],
    ],
  },
  {
    id: 'pl-estupro-aborto',
    apelido_pauta: 'PL do Estupro / aborto após 22 semanas',
    numero_proposicao: ['PL 1904/2024'],
    tipo: 'PL',
    ano_pauta: 2024,
    tema: 'costumes',
    resumo_curto: 'Debate sobre aborto após 22 semanas e equiparação penal em determinadas situações.',
    houve_voto_nominal: 'parcial',
    observacao_voto: 'Pode aparecer em requerimentos, urgências ou votações procedimentais.',
    keywords: [
      ['ABORTO', '22 SEMANAS'],
      ['PL DO ESTUPRO'],
      ['ESTUPRO', 'ABORTO'],
    ],
  },
  {
    id: 'lei-saidinhas',
    apelido_pauta: 'Lei das Saidinhas / fim da saída temporária',
    numero_proposicao: ['PL 2253/2022'],
    tipo: 'PL',
    ano_pauta: 2022,
    tema: 'seguranca',
    resumo_curto: 'Mudança nas regras de saída temporária de presos.',
    houve_voto_nominal: 'sim',
    observacao_voto: 'Pode aparecer como projeto, emendas ou apreciação de veto.',
    keywords: [
      ['SAIDINHA'],
      ['SAIDA TEMPORARIA'],
      ['EXECUCAO PENAL', 'SAIDA'],
    ],
  },
  {
    id: 'pacote-veneno',
    apelido_pauta: 'Pacote do Veneno / nova lei dos agrotóxicos',
    numero_proposicao: ['PL 6299/2002'],
    tipo: 'PL',
    ano_pauta: 2002,
    tema: 'meio ambiente',
    resumo_curto: 'Mudança nas regras de registro e controle de agrotóxicos.',
    houve_voto_nominal: 'sim',
    observacao_voto: 'Pode aparecer como projeto, substitutivo ou destaques.',
    keywords: [
      ['AGROTOXICOS'],
      ['PACOTE DO VENENO'],
      ['DEFENSIVOS AGRICOLAS'],
    ],
  },
  {
    id: 'jogos-azar',
    apelido_pauta: 'Legalização dos jogos de azar, cassinos e bingos',
    numero_proposicao: ['PL 442/1991'],
    tipo: 'PL',
    ano_pauta: 1991,
    tema: 'economia',
    resumo_curto: 'Regulação de jogos de azar, cassinos, bingos e apostas.',
    houve_voto_nominal: 'sim',
    observacao_voto: 'Pode aparecer como projeto, destaques ou requerimentos.',
    keywords: [
      ['JOGOS DE AZAR'],
      ['CASSINOS'],
      ['BINGOS'],
      ['APOSTAS'],
    ],
  },
  {
    id: 'armas',
    apelido_pauta: 'Armas / flexibilização de posse e porte',
    numero_proposicao: ['PL 3723/2019'],
    tipo: 'PL',
    ano_pauta: 2019,
    tema: 'seguranca',
    resumo_curto: 'Debate sobre regras de posse, porte, CACs e circulação de armas.',
    houve_voto_nominal: 'sim',
    observacao_voto: 'Pode aparecer como projeto, substitutivo ou destaques.',
    keywords: [
      ['CAC'],
      ['POSSE', 'ARMA'],
      ['PORTE', 'ARMA'],
      ['ARMAS'],
      ['FLEXIBILIZACAO', 'ARMA'],
    ],
  },
];

export const normalizeOfficialNumber = (value) => {
  const text = normalize(value).replace(/\s+/g, ' ').trim();
  const match = text.match(/\b(PEC|PLP|PL|MPV|PDL|PRC|REQ|MSC|INC|EMC|EMP|DTQ)\s*(\d{1,5})\s*\/\s*(\d{2,4})\b/);
  if (!match) return '';
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${match[1]} ${Number(match[2])}/${year}`;
};

export const agendaOfficialNumberLabels = (agenda) => agenda?.numero_proposicao || [];

export const findMajorAgendaByOfficialNumber = (value) => {
  const normalized = normalizeOfficialNumber(value);
  if (!normalized) return null;

  return MAJOR_AGENDAS.find((agenda) =>
    agenda.numero_proposicao.some((number) => normalizeOfficialNumber(number) === normalized)
  ) || null;
};

export const findMajorAgendaByText = (value) => {
  const text = normalize(value);
  if (!text) return null;

  const byOfficialNumber = MAJOR_AGENDAS.find((agenda) =>
    agenda.numero_proposicao.some((number) => {
      const normalizedNumber = normalizeOfficialNumber(number);
      return normalizedNumber && (
        text.includes(normalizedNumber.replace('/', ' / ')) ||
        text.includes(normalizedNumber)
      );
    })
  );
  if (byOfficialNumber) return byOfficialNumber;

  return MAJOR_AGENDAS.find((agenda) =>
    agenda.keywords.some((group) => group.every((keyword) => text.includes(normalize(keyword))))
  ) || null;
};

export const findMajorAgendaForVoting = ({ matter, text }) =>
  findMajorAgendaByOfficialNumber(matter?.label) || findMajorAgendaByText(text);

export const toFiscalizaAgendaRecord = (agenda) => {
  if (!agenda) return null;
  return {
    apelido_pauta: agenda.apelido_pauta,
    numero_proposicao: agenda.numero_proposicao.join('; '),
    tipo: agenda.tipo,
    ano_pauta: agenda.ano_pauta,
    tema: agenda.tema,
    resumo_curto: agenda.resumo_curto,
    houve_voto_nominal: agenda.houve_voto_nominal,
    observacao_voto: agenda.observacao_voto,
  };
};

const agendaSearchText = (agenda) =>
  normalize([
    agenda.apelido_pauta,
    agenda.numero_proposicao.join(' '),
    agenda.tipo,
    agenda.ano_pauta,
    agenda.tema,
    agenda.resumo_curto,
    agenda.observacao_voto,
    agenda.keywords.flat().join(' '),
  ].join(' '));

export const searchMajorAgendas = (query = '') => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];

  const officialQuery = normalizeOfficialNumber(query);
  if (officialQuery) {
    const exactOfficialMatches = MAJOR_AGENDAS.filter((agenda) =>
      agenda.numero_proposicao.some((number) => normalizeOfficialNumber(number) === officialQuery)
    );
    if (exactOfficialMatches.length) return exactOfficialMatches;
  }

  const parts = normalizedQuery.split(/\s+/).filter(Boolean);

  return MAJOR_AGENDAS
    .map((agenda) => {
      const text = agendaSearchText(agenda);
      const officialNumberMatch = agenda.numero_proposicao.some((number) =>
        normalizeOfficialNumber(number) === normalizeOfficialNumber(query)
      );
      const aliasMatch = normalize(agenda.apelido_pauta).includes(normalizedQuery);
      const allPartsMatch = parts.every((part) => text.includes(part));
      const keywordMatch = agenda.keywords.some((group) =>
        group.every((keyword) => text.includes(normalize(keyword)))
      );

      let score = 0;
      if (officialNumberMatch) score += 100;
      if (aliasMatch) score += 80;
      if (allPartsMatch) score += 55;
      if (keywordMatch) score += 35;
      if (normalize(agenda.tema).includes(normalizedQuery)) score += 20;

      return { agenda, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.agenda.apelido_pauta.localeCompare(b.agenda.apelido_pauta, 'pt-BR');
    })
    .map((entry) => entry.agenda);
};
