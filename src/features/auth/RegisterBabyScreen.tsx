import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { DateField } from '../../components/DateField';
import { fontFamily, radii, spacing } from '../../theme/tokens';
import { createStyles, useTheme } from '../../theme/ThemeProvider';
import { BabySex } from '../../types/records';

export type BabyInfo = {
  name: string;
  alreadyBorn: boolean;
  dueDate?: number;
  birthDate?: number;
  sex?: BabySex;
};

type Props = {
  onFinish: (baby: BabyInfo) => void;
};

const SEX_LABEL = {
  menina: 'auth.baby.sexes.menina',
  menino: 'auth.baby.sexes.menino',
  prefiro_nao_dizer: 'auth.baby.sexes.prefiro_nao_dizer',
} as const satisfies Record<BabySex, string>;

export function RegisterBabyScreen({ onFinish }: Props) {
  const { t } = useTranslation();
  const { colors, type } = useTheme();
  const styles = useStyles();
  const [alreadyBorn, setAlreadyBorn] = useState(false);
  const [name, setName] = useState('');
  const [dateMs, setDateMs] = useState<number | undefined>(undefined);
  const [sex, setSex] = useState<BabySex | undefined>(undefined);

  const handleFinish = () => {
    onFinish({
      name: name.trim(),
      alreadyBorn,
      dueDate: alreadyBorn ? undefined : dateMs,
      birthDate: alreadyBorn ? dateMs : undefined,
      sex,
    });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.progressRow}>
          <View style={[styles.progressSegment, { backgroundColor: colors.primary }]} />
          <View style={[styles.progressSegment, { backgroundColor: colors.primary }]} />
        </View>

        <View>
          <Text style={type.h1}>{t('auth.baby.title')}</Text>
          <Text style={[type.body, { color: colors.inkSecondary, marginTop: spacing.xs }]}>
            {t('auth.baby.subtitle')}
          </Text>
        </View>

        <View>
          <Text style={type.caption}>{t('auth.baby.born')}</Text>
          <View style={styles.toggleRow}>
            <Pressable
              onPress={() => setAlreadyBorn(true)}
              style={[styles.togglePill, { backgroundColor: alreadyBorn ? colors.action : colors.surfaceSunken }]}
            >
              <Text style={{ fontFamily: fontFamily.bodyMedium, fontSize: 13, color: alreadyBorn ? colors.actionInk : colors.inkSecondary }}>
                {t('auth.baby.yes')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setAlreadyBorn(false)}
              style={[styles.togglePill, { backgroundColor: !alreadyBorn ? colors.action : colors.surfaceSunken }]}
            >
              <Text style={{ fontFamily: fontFamily.bodyMedium, fontSize: 13, color: !alreadyBorn ? colors.actionInk : colors.inkSecondary }}>
                {t('auth.baby.notYet')}
              </Text>
            </Pressable>
          </View>
        </View>

        <View>
          <Text style={type.caption}>{t('auth.baby.nickname')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('common.optional')}
            placeholderTextColor={colors.inkMuted}
            style={[styles.input, { fontFamily: fontFamily.bodyBold, fontSize: 16 }]}
          />
        </View>

        <DateField
          label={alreadyBorn ? t('auth.baby.birthDate') : t('auth.baby.dueDate')}
          value={dateMs}
          onChange={setDateMs}
          placeholder={alreadyBorn ? t('auth.baby.whenBorn') : t('auth.baby.duePlaceholder')}
        />

        <View>
          <Text style={type.caption}>{t('auth.baby.sex')}</Text>
          <View style={styles.toggleRow}>
            {(Object.keys(SEX_LABEL) as BabySex[]).map((s) => (
              <Pressable
                key={s}
                onPress={() => setSex(s)}
                style={[styles.sexPill, { backgroundColor: sex === s ? colors.action : colors.surfaceSunken }]}
              >
                <Text
                  style={{
                    fontFamily: fontFamily.bodyMedium,
                    fontSize: sex === s ? 12 : 12,
                    color: sex === s ? colors.actionInk : colors.inkSecondary,
                    textAlign: 'center',
                  }}
                >
                  {t(SEX_LABEL[s])}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <BigButton label={t('auth.baby.finish')} background={colors.action} foreground={colors.actionInk} onPress={handleFinish} full />
        <Text style={[type.caption, { textAlign: 'center', color: colors.inkMuted, marginTop: spacing.sm }]}>{t('auth.step', { step: 2, total: 2 })}</Text>
      </View>
    </SafeAreaView>
  );
}

const useStyles = createStyles((colors, type) => ({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { flex: 1, gap: spacing.lg, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  progressRow: { flexDirection: 'row', gap: spacing.sm },
  progressSegment: { flex: 1, height: 4, borderRadius: 2 },
  toggleRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  togglePill: { flex: 1, paddingVertical: 10, borderRadius: radii.pill, alignItems: 'center' },
  sexPill: { flex: 1, paddingVertical: 10, paddingHorizontal: 4, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  input: {
    marginTop: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fontFamily.body,
    fontSize: 15,
    color: colors.ink,
  },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, paddingTop: spacing.sm },
}));
