import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppearancePicker } from '../../components/AppearancePicker';
import { LanguagePicker } from '../../components/LanguagePicker';
import { Card } from '../../components/Card';
import { seedDemoData } from '../../dev/seedDemoData';
import { PerfilStackParamList } from '../../navigation/types';
import { clearAllLocalData } from '../../storage/storage';
import { clearFamilyData } from '../../storage/sync';
import { auth } from '../../services/firebase';
import { fontFamily, radii, spacing } from '../../theme/tokens';
import { createStyles, useTheme } from '../../theme/ThemeProvider';
import { signOutOfGoogle } from '../auth/useGoogleSignIn';
import { useSavedFlash } from '../../utils/useSavedFlash';
import { usesPassword } from './deleteAccount';
import { useCurrentMember } from './useCurrentMember';

type Nav = NativeStackNavigationProp<PerfilStackParamList, 'PerfilHub'>;

const SETTINGS = [
  { label: 'profile.settings.baby', route: 'PerfilDoBebe' },
  { label: 'profile.settings.appointments', route: 'ConsultasMedicas' },
  { label: 'profile.settings.caregivers', route: 'Cuidadores' },
  { label: 'profile.settings.notifications', route: 'Notificacoes' },
  { label: 'profile.settings.privacy', route: 'PrivacidadeDados' },
] as const satisfies readonly { label: string; route: keyof PerfilStackParamList }[];

export function PerfilScreen() {
  const { t } = useTranslation();
  const { colors, type } = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState<string | null>(auth.currentUser?.email ?? null);
  const { member, updateName } = useCurrentMember();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const { visible: showSaved, flash } = useSavedFlash();

  useEffect(() => onAuthStateChanged(auth, (user) => setEmail(user?.email ?? null)), []);

  const startEditingName = () => {
    setNameDraft(member?.name ?? '');
    setEditingName(true);
  };

  const saveName = () => {
    if (!nameDraft.trim()) return;
    updateName(nameDraft.trim());
    setEditingName(false);
    flash();
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={type.h1}>{t('profile.title')}</Text>

      <Card style={{ gap: spacing.xs }}>
        {editingName ? (
          <View style={{ gap: spacing.sm }}>
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder={t('profile.namePlaceholder')}
              placeholderTextColor={colors.inkMuted}
              style={styles.nameInput}
              autoFocus
            />
            <View style={styles.nameEditActions}>
              <Pressable onPress={saveName} style={styles.smallButton}>
                <Text style={styles.smallButtonLabel}>{t('common.save')}</Text>
              </Pressable>
              <Pressable onPress={() => setEditingName(false)} hitSlop={8}>
                <Text style={type.caption}>{t('common.cancel')}</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable onPress={startEditingName} style={styles.nameRow}>
            <Text style={[type.body, { fontFamily: fontFamily.bodyBold }]}>
              {member?.name || t('profile.addName')}
            </Text>
            <Text style={styles.editLink}>{t('common.edit')}</Text>
          </Pressable>
        )}
        <Text style={type.body}>{email ?? t('profile.notSignedIn')}</Text>
        <Text style={type.caption}>
          {auth.currentUser && !usesPassword(auth.currentUser) ? t('profile.googleAccount') : t('profile.passwordAccount')}
        </Text>
        {showSaved && <Text style={styles.savedText}>{t('profile.savedOk')}</Text>}
      </Card>

      <View style={{ gap: spacing.sm }}>
        {SETTINGS.map((item) => (
          <Pressable key={item.route} onPress={() => navigation.navigate(item.route)}>
            <Card style={styles.row}>
              <Text style={type.body}>{t(item.label)}</Text>
              <Text style={type.caption}>›</Text>
            </Card>
          </Pressable>
        ))}
      </View>

      <AppearancePicker />
      <LanguagePicker />

      <Pressable
        onPress={async () => {
          await signOutOfGoogle();
          await signOut(auth);
        }}
        style={styles.logoutButton}
      >
        <Text style={styles.logoutLabel}>{t('profile.signOut')}</Text>
      </Pressable>

      {(__DEV__ || process.env.EXPO_PUBLIC_ENABLE_DEV_TOOLS === 'true') && (
        <View style={{ gap: spacing.sm }}>
          <Text style={type.caption}>{t('profile.devTools')}</Text>
          <Pressable onPress={() => seedDemoData()} style={styles.devButton}>
            <Text style={styles.devLabel}>{t('profile.seedDemo')}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              clearAllLocalData();
              clearFamilyData();
            }}
            style={styles.devButton}
          >
            <Text style={styles.devLabel}>{t('profile.clearLocal')}</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const useStyles = createStyles((colors, type) => ({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoutButton: {
    minHeight: 52,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutLabel: { fontFamily: fontFamily.bodyBold, fontSize: 14.5, color: colors.coral },
  devButton: {
    minHeight: 48,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devLabel: { fontFamily: fontFamily.bodyMedium, fontSize: 13.5, color: colors.inkSecondary },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editLink: { fontFamily: fontFamily.bodyBold, fontSize: 12.5, color: colors.primary },
  nameInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fontFamily.bodyMedium,
    fontSize: 15,
    color: colors.ink,
  },
  nameEditActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  smallButton: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 8 },
  smallButtonLabel: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.primaryInk },
  savedText: { fontFamily: fontFamily.bodyMedium, fontSize: 13, color: colors.accent },
}));
