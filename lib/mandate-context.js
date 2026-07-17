const normalizeText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

const parseDate = (record = {}) => {
  const raw = record.dataHora || record.data || record.dataInicio || record.dataPosse || '';
  const date = raw ? new Date(raw) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const describeRecord = (record = {}) =>
  [
    record.situacao,
    record.descricaoSituacao,
    record.condicaoEleitoral,
    record.descricaoStatus,
    record.status,
  ].filter(Boolean).join(' - ') || 'Mudança registrada sem descrição';

export const classifyMandateStatus = (record = {}) => {
  const text = normalizeText(describeRecord(record));
  if (!text) return 'unknown';
  if (/LICEN|AFAST|RENUNC|FALEC|CASSA|FIM|NAO EXERC/.test(text)) return 'inactive';
  if (/EXERCICIO|EM EXERCICIO|TITULAR|SUPLENTE/.test(text)) return 'active';
  return 'unknown';
};

const daysBetween = (start, end) => Math.max(0, Math.round((end - start) / 86400000));

export const buildMandateContext = ({ history = [], year } = {}) => {
  const numericYear = Number(year);
  const yearStart = new Date(Date.UTC(numericYear, 0, 1));
  const yearEndExclusive = new Date(Date.UTC(numericYear + 1, 0, 1));
  const totalDays = daysBetween(yearStart, yearEndExclusive);
  const records = [...history]
    .map((record) => ({
      record,
      date: parseDate(record),
      situation: describeRecord(record),
      status: classifyMandateStatus(record),
    }))
    .filter((item) => item.date)
    .sort((a, b) => a.date - b.date);

  const beforeYear = records.filter((item) => item.date < yearStart).at(-1) || null;
  const inYear = records.filter((item) => item.date >= yearStart && item.date < yearEndExclusive);
  const events = [beforeYear, ...inYear].filter(Boolean);
  let cursor = yearStart;
  let currentStatus = beforeYear?.status || 'unknown';
  let activeDays = 0;
  let unknownDays = 0;

  inYear.forEach((event) => {
    const eventDate = event.date < yearStart ? yearStart : event.date;
    const segmentDays = daysBetween(cursor, eventDate);
    if (currentStatus === 'active') activeDays += segmentDays;
    if (currentStatus === 'unknown') unknownDays += segmentDays;
    currentStatus = event.status;
    cursor = eventDate;
  });

  const finalDays = daysBetween(cursor, yearEndExclusive);
  if (currentStatus === 'active') activeDays += finalDays;
  if (currentStatus === 'unknown') unknownDays += finalDays;

  const hasInactiveTransition = inYear.some((event) => event.status === 'inactive');
  const hasActiveTransition = inYear.some((event) => event.status === 'active');
  const exactCoverage = unknownDays === 0;
  const partial = exactCoverage
    ? activeDays < totalDays
    : hasInactiveTransition || (hasActiveTransition && inYear[0]?.date > yearStart);
  const status = exactCoverage ? (partial ? 'partial' : 'complete') : partial ? 'partial' : 'unknown';
  const warnings = [];

  if (!records.length) warnings.push('A fonte oficial não retornou histórico suficiente para contextualizar o ano.');
  if (!exactCoverage) warnings.push('Não foi possível reconstruir todos os dias de exercício com segurança.');
  if (partial) warnings.push('O ano pode incluir posse, suplência, licença ou afastamento; comparações anuais exigem cautela.');

  return {
    status,
    isPartial: partial,
    activeDays: exactCoverage ? activeDays : null,
    totalDays,
    coverageDays: exactCoverage ? totalDays : totalDays - unknownDays,
    coveragePercent: Math.round(((totalDays - unknownDays) / totalDays) * 100),
    events: events.map((item) => ({
      date: item.date.toISOString(),
      situation: item.situation,
      status: item.status,
    })),
    sourceName: history.__meta?.sourceName || 'Câmara dos Deputados - Dados Abertos',
    sourceUrl: history.__meta?.sourceUrl || 'https://dadosabertos.camara.leg.br/api/v2/deputados',
    fetchedAt: history.__meta?.fetchedAt || new Date().toISOString(),
    calculationMethod: 'Reconstrução conservadora das mudanças de exercício registradas no histórico oficial. Dias sem situação conhecida não são estimados.',
    warnings,
  };
};

