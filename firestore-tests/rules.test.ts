import { readFileSync } from 'fs';
import { collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
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

    await assertSucceeds(setDoc(doc(db, 'families', 'famA'), { createdAt: Date.now(), createdBy: 'alice' }));
    await assertSucceeds(
      setDoc(doc(db, 'families', 'famA', 'members', 'alice'), { name: 'Alice', role: 'mae', email: 'a@x.com' }),
    );
  });

  it('does not let a user create a member doc for someone else', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const db = alice.firestore();
    await setDoc(doc(db, 'families', 'famA'), { createdAt: Date.now(), createdBy: 'alice' });

    await assertFails(setDoc(doc(db, 'families', 'famA', 'members', 'bob'), { name: 'Bob' }));
  });
});

describe('a family member can use their own family', () => {
  it('can read and write their own family activity data', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const db = alice.firestore();
    await setDoc(doc(db, 'families', 'famA'), { createdAt: Date.now(), createdBy: 'alice' });
    await setDoc(doc(db, 'families', 'famA', 'members', 'alice'), { name: 'Alice' });

    await assertSucceeds(setDoc(doc(db, 'families', 'famA', 'contractions', 'entry1'), { startedAt: 1, endedAt: 2 }));
    await assertSucceeds(getDoc(doc(db, 'families', 'famA', 'contractions', 'entry1')));
  });
});

