import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PasswordField } from '../../components/PasswordField';
import { auth } from '../../services/firebase';
import { fontFamily, radii, spacing } from '../../theme/tokens';
import { createStyles, useTheme } from '../../theme/ThemeProvider';
import { confirmDestructive } from '../../utils/confirm';
import { useCuidadores } from '../caregivers/useCuidadores';
import { AccountDeletionError, deleteMyAccount, usesPassword } from './deleteAccount';
import { ExportFormat, exportMyData } from './exportData';

// Public pages in docs/ (#92) — served once GitHub Pages is switched on for the repo.
export const PRIVACY_POLICY_URL = 'https://lmarques39.github.io/cuddly-app/privacidade.html';

/**
 * Data export (#67) and immediate account deletion (#68, #69). The full
 * privacy policy lives on the website (#92) rather than inside the app, so
 * there's one copy to keep up to date.
 */
export function PrivacidadeScreen() {
  const { t } = useTranslation();
  const { colors, type } = useTheme();
  const styles = useStyles();
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportData = async (format: ExportFormat) => {
    setExporting(format);
    setExportError(null);
    try {
      await exportMyData(format);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : t('privacy.exportFailed'));
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
      t('privacy.deleteTitle'),
      otherMembers > 0 ? t('privacy.confirmShared') : t('privacy.confirmAlone'),
      t('common.delete')
    );
    if (!confirmed) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteMyAccount(needsPassword ? password : undefined);
      // Success signs the user out — App.tsx swaps this screen for the login flow.
    } catch (e) {
      setDeleteError(
        e instanceof AccountDeletionError ? e.message : t('privacy.deleteFailed')
      );
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={type.h1}>{t('privacy.title')}</Text>

      <Text style={[type.body, { color: colors.inkSecondary }]}>
        {t('privacy.intro')}
      </Text>
      <Pressable accessibilityRole="link" onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} hitSlop={8}>
        <Text style={styles.policyLink}>{t('privacy.readPolicy')}</Text>
      </Pressable>

      <View style={styles.section}>
        <Text style={[type.body, { fontFamily: fontFamily.bodyBold }]}>{t('privacy.exportTitle')}</Text>
        <Text style={type.caption}>
          {t('privacy.exportBody')}
        </Text>
        {(
          [
            { format: 'json', label: t('privacy.exportJson') },
            { format: 'csv', label: t('privacy.exportCsv') },
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
        <Text style={[type.body, { fontFamily: fontFamily.bodyBold }]}>{t('privacy.deleteTitle')}</Text>
        <Text style={type.caption}>
          {otherMembers > 0
            ? t('privacy.deleteBodyShared', { count: otherMembers })
            : t('privacy.deleteBodyAlone')}
        </Text>

        {confirmingDeletion ? (
          <>
            {needsPassword && (
              <View>
                <Text style={type.caption}>{t('privacy.typePassword')}</Text>
                <PasswordField value={password} onChangeText={setPassword} placeholder={t('auth.password')} />
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: deleting, busy: deleting }}
              disabled={deleting}
              onPress={deleteAccount}
              style={styles.deleteButton}
            >
              {deleting ? <ActivityIndicator color={colors.paper} /> : <Text style={styles.deleteLabel}>{t('privacy.deletePermanently')}</Text>}
            </Pressable>
            {!deleting && (
              <Pressable accessibilityRole="button" onPress={cancelDeletion} hitSlop={8} style={styles.cancel}>
                <Text style={styles.cancelLabel}>{t('common.cancel')}</Text>
              </Pressable>
            )}
          </>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => setConfirmingDeletion(true)} style={styles.deleteButton}>
            <Text style={styles.deleteLabel}>{t('privacy.deleteAccountAndData')}</Text>
          </Pressable>
        )}
        {deleteError && <Text style={styles.error}>{deleteError}</Text>}
      </View>
    </SafeAreaView>
  );
}

const useStyles = createStyles((colors, type) => ({
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
  policyLink: { fontFamily: fontFamily.bodyBold, fontSize: 13.5, color: colors.primary, textDecorationLine: 'underline' },
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
}));
