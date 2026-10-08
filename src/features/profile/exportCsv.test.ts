import { familyDataToCsv } from './exportCsv';

const at = (day: number, h: number, m: number) => new Date(2026, 9, day, h, m).getTime();

function rows(csv: string): string[] {
  return csv.replace(/^﻿/, '').trimEnd().split('\r\n');
}

it('starts with a BOM and a ;-separated header, for Portuguese Excel', () => {
  const csv = familyDataToCsv({});
  expect(csv.startsWith('﻿')).toBe(true);
  expect(rows(csv)).toEqual(['Tipo;Início;Fim;Duração (min);Detalhe;Observações']);
});

it('puts every tracker in one table, oldest first, with its own detail', () => {
  const csv = familyDataToCsv({
    familyId: 'famA',
    babyProfile: { name: 'Bia' },
    members: [{ id: 'alice', name: 'Alice' }],
    activeSessions: [{ kind: 'sono', startedAt: at(7, 12, 0) }],
    sono: [{ id: 's1', startedAt: at(7, 1, 0), endedAt: at(7, 3, 30) }],
    breastfeeding: [{ id: 'b1', side: 'right', startedAt: at(6, 22, 0), endedAt: at(6, 22, 15) }],
    pumping: [{ id: 'p1', startedAt: at(7, 8, 0), endedAt: at(7, 8, 20), amountMl: 120 }],
    bottle: [{ id: 'bo1', amountMl: 90, type: 'formula', at: at(7, 9, 0) }],
    diapers: [{ id: 'd1', type: 'both', at: at(7, 9, 5), note: 'muda de fralda' }],
    appointments: [{ id: 'a1', title: 'Pediatria', location: 'Centro de Saúde', scheduledAt: at(9, 10, 0), notes: 'levar boletim' }],
    foods: [{ id: 'f1', food: 'Cenoura', preparation: 'puré', introducedAt: at(8, 12, 0), reaction: 'ligeira', reactionNotes: 'manchas na cara' }],
    contractions: [{ id: 'c1', startedAt: at(5, 10, 0), endedAt: at(5, 10, 0) + 45_000 }],
  });

  expect(rows(csv).slice(1)).toEqual([
    'Contração;05/10/2026 10:00;05/10/2026 10:00;0,8;;',
    'Amamentação;06/10/2026 22:00;06/10/2026 22:15;15,0;Mama direita;',
    'Sono;07/10/2026 01:00;07/10/2026 03:30;150,0;;',
    'Extração;07/10/2026 08:00;07/10/2026 08:20;20,0;120 ml;',
    'Biberão;07/10/2026 09:00;;;90 ml · Fórmula;',
    'Fralda;07/10/2026 09:05;;;Ambos;muda de fralda',
    'Alimento novo;08/10/2026 12:00;;;Cenoura · puré · Reação ligeira;manchas na cara',
    'Consulta;09/10/2026 10:00;;;Pediatria · Centro de Saúde;levar boletim',
  ]);
});

it('quotes cells that contain the separator, quotes or line breaks', () => {
  const csv = familyDataToCsv({
    diapers: [{ id: 'd1', type: 'wet', at: at(7, 9, 0), note: 'disse "ai"; chorou\nmuito' }],
  });
  expect(csv).toContain('Fralda;07/10/2026 09:00;;;Xixi;"disse ""ai""; chorou\nmuito"');
});

describe('in English (#118)', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const i18n = require('../../i18n').default;
  beforeAll(() => i18n.changeLanguage('en'));
  afterAll(() => i18n.changeLanguage('pt'));

  it('uses English labels, "," between columns and a decimal point, for English Excel', () => {
    const csv = familyDataToCsv({
      contractions: [{ id: 'c1', startedAt: at(5, 10, 0), endedAt: at(5, 10, 0) + 45_000 }],
      breastfeeding: [{ id: 'b1', side: 'left', startedAt: at(6, 22, 0), endedAt: at(6, 22, 15) }],
      bottle: [{ id: 'bo1', amountMl: 90, type: 'breastmilk', at: at(7, 9, 0) }],
      appointments: [{ id: 'a1', title: 'Pediatria', type: 'pediatria', scheduledAt: at(9, 10, 0) }],
    });

    expect(rows(csv)).toEqual([
      'Type,Start,End,Duration (min),Detail,Notes',
      'Contraction,05/10/2026 10:00,05/10/2026 10:00,0.8,,',
      'Breastfeeding,06/10/2026 22:00,06/10/2026 22:15,15.0,Left breast,',
      'Bottle,07/10/2026 09:00,,,90 ml · Breast milk,',
      // the type is shown in the current language, even though `title` was saved in Portuguese
      'Appointment,09/10/2026 10:00,,,Paediatrics,',
    ]);
  });

  it('quotes cells that contain a comma', () => {
    const csv = familyDataToCsv({ diapers: [{ id: 'd1', type: 'wet', at: at(7, 9, 0), note: 'cried, a lot' }] });
    expect(csv).toContain('Diaper,07/10/2026 09:00,,,Wee,"cried, a lot"');
  });
});
