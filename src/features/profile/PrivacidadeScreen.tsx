import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PasswordField } from '../../components/PasswordField';
import { auth } from '../../services/firebase';
import { colors, fontFamily, radii, spacing, type } from '../../theme/tokens';
import { confirmDestructive } from '../../utils/confirm';
import { useCuidadores } from '../caregivers/useCuidadores';
import { AccountDeletionError, deleteMyAccount, usesPassword } from './deleteAccount';
import { ExportFormat, exportMyData } from './exportData';

/**
 * Data export (#67) and immediate account deletion (#68, #69). The static
 * Figma privacy-policy text is still a separate, unbuilt piece of this screen.
 */
export function PrivacidadeScreen() {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportData = async (format: ExportFormat) => {
    setExporting(format);
    setExportError(null);
    try {
      await exportMyData(format);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Não foi possível exportar os dados.');
    } finally {
      setExporting(null);
    }
  };

  const { members } = useCuidadores();
  const uid = auth.currentUser?.uid;
  const otherMembers = members.filter((m) => m.id !== uid).length;
  const needsPassword = auth.currentUser ? usesPassword(auth.currentUser) : false;

  const [confirmingDeletion, setConfirmingDeletion] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const cancelDeletion = () => {
    setConfirmingDeletion(false);
    setPassword('');
    setDeleteError(null);
  };

  const deleteAccount = async () => {
    const confirmed = await confirmDestructive(
      'Eliminar conta',
      otherMembers > 0
        ? 'A tua conta é eliminada já e sais da família. Os registos do bebé ficam com os outros cuidadores. Não é possível desfazer.'
        : 'A tua conta e todos os dados da família são eliminados já. Não é possível desfazer.'
    );
    if (!confirmed) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteMyAccount(needsPassword ? password : undefined);
      // Success signs the user out — App.tsx swaps this screen for the login flow.
    } catch (e) {
      setDeleteError(
        e instanceof AccountDeletionError ? e.message : 'Não foi possível eliminar a conta. Verifica a ligação e tenta outra vez.'
      );
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={type.h1}>Privacidade e dados</Text>

      <Text style={[type.body, { color: colors.inkSecondary }]}>
        Os dados da app (registos, perfil do bebé, cuidadores) ficam guardados só para a tua família, na tua conta.
      </Text>

      <View style={styles.section}>
        <Text style={[type.body, { fontFamily: fontFamily.bodyBold }]}>Exportar os meus dados</Text>
        <Text style={type.caption}>
          Descarrega uma cópia de todos os registos, do perfil do bebé e dos cuidadores da família, num ficheiro JSON — ou só os
          registos numa tabela (CSV) para abrir no Excel ou no Google Sheets.
        </Text>
        {(
          [
            { format: 'json', label: 'Exportar dados (JSON)' },
            { format: 'csv', label: 'Exportar registos (CSV)' },
          ] as const
        ).map(({ format, label }) => (
          <Pressable
            key={format}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ disabled: exporting != null, busy: exporting === format }}
            disabled={exporting != null}
            onPress={() => exportData(format)}
            style={styles.exportButton}
          >
            {exporting === format ? <ActivityIndicator color={colors.primaryInk} /> : <Text style={styles.exportLabel}>{label}</Text>}
          </Pressable>
        ))}
        {exportError && <Text style={styles.error}>{exportError}</Text>}
      </View>

      <View style={styles.dangerZone}>
        <Text style={[type.body, { fontFamily: fontFamily.bodyBold }]}>Eliminar conta</Text>
        <Text style={type.caption}>
          {otherMembers > 0
            ? `Elimina a tua conta de imediato e sais da família. Os registos do bebé ficam com ${otherMembers === 1 ? 'o outro cuidador' : `os outros ${otherMembers} cuidadores`}.`
            : 'Elimina de imediato a tua conta e todos os dados da família (registos, perfil do bebé, convites). A sessão termina logo.'}
        </Text>

        {confirmingDeletion ? (
          <>
            {needsPassword && (
              <View>
                <Text style={type.caption}>Escreve a tua password para confirmar</Text>
                <PasswordField value={password} onChangeText={setPassword} placeholder="Password" />
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: deleting, busy: deleting }}
              disabled={deleting}
              onPress={deleteAccount}
              style={styles.deleteButton}
            >
              {deleting ? <ActivityIndicator color={colors.paper} /> : <Text style={styles.deleteLabel}>Eliminar definitivamente</Text>}
            </Pressable>
            {!deleting && (
              <Pressable accessibilityRole="button" onPress={cancelDeletion} hitSlop={8} style={styles.cancel}>
                <Text style={styles.cancelLabel}>Cancelar</Text>
              </Pressable>
            )}
          </>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => setConfirmingDeletion(true)} style={styles.deleteButton}>
            <Text style={styles.deleteLabel}>Eliminar conta e dados</Text>
          </Pressable>
        )}
        {deleteError && <Text style={styles.error}>{deleteError}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  section: {
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  exportButton: {
    minHeight: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  exportLabel: { fontFamily: fontFamily.bodyBold, fontSize: 14.5, color: colors.primaryInk },
  error: { fontFamily: fontFamily.bodyMedium, fontSize: 12.5, color: colors.coral },
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
  cancel: { alignSelf: 'center' },
  cancelLabel: { fontFamily: fontFamily.bodyMedium, fontSize: 13, color: colors.inkSecondary },
  deleteLabel: { fontFamily: fontFamily.bodyBold, fontSize: 14.5, color: colors.paper },
});
