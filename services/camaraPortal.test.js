import { describe, expect, it } from 'vitest';
import { isPortalSummaryFresh, parseDeputadoPortalResumoHtml, parseDeputadoPortalVotacoesHtml } from '@/services/camaraPortal';

describe('camara portal summary parser', () => {
  it('requires recent cache for the current year and accepts historical cache', () => {
    const now = Date.parse('2026-07-10T12:00:00.000Z');
    const oldSummary = { __meta: { fetchedAt: '2026-07-09T00:00:00.000Z' } };

    expect(isPortalSummaryFresh(oldSummary, 2026, now)).toBe(false);
    expect(isPortalSummaryFresh(oldSummary, 2025, now)).toBe(true);
  });

  it('extracts the public deputy portal numbers from the Camara HTML text', () => {
    const html = `
      <section>
        <h2>Atuação no Plenário e Comissões 2024</h2>
        <h3>Propostas legislativas</h3>
        <span>de sua autoria</span><a>588</a>
        <span>relatadas</span><a>42</a>
        <h3>Votações nominais ?</h3>
        <span>em Plenário</span><a>270</a>
        <h3>Discursos</h3>
        <span>em Plenário</span><a>27</a>
        <h4>Presença em Plenário</h4>
        <span>Sobre Presença em Plenário ?</span>
        <span>Presenças na Câmara</span><span>80 dias</span>
        <span>Ausências justificadas</span><span>5 dias</span>
        <span>Ausências não justificadas</span><span>2 dias</span>
        <h4>Presença em Comissões</h4>
        <span>Sobre Presença em comissões ?</span>
        <span>Presenças na Câmara</span><span>123 reuniões</span>
        <span>Ausências justificadas</span><span>1 reuniões</span>
        <span>Ausências não justificadas</span><span>13 reuniões</span>
      </section>
    `;

    expect(parseDeputadoPortalResumoHtml(html)).toMatchObject({
      propostasAutoria: 588,
      propostasRelatadas: 42,
      votacoesNominaisPlenario: 270,
      discursosPlenario: 27,
      presencaPlenario: {
        presencas: 80,
        ausenciasJustificadas: 5,
        ausenciasNaoJustificadas: 2,
      },
      presencaComissoes: {
        presencas: 123,
        ausenciasJustificadas: 1,
        ausenciasNaoJustificadas: 13,
      },
    });
  });
});

describe('camara portal voting parser', () => {
  it('extracts the deputy vote, matter and session date from the official table', () => {
    const html = `
      <section>
        <h3>02/02/2026 - Sessão Extraordinária nº 001</h3>
        <table>
          <thead><tr><th>O que foi votado</th><th>Voto</th><th>Presença na sessão</th><th>Justificativa da ausência</th></tr></thead>
          <tbody>
            <tr><td>MPV nº 1313/2025 - Projeto de Lei de Conversão</td><td>Não</td><td>Presente</td><td>---</td></tr>
            <tr><td>REQ nº 284/2026 - Urgência para apreciação do PL 68/2026</td><td>Sim</td><td>Presente</td><td>---</td></tr>
          </tbody>
        </table>
      </section>
    `;

    const result = parseDeputadoPortalVotacoesHtml(html, { deputadoId: 204536, ano: 2026 });

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      data: '02/02/2026',
      descricao: 'MPV nº 1313/2025 - Projeto de Lei de Conversão',
      siglaOrgao: 'PLENÁRIO',
      deputyVote: {
        deputyId: '204536',
        vote: 'Não',
        attendance: 'Presente',
      },
    });
  });
});