describe('cross-family isolation', () => {
  async function makeFamily(uid: string, familyId: string) {
    const ctx = testEnv.authenticatedContext(uid);
    const db = ctx.firestore();
    await setDoc(doc(db, 'families', familyId), { createdAt: Date.now(), createdBy: uid });
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
    await setDoc(doc(db, 'families', familyId), { createdAt: Date.now(), createdBy: uid });
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

  it('lets any family member list all pending invites for their own family (#54)', async () => {
    const alice = await makeFamily('alice', 'famA', 'alice@x.com');
    await setDoc(doc(alice.firestore(), 'families', 'famA', 'invites', 'inv1'), {
      email: 'bob@x.com',
      invitedBy: 'alice',
      invitedAt: Date.now(),
      status: 'pending',
    });

    const q = query(collection(alice.firestore(), 'families', 'famA', 'invites'));
    const snap = await assertSucceeds(getDocs(q));
    expect(snap.docs).toHaveLength(1);
  });

  it("does not let a member of a different family list famA's invites", async () => {
    const alice = await makeFamily('alice', 'famA', 'alice@x.com');
    await setDoc(doc(alice.firestore(), 'families', 'famA', 'invites', 'inv1'), {
      email: 'bob@x.com',
      invitedBy: 'alice',
      invitedAt: Date.now(),
      status: 'pending',
    });
    const carol = await makeFamily('carol', 'famB', 'carol@x.com');

    await assertFails(getDocs(collection(carol.firestore(), 'families', 'famA', 'invites')));
  });
});

describe('accepting an invite (#53)', () => {
  async function makeFamily(uid: string, familyId: string, email: string) {
    const ctx = testEnv.authenticatedContext(uid, { email });
    const db = ctx.firestore();
    await setDoc(doc(db, 'families', familyId), { createdAt: Date.now(), createdBy: uid });
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
    // Same order as acceptInvite.ts: the member doc first (it must point at a
    // still-pending invite, #87), then flip the invite to accepted.
    await assertSucceeds(
      setDoc(doc(bob.firestore(), 'families', 'famA', 'members', 'bob'), {
        name: 'Bob',
        role: 'cuidador',
        email: 'bob@x.com',
        inviteId: 'inv1',
      }),
    );
    await assertSucceeds(updateDoc(doc(bob.firestore(), 'families', 'famA', 'invites', 'inv1'), { status: 'accepted' }));
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

describe('removing a caregiver (#55)', () => {
  async function makeFamily(uid: string, familyId: string) {
    const ctx = testEnv.authenticatedContext(uid);
    const db = ctx.firestore();
    await setDoc(doc(db, 'families', familyId), { createdAt: Date.now(), createdBy: uid });
    await setDoc(doc(db, 'families', familyId, 'members', uid), { name: uid });
    return ctx;
  }

  // Bob joined via an invite in real life; seeding him directly keeps these
  // tests about removal. (Alice writing his doc herself only used to work
  // through the {collection} wildcard — the #87 hole.)
  async function addMember(familyId: string, uid: string) {
    await testEnv.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'families', familyId, 'members', uid), { name: uid }));
  }

  it("lets a family member delete another member's doc", async () => {
    const alice = await makeFamily('alice', 'famA');
    await addMember('famA', 'bob');

    await assertSucceeds(deleteDoc(doc(alice.firestore(), 'families', 'famA', 'members', 'bob')));
  });

  it('revokes access immediately: a removed member can no longer read family data', async () => {
    const alice = await makeFamily('alice', 'famA');
    const bob = testEnv.authenticatedContext('bob');
    await addMember('famA', 'bob');
    await assertSucceeds(getDoc(doc(bob.firestore(), 'families', 'famA')));

    await deleteDoc(doc(alice.firestore(), 'families', 'famA', 'members', 'bob'));

    await assertFails(getDoc(doc(bob.firestore(), 'families', 'famA')));
  });

  it("does not let someone outside the family delete one of its members", async () => {
    await makeFamily('alice', 'famA');
    await addMember('famA', 'bob');
    const carol = await makeFamily('carol', 'famB');

    await assertFails(deleteDoc(doc(carol.firestore(), 'families', 'famA', 'members', 'bob')));
  });
});

describe('members and invites keep their own rules (#87)', () => {
  async function seedFamily() {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'families', 'famA'), { createdAt: Date.now(), createdBy: 'alice' });
      await setDoc(doc(db, 'families', 'famA', 'members', 'alice'), { name: 'Alice', role: 'mae', email: 'alice@x.com' });
      await setDoc(doc(db, 'families', 'famA', 'members', 'bob'), { name: 'Bob', role: 'cuidador', email: 'bob@x.com' });
      await setDoc(doc(db, 'families', 'famA', 'invites', 'pending1'), { email: 'carol@x.com', invitedBy: 'alice', status: 'pending' });
      await setDoc(doc(db, 'families', 'famA', 'invites', 'used1'), { email: 'dave@x.com', invitedBy: 'alice', status: 'accepted' });
    });
  }

  it("does not let a member edit another member's doc", async () => {
    await seedFamily();
    const bob = testEnv.authenticatedContext('bob', { email: 'bob@x.com' }).firestore();

    await assertFails(setDoc(doc(bob, 'families', 'famA', 'members', 'alice'), { name: 'Hacked', role: 'mae', email: 'alice@x.com' }));
    await assertSucceeds(setDoc(doc(bob, 'families', 'famA', 'members', 'bob'), { name: 'Bobby', role: 'cuidador', email: 'bob@x.com' }));
  });

  it("does not let a member rewrite an invite's email, but does let them cancel it", async () => {
    await seedFamily();
    const bob = testEnv.authenticatedContext('bob', { email: 'bob@x.com' }).firestore();

    await assertFails(updateDoc(doc(bob, 'families', 'famA', 'invites', 'pending1'), { email: 'eve@x.com' }));
    await assertSucceeds(deleteDoc(doc(bob, 'families', 'famA', 'invites', 'pending1')));
  });

  it('does not let a signed-in stranger join a family just by knowing its id', async () => {
    await seedFamily();
    const eve = testEnv.authenticatedContext('eve', { email: 'eve@x.com' }).firestore();

    await assertFails(setDoc(doc(eve, 'families', 'famA', 'members', 'eve'), { name: 'Eve', role: 'cuidador', email: 'eve@x.com' }));
    // ...nor by pointing at someone else's invite.
    await assertFails(
      setDoc(doc(eve, 'families', 'famA', 'members', 'eve'), { name: 'Eve', role: 'cuidador', email: 'eve@x.com', inviteId: 'pending1' }),
    );
  });

  it('does not let a removed caregiver rejoin on their own', async () => {
    await seedFamily();
    const alice = testEnv.authenticatedContext('alice', { email: 'alice@x.com' }).firestore();
    await assertSucceeds(deleteDoc(doc(alice, 'families', 'famA', 'members', 'bob')));

    const bob = testEnv.authenticatedContext('bob', { email: 'bob@x.com' }).firestore();
    await assertFails(setDoc(doc(bob, 'families', 'famA', 'members', 'bob'), { name: 'Bob', role: 'cuidador', email: 'bob@x.com' }));
  });

  it('does not let an already-accepted invite be used again', async () => {
    await seedFamily();
    const dave = testEnv.authenticatedContext('dave', { email: 'dave@x.com' }).firestore();

    await assertFails(
      setDoc(doc(dave, 'families', 'famA', 'members', 'dave'), { name: 'Dave', role: 'cuidador', email: 'dave@x.com', inviteId: 'used1' }),
    );
  });

  it("only lets a family be created with its creator as createdBy, and never changed afterwards", async () => {
    await seedFamily();
    const bob = testEnv.authenticatedContext('bob', { email: 'bob@x.com' }).firestore();

    await assertFails(setDoc(doc(bob, 'families', 'famB'), { createdAt: Date.now(), createdBy: 'alice' }));
    await assertSucceeds(setDoc(doc(bob, 'families', 'famC'), { createdAt: Date.now(), createdBy: 'bob' }));
    // A member making themselves "founder" before being removed, to rejoin later.
    await assertFails(updateDoc(doc(bob, 'families', 'famA'), { createdBy: 'bob' }));
  });
});

