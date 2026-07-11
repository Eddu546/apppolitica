import { describe, expect, it } from 'vitest';
import {
  fiscalizaAgendaPath,
  getCamaraPortalAuthorSearchUrl,
  getCamaraPortalDeputyUrl,
  getCamaraPortalDeputyVotesUrl,
  getCamaraPortalPropositionUrl,
  getCamaraPortalRapporteurSearchUrl,
  getInternalSourcePageFromTechnicalUrl,
  getReadableSourceUrl,
  parseOfficialNumber,
} from '@/lib/official-links';

describe('official links', () => {
  it('parses official proposition numbers used in agendas', () => {
    expect(parseOfficialNumber('PL 914/2024')).toEqual({ type: 'PL', number: '914', year: '2024' });
    expect(parseOfficialNumber('PEC 45/2019')).toEqual({ type: 'PEC', number: '45', year: '2019' });
  });

  it('builds internal agenda paths instead of generic search links', () => {
    expect(fiscalizaAgendaPath('PL 2630/2020')).toBe('/pautas/PL-2630-2020');
  });

  it('builds public Camara portal proposition links by official id', () => {
    expect(getCamaraPortalPropositionUrl(2422697)).toBe('https://www.camara.leg.br/propostas-legislativas/2422697');
  });

  it('builds public Camara deputy verification links', () => {
    expect(getCamaraPortalDeputyUrl(204536)).toBe('https://www.camara.leg.br/deputados/204536');
    expect(getCamaraPortalDeputyVotesUrl(204536, 2026)).toBe(
      'https://www.camara.leg.br/deputados/204536/votacoes-nominais-plenario/2026'
    );
  });

  it('builds Camara portal searches for authorship and rapporteur checks', () => {
    const authorUrl = getCamaraPortalAuthorSearchUrl(204536, 2026);
    const rapporteurUrl = getCamaraPortalRapporteurSearchUrl(204536, 2026);

    expect(decodeURIComponent(authorUrl)).toContain(
      'autores.ideCadastro: 204536 AND dataApresentacao:[2026-01-01 TO 2026-12-31]'
    );
    expect(decodeURIComponent(rapporteurUrl)).toContain(
      'relatores.ideCadastro: 204536 AND relatores.dataInicioRelator:[2026-01-01 TO 2026-12-31]'
    );
  });

  it('converts technical Camara expense URLs to internal source pages', () => {
    expect(
      getInternalSourcePageFromTechnicalUrl('https://dadosabertos.camara.leg.br/api/v2/deputados/204536/despesas?ano=2025')
    ).toBe('/fonte/deputado/204536/despesas/2025');
  });

  it('hides raw technical URLs when no readable page is known', () => {
    expect(
      getReadableSourceUrl({
        sourceUrl: 'https://dadosabertos.camara.leg.br/api/v2/votacoes',
      })
    ).toBe('');
    expect(
      getReadableSourceUrl({
        sourceUrl: 'https://legis.senado.leg.br/dadosabertos/senador/1',
      })
    ).toBe('');
  });
});
