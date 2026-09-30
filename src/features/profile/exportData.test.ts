import { getDoc, getDocs } from 'firebase/firestore';
import { auth } from '../../services/firebase';
import { exportFileName, exportMyData } from './exportData';
import { saveExportFile } from './saveExportFile';

jest.mock('./saveExportFile');

const mockGetDoc = getDoc as jest.Mock;
const mockGetDocs = getDocs as jest.Mock;
const mockSaveExportFile = saveExportFile as jest.MockedFunction<typeof saveExportFile>;

type Ref = { segments: unknown[] };
const lastSegment = (ref: Ref) => ref.segments[ref.segments.length - 1];

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(auth, { currentUser: { uid: 'alice', email: 'alice@x.com' } });
});

it('builds a local-date file name', () => {
  expect(exportFileName(new Date(2026, 8, 5, 23, 30))).toBe('cuddly-dados-2026-09-05.json');
});

it('refuses to export when the account has no family', async () => {
  mockGetDoc.mockResolvedValue({ exists: () => false, data: () => undefined });

  await expect(exportMyData()).rejects.toThrow('Não foi encontrada nenhuma família nesta conta.');
  expect(mockSaveExportFile).not.toHaveBeenCalled();
});

it('refuses to export without a signed-in user', async () => {
  Object.assign(auth, { currentUser: null });

  await expect(exportMyData()).rejects.toThrow('Sem sessão iniciada.');
});

it("exports every tracker collection, the baby profile and members of the caller's family", async () => {
  mockGetDoc.mockImplementation(async (ref: Ref) =>
    lastSegment(ref) === 'baby'
      ? { exists: () => true, data: () => ({ name: 'Bia', birthDate: '2026-05-01' }) }
      : { exists: () => true, data: () => ({ familyId: 'famA' }) },
  );
  mockGetDocs.mockImplementation(async (ref: Ref) => {
    const name = lastSegment(ref);
    if (name === 'members') return { docs: [{ id: 'alice', data: () => ({ name: 'Alice', role: 'mae' }) }] };
    if (name === 'diapers') return { docs: [{ id: 'd1', data: () => ({ type: 'xixi', at: 1 }) }] };
    return { docs: [] };
  });

  await exportMyData(new Date(2026, 8, 30, 10, 0));

  expect(mockSaveExportFile).toHaveBeenCalledTimes(1);
  const [fileName, contents] = mockSaveExportFile.mock.calls[0];
  expect(fileName).toBe('cuddly-dados-2026-09-30.json');

  const exported = JSON.parse(contents);
  expect(exported).toMatchObject({
    account: { uid: 'alice', email: 'alice@x.com' },
    familyId: 'famA',
    babyProfile: { name: 'Bia', birthDate: '2026-05-01' },
    members: [{ id: 'alice', name: 'Alice', role: 'mae' }],
    diapers: [{ id: 'd1', type: 'xixi', at: 1 }],
    sono: [],
    appointments: [],
  });
  expect(exported).not.toHaveProperty('invites');
  // Every read stays inside the caller's own family.
  mockGetDocs.mock.calls.forEach(([ref]: [Ref]) => expect(ref.segments.slice(1, 3)).toEqual(['families', 'famA']));
});
