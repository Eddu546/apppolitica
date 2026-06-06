const CAMARA_HOUSING_BASE_URL = '/api/camara-portal';

const normalizeText = (text = '') =>
  String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

const parseMoney = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildCamaraExpenseSourceUrl = ({ deputadoId, ano } = {}) =>
  deputadoId && ano
    ? `https://dadosabertos.camara.leg.br/api/v2/deputados/${encodeURIComponent(deputadoId)}/despesas?ano=${encodeURIComponent(ano)}`
    : 'https://dadosabertos.camara.leg.br/api/v2/deputados/{id}/despesas';

export const SENSITIVE_CEAP_CATEGORIES = [
  {
    id: 'rented_vehicle',
    label: 'Veiculo alugado ou fretado',
    shortLabel: 'Veículos',
    keywords: ['LOCACAO', 'FRETAMENTO', 'VEICULO', 'VEICULOS', 'AUTOMOTOR'],
    explanation:
      'Despesas da CEAP relacionadas a locacao ou fretamento de veiculos automotores.',
  },
  {
    id: 'fuel',
    label: 'Combustiveis e lubrificantes',
    shortLabel: 'Combustível',
    keywords: ['COMBUSTIVEIS', 'COMBUSTIVEL', 'LUBRIFICANTES', 'LUBRIFICANTE'],
    explanation:
      'Despesas declaradas com combustiveis e lubrificantes.',
  },
  {
    id: 'airfare',
    label: 'Passagens aereas',
    shortLabel: 'Passagens',
    keywords: ['PASSAGEM AEREA', 'BILHETE AEREO', 'PASSAGENS AEREAS'],
    explanation:
      'Despesas declaradas com emissao ou compra de passagens aereas.',
  },
  {
    id: 'lodging',
    label: 'Hospedagem',
    shortLabel: 'Hospedagem',
    keywords: ['HOSPEDAGEM'],
    explanation:
      'Despesas declaradas com hospedagem ligada ao mandato.',
  },
  {
    id: 'meal',
    label: 'Alimentação',
    shortLabel: 'Alimentação',
    keywords: ['ALIMENTACAO', 'REFEICAO', 'REFEICOES'],
    explanation:
      'Despesas declaradas com alimentacao.',
  },
  {
    id: 'disclosure',
    label: 'Divulgação da atividade parlamentar',
    shortLabel: 'Divulgação',
    keywords: ['DIVULGACAO DA ATIVIDADE PARLAMENTAR', 'DIVULGACAO'],
    explanation:
      'Despesas de comunicacao e divulgacao da atividade parlamentar.',
  },
  {
    id: 'consulting',
    label: 'Consultorias, pesquisas e trabalhos tecnicos',
    shortLabel: 'Consultorias',
    keywords: ['CONSULTORIA', 'PESQUISAS', 'TRABALHOS TECNICOS', 'SERVICOS TECNICOS'],
    explanation:
      'Despesas declaradas com consultorias, pesquisas ou trabalhos tecnicos.',
  },
];

export const classifySensitiveCeapType = (tipoDespesa = '') => {
  const normalized = normalizeText(tipoDespesa);

  return SENSITIVE_CEAP_CATEGORIES.find((category) => (
    category.id === 'rented_vehicle'
      ? (normalized.includes('LOCACAO') || normalized.includes('FRETAMENTO')) &&
        (normalized.includes('VEICULO') || normalized.includes('VEICULOS') || normalized.includes('AUTOMOTOR'))
      : category.keywords.some((keyword) => normalized.includes(keyword))
  )) || null;
};

export const analyzeVehicleRentalExpenses = (despesas = [], options = {}) => {
  const records = despesas.filter((item) => {
    const type = normalizeText(item.tipoDespesa);
    return (
      (type.includes('LOCACAO') || type.includes('FRETAMENTO')) &&
      (type.includes('VEICULO') || type.includes('VEICULOS') || type.includes('AUTOMOTOR'))
    );
  });

  const amount = records.reduce((acc, item) => acc + parseMoney(item.valorLiquido), 0);
  const sourceUrl = buildCamaraExpenseSourceUrl(options);

  return {
    status: despesas.__meta?.fetchedAt ? 'available' : 'partial',
    usesBenefit: records.length > 0,
    label: records.length > 0 ? 'Usou cota com veiculo alugado/fretado' : 'Sem veiculo alugado/fretado na CEAP',
    amount,
    count: records.length,
    sourceName: 'Camara dos Deputados - Dados Abertos',
    sourceUrl,
    fetchedAt: despesas.__meta?.fetchedAt || null,
    calculationMethod:
      'Busca por despesas CEAP com tipo contendo locacao ou fretamento de veiculos automotores no ano consultado.',
  };
};

