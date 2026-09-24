import { signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../services/firebase';
import { colors, fontFamily, radii, spacing, type } from '../../theme/tokens';
import { confirmDestructive } from '../../utils/confirm';

/**
 * Deliberately just the account-deletion action for now (#68) — the static
 * Figma privacy-policy text and the "Exportar dados" button (#67) are
 * separate, unbuilt pieces of this screen.
 */
export function PrivacidadeScreen() {
  const requestAccountDeletion = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const confirmed = await confirmDestructive(
      'Eliminar conta',
      'Isto marca a tua conta e todos os dados da família para eliminação, e termina a sessão já. Não é possível desfazer.'
    );
    if (!confirmed) return;

    // Marks the account for deletion — a backend job does the actual purge
    // (see #69, still pending an infra decision on the 30-day window). The
    // client never deletes the family's Firestore data directly here.
    await setDoc(doc(db, 'users', uid), { deletionRequestedAt: Date.now() }, { merge: true });
    await signOut(auth);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={type.h1}>Privacidade e dados</Text>

      <Text style={[type.body, { color: colors.inkSecondary }]}>
        Os dados da app (registos, perfil do bebé, cuidadores) ficam guardados só para a tua família, na tua conta.
      </Text>

      <View style={styles.dangerZone}>
        <Text style={[type.body, { fontFamily: fontFamily.bodyBold }]}>Eliminar conta</Text>
        <Text style={type.caption}>
          Pede a eliminação da tua conta e de todos os dados da família. A sessão termina de imediato.
        </Text>
        <Pressable onPress={requestAccountDeletion} style={styles.deleteButton}>
          <Text style={styles.deleteLabel}>Eliminar conta e dados</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  dangerZone: {
    marginTop: spacing.md,
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.coral,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  deleteButton: {
    minHeight: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  deleteLabel: { fontFamily: fontFamily.bodyBold, fontSize: 14.5, color: colors.paper },
});
