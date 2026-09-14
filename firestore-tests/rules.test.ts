import { readFileSync } from 'fs';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-cuddly-rules-test',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: 'localhost',
      port: 8090,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

describe('bootstrap: first member of a new family', () => {
  it('lets a signed-in user create their own family and member doc', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const db = alice.firestore();

    await assertSucceeds(setDoc(doc(db, 'families', 'famA'), { createdAt: Date.now() }));
    await assertSucceeds(
      setDoc(doc(db, 'families', 'famA', 'members', 'alice'), { name: 'Alice', role: 'mae', email: 'a@x.com' }),
    );
  });

  it('does not let a user create a member doc for someone else', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const db = alice.firestore();
    await setDoc(doc(db, 'families', 'famA'), { createdAt: Date.now() });

    await assertFails(setDoc(doc(db, 'families', 'famA', 'members', 'bob'), { name: 'Bob' }));
  });
});

describe('a family member can use their own family', () => {
  it('can read and write their own family activity data', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const db = alice.firestore();
    await setDoc(doc(db, 'families', 'famA'), { createdAt: Date.now() });
    await setDoc(doc(db, 'families', 'famA', 'members', 'alice'), { name: 'Alice' });

    await assertSucceeds(setDoc(doc(db, 'families', 'famA', 'contractions', 'entry1'), { startedAt: 1, endedAt: 2 }));
    await assertSucceeds(getDoc(doc(db, 'families', 'famA', 'contractions', 'entry1')));
  });
});

describe('cross-family isolation', () => {
  async function makeFamily(uid: string, familyId: string) {
    const ctx = testEnv.authenticatedContext(uid);
    const db = ctx.firestore();
    await setDoc(doc(db, 'families', familyId), { createdAt: Date.now() });
    await setDoc(doc(db, 'families', familyId, 'members', uid), { name: uid });
    return ctx;
  }

  it("a member of family A cannot read family B's family or member docs", async () => {
    await makeFamily('alice', 'famA');
    const bob = await makeFamily('bob', 'famB');

    await assertFails(getDoc(doc(bob.firestore(), 'families', 'famA')));
    await assertFails(getDoc(doc(bob.firestore(), 'families', 'famA', 'members', 'alice')));
  });

  it("a member of family A cannot write activity data into family B", async () => {
    await makeFamily('alice', 'famA');
    const bob = await makeFamily('bob', 'famB');

    await assertFails(
      setDoc(doc(bob.firestore(), 'families', 'famA', 'contractions', 'entry1'), { startedAt: 1, endedAt: 2 }),
    );
  });
});

describe('users/{userId}', () => {
  it('lets a user write and read their own user doc', async () => {
    const alice = testEnv.authenticatedContext('alice');
    await assertSucceeds(setDoc(doc(alice.firestore(), 'users', 'alice'), { familyId: 'famA' }));
    await assertSucceeds(getDoc(doc(alice.firestore(), 'users', 'alice')));
  });

  it("does not let a user read someone else's user doc", async () => {
    const bob = testEnv.authenticatedContext('bob');
    await setDoc(doc(bob.firestore(), 'users', 'bob'), { familyId: 'famB' });

    const alice = testEnv.authenticatedContext('alice');
    await assertFails(getDoc(doc(alice.firestore(), 'users', 'bob')));
  });
});

describe('unauthenticated access', () => {
  it('denies reads and writes without sign-in', async () => {
    const anon = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(anon.firestore(), 'families', 'famA')));
    await assertFails(setDoc(doc(anon.firestore(), 'families', 'famA'), { createdAt: 1 }));
  });
});