describe('deleting your own account (#69)', () => {
  async function seedFamily(members: string[]) {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'families', 'famA'), { createdAt: Date.now(), createdBy: 'alice' });
      for (const uid of members) await setDoc(doc(db, 'families', 'famA', 'members', uid), { name: uid });
      await setDoc(doc(db, 'families', 'famA', 'diapers', 'd1'), { type: 'xixi', at: 1 });
      await setDoc(doc(db, 'families', 'famA', 'profile', 'baby'), { name: 'Bia' });
      await setDoc(doc(db, 'families', 'famA', 'invites', 'inv1'), { email: 'x@x.com', status: 'pending' });
      await setDoc(doc(db, 'users', 'alice'), { familyId: 'famA' });
    });
  }

  it("lets the family's last member delete everything, in deleteAccount.ts's order", async () => {
    await seedFamily(['alice']);
    const db = testEnv.authenticatedContext('alice').firestore();

    await assertSucceeds(deleteDoc(doc(db, 'families', 'famA', 'diapers', 'd1')));
    await assertSucceeds(deleteDoc(doc(db, 'families', 'famA', 'profile', 'baby')));
    await assertSucceeds(deleteDoc(doc(db, 'families', 'famA', 'invites', 'inv1')));
    await assertSucceeds(deleteDoc(doc(db, 'families', 'famA')));
    await assertSucceeds(deleteDoc(doc(db, 'families', 'famA', 'members', 'alice')));
    await assertSucceeds(deleteDoc(doc(db, 'users', 'alice')));
  });

  it('locks you out of the rest once your own member doc is gone — which is why it goes last', async () => {
    await seedFamily(['alice']);
    const db = testEnv.authenticatedContext('alice').firestore();

    await assertSucceeds(deleteDoc(doc(db, 'families', 'famA', 'members', 'alice')));
    await assertFails(deleteDoc(doc(db, 'families', 'famA')));
  });

  it("lets a member leave a shared family without touching the others' data", async () => {
    await seedFamily(['alice', 'bob']);
    const db = testEnv.authenticatedContext('alice').firestore();

    await assertSucceeds(deleteDoc(doc(db, 'families', 'famA', 'members', 'alice')));
    const bobDb = testEnv.authenticatedContext('bob').firestore();
    await assertSucceeds(getDoc(doc(bobDb, 'families', 'famA', 'diapers', 'd1')));
  });
});

describe('unauthenticated access', () => {
  it('denies reads and writes without sign-in', async () => {
    const anon = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(anon.firestore(), 'families', 'famA')));
    await assertFails(setDoc(doc(anon.firestore(), 'families', 'famA'), { createdAt: 1 }));
  });
});
