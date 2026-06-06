export const normalizeSearchText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

export const rankNameMatch = (name = '', query = '') => {
  const normalizedName = normalizeSearchText(name);
  const normalizedQuery = normalizeSearchText(query);
  const queryParts = normalizedQuery.split(' ').filter(Boolean);
  const nameParts = normalizedName.split(' ').filter(Boolean);

  if (!normalizedQuery) return 1;
  if (normalizedName === normalizedQuery) return 100;
  if (normalizedName.startsWith(normalizedQuery)) return 90;
  if (
    queryParts.length > 1 &&
    queryParts.every((queryPart) => nameParts.some((namePart) => namePart.startsWith(queryPart)))
  ) {
    return 85;
  }
  if (normalizedName.split(' ').some((part) => part.startsWith(normalizedQuery))) return 80;
  if (normalizedName.includes(normalizedQuery)) return 70;
  return 0;
};

export const filterAndSortByName = (items = [], query = '', getName = (item) => item?.nome || '') => {
  const normalizedQuery = normalizeSearchText(query);

  return [...items]
    .map((item) => ({
      item,
      name: getName(item),
      rank: rankNameMatch(getName(item), normalizedQuery),
    }))
    .filter((entry) => !normalizedQuery || entry.rank > 0)
    .sort((a, b) => {
      if (b.rank !== a.rank) return b.rank - a.rank;
      return String(a.name).localeCompare(String(b.name), 'pt-BR');
    })
    .map((entry) => entry.item);
};
