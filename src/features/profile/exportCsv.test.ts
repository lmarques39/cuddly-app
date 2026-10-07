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
    contractions: [{ id: 'c1', startedAt: at(5, 10, 0), endedAt: at(5, 10, 0) + 45_000 }],
  });

  expect(rows(csv).slice(1)).toEqual([
    'Contração;05/10/2026 10:00;05/10/2026 10:00;0,8;;',
    'Amamentação;06/10/2026 22:00;06/10/2026 22:15;15,0;Mama direita;',
    'Sono;07/10/2026 01:00;07/10/2026 03:30;150,0;;',
    'Extração;07/10/2026 08:00;07/10/2026 08:20;20,0;120 ml;',
    'Biberão;07/10/2026 09:00;;;90 ml · Fórmula;',
    'Fralda;07/10/2026 09:05;;;Ambos;muda de fralda',
    'Consulta;09/10/2026 10:00;;;Pediatria · Centro de Saúde;levar boletim',
  ]);
});

it('quotes cells that contain the separator, quotes or line breaks', () => {
  const csv = familyDataToCsv({
    diapers: [{ id: 'd1', type: 'wet', at: at(7, 9, 0), note: 'disse "ai"; chorou\nmuito' }],
  });
  expect(csv).toContain('Fralda;07/10/2026 09:00;;;Xixi;"disse ""ai""; chorou\nmuito"');
});