export const buildSensitiveCeapSummary = (despesas = [], options = {}) => {
  const records = Array.isArray(despesas) ? despesas : [];
  const total = records.reduce((acc, item) => acc + parseMoney(item.valorLiquido), 0);
  const sourceUrl = buildCamaraExpenseSourceUrl(options);
  const fetchedAt = Array.isArray(despesas) ? despesas.__meta?.fetchedAt || null : null;
  const grouped = new Map();

  records.forEach((item) => {
    const category = classifySensitiveCeapType(item.tipoDespesa);
    if (!category) return;

    const value = parseMoney(item.valorLiquido);
    if (value <= 0) return;

    const current = grouped.get(category.id) || {
      ...category,
      amount: 0,
      count: 0,
      examples: [],
    };

    current.amount += value;
    current.count += 1;
    if (current.examples.length < 3) {
      current.examples.push({
        supplier: item.nomeFornecedor || item.cnpjCpfFornecedor || 'Fornecedor nao informado',
        value,
        date: item.dataDocumento || null,
      });
    }
    grouped.set(category.id, current);
  });

  const categories = Array.from(grouped.values())
    .map((category) => ({
      ...category,
      shareOfTotal: total > 0 ? category.amount / total : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
  const sensitiveTotal = categories.reduce((acc, category) => acc + category.amount, 0);

  return {
    status: fetchedAt ? 'available' : 'partial',
    label: 'Despesas sensiveis da CEAP',
    total,
    sensitiveTotal,
    sensitiveShare: total > 0 ? sensitiveTotal / total : 0,
    categories,
    sourceName: 'Camara dos Deputados - Dados Abertos',
    sourceUrl,
    fetchedAt,
    calculationMethod:
      'Agrupamento das despesas CEAP do ano consultado por categorias de maior interesse publico, usando o campo tipoDespesa retornado pela Camara.',
    explanationForCitizen:
      'Este painel destaca categorias que costumam merecer leitura mais cuidadosa pelo cidadao. Nao indica irregularidade sozinho.',
    warnings: [
      'O recorte depende dos nomes de categoria retornados pela Camara.',
      'Valores encontrados aqui devem ser lidos junto com notas, fornecedores e contexto do mandato.',
    ],
  };
};

export const parseHousingBenefitsHtml = (html = '') => {
  const text = html.replace(/\s+/g, ' ').trim();
  const normalized = normalizeText(text);
  const noBenefit = normalized.includes('NENHUM BENEFICIO');

  if (noBenefit) {
    return {
      status: 'available',
      usesBenefit: false,
      usesFunctionalProperty: false,
      receivesHousingAllowance: false,
      usesCeapComplement: false,
      label: 'Nenhum beneficio de moradia encontrado',
      summary: 'Nenhum beneficio',
    };
  }

  const receivesHousingAllowance = normalized.includes('AUXILIO-MORADIA RECEBIDO') || normalized.includes('AUXILIO-MORADIA');
  const usesCeapComplement = normalized.includes('COMPLEMENTO COM A COTA') || normalized.includes('COMPLEMENTAR O AUXILIO');
  const usesFunctionalProperty = normalized.includes('OCUPACAO DE IMOVEL') || normalized.includes('IMOVEL FUNCIONAL');
  const usesBenefit = usesFunctionalProperty || receivesHousingAllowance || usesCeapComplement;

  if (!usesBenefit) {
    return {
      status: 'unavailable',
      usesBenefit: null,
      usesFunctionalProperty: null,
      receivesHousingAllowance: null,
      usesCeapComplement: null,
      label: 'Resultado de moradia inconclusivo',
      summary: text,
    };
  }

  return {
    status: 'available',
    usesBenefit,
    usesFunctionalProperty,
    receivesHousingAllowance,
    usesCeapComplement,
    label: 'Beneficio de moradia encontrado',
    summary: text,
  };
};

export const fetchDeputyHousingBenefits = async (deputyId) => {
  if (!deputyId) {
    return {
      status: 'unavailable',
      usesBenefit: null,
      label: 'Deputado sem identificador para consulta de moradia',
    };
  }

  const path = `/moradia/57/2023/2027/02/01/${encodeURIComponent(deputyId)}`;
  const sourceUrl = `https://www.camara.leg.br${path}`;

  try {
    const response = await fetch(`${CAMARA_HOUSING_BASE_URL}${path}`, {
      headers: { Accept: 'text/html' },
    });

    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }

    const html = await response.text();
    const parsed = parseHousingBenefitsHtml(html);

    return {
      ...parsed,
      sourceName: 'Camara dos Deputados - Imoveis Funcionais e Auxilio-Moradia',
      sourceUrl,
      fetchedAt: new Date().toISOString(),
      calculationMethod:
        'Consulta ao portal oficial de Imoveis Funcionais e Auxilio-Moradia da Camara para a 57a Legislatura.',
      warnings: parsed.status === 'unavailable'
        ? ['A pagina oficial foi carregada, mas o conteudo nao permitiu confirmar uso ou ausencia de beneficio.']
        : [],
    };
  } catch (error) {
    console.warn('[CAMARA MORADIA] Falha ao buscar beneficios de moradia:', error);
    return {
      status: 'unavailable',
      usesBenefit: null,
      label: 'Beneficios de moradia indisponiveis',
      sourceName: 'Camara dos Deputados - Imoveis Funcionais e Auxilio-Moradia',
      sourceUrl,
      fetchedAt: new Date().toISOString(),
      calculationMethod:
        'A consulta ao portal oficial de moradia falhou ou nao pode ser lida neste ambiente.',
      warnings: ['Sem confirmacao oficial de moradia, o selo deve ficar em analise.'],
    };
  }
};

export const buildAusteritySeal = ({ vehicleRental, housingBenefits }) => {
  const checks = [
    {
      id: 'vehicle_rental',
      label: 'Carro alugado/fretado com CEAP',
      passed: vehicleRental?.status === 'available' && vehicleRental.usesBenefit === false,
      status: vehicleRental?.status || 'unavailable',
      detail: vehicleRental?.label || 'Despesa de veiculo nao verificada',
      amount: vehicleRental?.amount || 0,
      sourceName: vehicleRental?.sourceName,
      sourceUrl: vehicleRental?.sourceUrl,
      fetchedAt: vehicleRental?.fetchedAt,
      calculationMethod: vehicleRental?.calculationMethod,
      warnings: vehicleRental?.warnings || [],
    },
    {
      id: 'housing_benefits',
      label: 'Imovel funcional ou auxilio-moradia',
      passed: housingBenefits?.status === 'available' && housingBenefits.usesBenefit === false,
      status: housingBenefits?.status || 'unavailable',
      detail: housingBenefits?.label || 'Beneficio de moradia nao verificado',
      amount: 0,
      sourceName: housingBenefits?.sourceName,
      sourceUrl: housingBenefits?.sourceUrl,
      fetchedAt: housingBenefits?.fetchedAt,
      calculationMethod: housingBenefits?.calculationMethod,
      warnings: housingBenefits?.warnings || [],
    },
  ];

  const hasFailedCheck = checks.some((check) => check.status === 'available' && !check.passed);
  const allAvailable = checks.every((check) => check.status === 'available');
  const allPassed = checks.every((check) => check.passed);

  if (allAvailable && allPassed) {
    return {
      status: 'approved',
      title: 'Selo de austeridade verificada',
      description:
        'Nao foram encontrados carro alugado/fretado na CEAP nem beneficio de moradia funcional/auxilio-moradia nas fontes oficiais consultadas.',
      checks,
    };
  }

  if (hasFailedCheck) {
    return {
      status: 'not_approved',
      title: 'Selo nao concedido',
      description:
        'Pelo menos um beneficio verificavel foi encontrado nas fontes oficiais. Isso nao indica irregularidade, apenas impede o selo.',
      checks,
    };
  }

  return {
    status: 'review',
    title: 'Selo em analise',
    description:
      'Ainda falta uma fonte verificavel para concluir se o parlamentar nao usou essas regalias no periodo consultado.',
    checks,
  };
};
