import { getCorrectedPartyForCamaraId } from '@/lib/party-corrections';

export const normalizeDeputado = (deputado) => {
  if (!deputado) return null;
  const status = deputado.ultimoStatus || deputado;
  const apiId = status.id || deputado.id;

  return {
    id: `camara-${apiId}`,
    source: 'camara',
    apiId: String(apiId),
    name: status.nomeEleitoral || status.nome || deputado.nome,
    fullName: deputado.nomeCivil || status.nomeEleitoral || status.nome || deputado.nome,
    party: getCorrectedPartyForCamaraId(apiId, status.siglaPartido || deputado.siglaPartido || ''),
    state: status.siglaUf || deputado.siglaUf || '',
    photoUrl: status.urlFoto || deputado.urlFoto || '',
    house: 'camara',
    legislature: status.idLegislatura || deputado.idLegislatura || null,
    status: status.situacao || 'em exercicio',
    officialUrl: `https://www.camara.leg.br/deputados/${apiId}`,
  };
};

export const normalizeSenador = (senador) => {
  if (!senador) return null;
  const info = senador.IdentificacaoParlamentar || senador;
  const apiId = info.CodigoParlamentar || senador.id;

  return {
    id: `senado-${apiId}`,
    source: 'senado',
    apiId: String(apiId),
    name: info.NomeParlamentar || senador.nome,
    fullName: info.NomeCompletoParlamentar || info.NomeParlamentar || senador.nome,
    party: info.SiglaPartidoParlamentar || senador.partido || '',
    state: info.UfParlamentar || senador.uf || '',
    photoUrl: info.UrlFotoParlamentar || senador.foto || '',
    house: 'senado',
    legislature: null,
    status: 'em exercicio',
    officialUrl: `https://www25.senado.leg.br/web/senadores/senador/-/perfil/${apiId}`,
  };
};
