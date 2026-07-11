export const LEGISLATURE_START_YEAR = 2023;

export const getCurrentLegislativeYear = () => new Date().getFullYear();

export const getLegislativeYears = ({
  startYear = LEGISLATURE_START_YEAR,
  endYear = getCurrentLegislativeYear(),
} = {}) => {
  const first = Number(startYear);
  const last = Math.max(first, Number(endYear));

  return Array.from({ length: last - first + 1 }, (_, index) => String(first + index));
};

export const LEGISLATIVE_YEARS = getLegislativeYears();
export const DEFAULT_LEGISLATIVE_YEAR = LEGISLATIVE_YEARS.at(-1);

export const normalizeLegislativeYear = (value, fallback = DEFAULT_LEGISLATIVE_YEAR) => {
  const normalized = String(value || '');
  return LEGISLATIVE_YEARS.includes(normalized) ? normalized : fallback;
};
