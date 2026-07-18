import { describe, expect, it, vi } from 'vitest';
import { findVotingRecordsWithIndividualVotes } from './agenda-votes';

describe('findVotingRecordsWithIndividualVotes', () => {
  it('continua procurando depois das cinco primeiras votacoes sem nomes', async () => {
    const records = Array.from({ length: 8 }, (_, index) => ({ id: 'v' + (index + 1), descricao: 'Votacao ' + (index + 1) }));
    const fetchVotes = vi.fn(async (id) =>
      id === 'v7'
        ? [{ deputyId: '1', name: 'Deputada Teste', vote: 'Sim' }]
        : []
    );

    const result = await findVotingRecordsWithIndividualVotes(records, fetchVotes, {
      batchSize: 2,
      maxCandidates: 8,
      maxNominalVotings: 1,
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('v7');
    expect(result.__meta.checked).toBe(8);
    expect(result.__meta.nominalVotings).toBe(1);
  });

  it('interrompe cedo quando a fonte de votos falha repetidamente', async () => {
    const records = Array.from({ length: 20 }, (_, index) => ({ id: 'v' + (index + 1) }));
    const fetchVotes = vi.fn(async () => {
      const votes = [];
      votes.__meta = { error: 'Status 503' };
      return votes;
    });

    const result = await findVotingRecordsWithIndividualVotes(records, fetchVotes, {
      batchSize: 2,
      maxSourceFailures: 2,
    });

    expect(result.__meta.checked).toBe(2);
    expect(result.__meta.failed).toBe(2);
    expect(result.__meta.stoppedAfterSourceFailures).toBe(true);
  });
});

