import { readFileSync } from 'fs';
import { collectionGroup, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
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

describe('families/{familyId}/invites/{inviteId}', () => {
  async function makeFamily(uid: string, familyId: string, email: string) {
    const ctx = testEnv.authenticatedContext(uid, { email });
    const db = ctx.firestore();
    await setDoc(doc(db, 'families', familyId), { createdAt: Date.now() });
    await setDoc(doc(db, 'families', familyId, 'members', uid), { name: uid, email });
    return ctx;
  }

  it('lets a family member create an invite for their own family', async () => {
    const alice = await makeFamily('alice', 'famA', 'alice@x.com');

    await assertSucceeds(
      setDoc(doc(alice.firestore(), 'families', 'famA', 'invites', 'inv1'), {
        email: 'bob@x.com',
        invitedBy: 'alice',
        invitedAt: Date.now(),
        status: 'pending',
      }),
    );
  });

  it('does not let a non-member create an invite for a family they do not belong to', async () => {
    await makeFamily('alice', 'famA', 'alice@x.com');
    const bob = testEnv.authenticatedContext('bob', { email: 'bob@x.com' });

    await assertFails(
      setDoc(doc(bob.firestore(), 'families', 'famA', 'invites', 'inv1'), {
        email: 'bob@x.com',
        invitedBy: 'bob',
        invitedAt: Date.now(),
        status: 'pending',
      }),
    );
  });

  it('lets the invited person read an invite addressed to their own email — before they are a member', async () => {
    const alice = await makeFamily('alice', 'famA', 'alice@x.com');
    await setDoc(doc(alice.firestore(), 'families', 'famA', 'invites', 'inv1'), {
      email: 'bob@x.com',
      invitedBy: 'alice',
      invitedAt: Date.now(),
      status: 'pending',
    });

    // bob has no members/{uid} doc in famA yet — isFamilyMember(famA) is false for him.
    const bob = testEnv.authenticatedContext('bob', { email: 'bob@x.com' });
    await assertSucceeds(getDoc(doc(bob.firestore(), 'families', 'famA', 'invites', 'inv1')));
  });

  it("does not let a signed-in user read an invite addressed to someone else's email", async () => {
    const alice = await makeFamily('alice', 'famA', 'alice@x.com');
    await setDoc(doc(alice.firestore(), 'families', 'famA', 'invites', 'inv1'), {
      email: 'bob@x.com',
      invitedBy: 'alice',
      invitedAt: Date.now(),
      status: 'pending',
    });

    const carol = testEnv.authenticatedContext('carol', { email: 'carol@x.com' });
    await assertFails(getDoc(doc(carol.firestore(), 'families', 'famA', 'invites', 'inv1')));
  });
});

describe('accepting an invite (#53)', () => {
  async function makeFamily(uid: string, familyId: string, email: string) {
    const ctx = testEnv.authenticatedContext(uid, { email });
    const db = ctx.firestore();
    await setDoc(doc(db, 'families', familyId), { createdAt: Date.now() });
    await setDoc(doc(db, 'families', familyId, 'members', uid), { name: uid, email });
    return ctx;
  }

  it('lets the invitee flip their own invite to accepted', async () => {
    const alice = await makeFamily('alice', 'famA', 'alice@x.com');
    await setDoc(doc(alice.firestore(), 'families', 'famA', 'invites', 'inv1'), {
      email: 'bob@x.com',
      invitedBy: 'alice',
      invitedAt: Date.now(),
      status: 'pending',
    });

    const bob = testEnv.authenticatedContext('bob', { email: 'bob@x.com' });
    await assertSucceeds(updateDoc(doc(bob.firestore(), 'families', 'famA', 'invites', 'inv1'), { status: 'accepted' }));

    // Accepting also lets them create their own member doc — same rule that
    // already allows the first member of a new family, unconditional on
    // isFamilyMember, applies equally to joining an existing one.
    await assertSucceeds(
      setDoc(doc(bob.firestore(), 'families', 'famA', 'members', 'bob'), { name: 'Bob', role: 'cuidador', email: 'bob@x.com' }),
    );
  });

  it('does not let the invitee change any other field while accepting', async () => {
    const alice = await makeFamily('alice', 'famA', 'alice@x.com');
    await setDoc(doc(alice.firestore(), 'families', 'famA', 'invites', 'inv1'), {
      email: 'bob@x.com',
      invitedBy: 'alice',
      invitedAt: Date.now(),
      status: 'pending',
    });

    const bob = testEnv.authenticatedContext('bob', { email: 'bob@x.com' });
    await assertFails(
      updateDoc(doc(bob.firestore(), 'families', 'famA', 'invites', 'inv1'), {
        status: 'accepted',
        invitedBy: 'bob', // trying to also rewrite who invited them
      }),
    );
  });

  it("does not let a signed-in user accept someone else's invite", async () => {
    const alice = await makeFamily('alice', 'famA', 'alice@x.com');
    await setDoc(doc(alice.firestore(), 'families', 'famA', 'invites', 'inv1'), {
      email: 'bob@x.com',
      invitedBy: 'alice',
      invitedAt: Date.now(),
      status: 'pending',
    });

    const carol = testEnv.authenticatedContext('carol', { email: 'carol@x.com' });
    await assertFails(updateDoc(doc(carol.firestore(), 'families', 'famA', 'invites', 'inv1'), { status: 'accepted' }));
  });

  it("finds a pending invite via a collectionGroup query on the invitee's own email", async () => {
    const alice = await makeFamily('alice', 'famA', 'alice@x.com');
    await setDoc(doc(alice.firestore(), 'families', 'famA', 'invites', 'inv1'), {
      email: 'bob@x.com',
      invitedBy: 'alice',
      invitedAt: Date.now(),
      status: 'pending',
    });

    const bob = testEnv.authenticatedContext('bob', { email: 'bob@x.com' });
    const q = query(collectionGroup(bob.firestore(), 'invites'), where('email', '==', 'bob@x.com'), where('status', '==', 'pending'));
    const snap = await getDocs(q);

    expect(snap.docs).toHaveLength(1);
    expect(snap.docs[0].ref.parent.parent!.id).toBe('famA');
  });
});

describe('unauthenticated access', () => {
  it('denies reads and writes without sign-in', async () => {
    const anon = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(anon.firestore(), 'families', 'famA')));
    await assertFails(setDoc(doc(anon.firestore(), 'families', 'famA'), { createdAt: 1 }));
  });
});
