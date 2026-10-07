import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { Card } from '../../components/Card';
import { RemoveEntryButton } from '../../components/RemoveEntryButton';
import { colors, fontFamily, radii, spacing, type } from '../../theme/tokens';
import { FoodEntry, FoodReaction } from '../../types/records';
import { parseDayOnly } from '../../utils/time';
import { useNow } from '../../utils/useNow';
import { useSavedFlash } from '../../utils/useSavedFlash';
import { useFoods } from './useFoods';

const DAY_MS = 24 * 60 * 60 * 1000;

type DayOption = 'today' | 'yesterday' | 'custom';

const REACTIONS: { value: FoodReaction; label: string }[] = [
  { value: 'nenhuma', label: 'Nenhuma' },
  { value: 'ligeira', label: 'Ligeira' },
  { value: 'forte', label: 'Forte' },
];

const PREPARATIONS = ['Puré', 'Papa', 'Pedaços'];

function reactionLabel(reaction: FoodReaction): string {
  return REACTIONS.find((r) => r.value === reaction)?.label ?? reaction;
}

function formatDay(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long' });
}

/** "DD/MM" for reopening an entry's day in the "Outro dia" field. */
function dayLabel(epochMs: number): string {
  const d = new Date(epochMs);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Midday of that day — the hour a food was tried doesn't matter, and noon keeps it on the right day across DST shifts. */
function middayOf(dayMs: number): number {
  const d = new Date(dayMs);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0).getTime();
}

/**
 * Introdução alimentar (#11, #104): log each new food the baby tries and
 * whether it caused a reaction — the list a pediatrician asks for. Foods
 * with a reaction are pulled to the top so they're never buried.
 */
export function FoodsScreen() {
  const { entries, withReaction, isAlreadyIntroduced, save, update, remove } = useFoods();
  const saved = useSavedFlash();
  const now = useNow(60000);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [food, setFood] = useState('');
  const [dayOption, setDayOption] = useState<DayOption>('today');
  const [customDate, setCustomDate] = useState('');
  const [preparation, setPreparation] = useState('');
  const [reaction, setReaction] = useState<FoodReaction>('nenhuma');
  const [reactionNotes, setReactionNotes] = useState('');

  const dayMs = dayOption === 'today' ? now : dayOption === 'yesterday' ? now - DAY_MS : parseDayOnly(customDate, now);
  const customDateInvalid = dayOption === 'custom' && customDate.trim().length > 0 && dayMs == null;
  const editing = entries.find((e) => e.id === editingId) ?? null;
  // Only warn for a *different* entry with the same food — not the one being edited.
  const duplicate = food.trim().length > 0 && isAlreadyIntroduced(food) && (!editing || editing.food.trim().toLowerCase() !== food.trim().toLowerCase());
  const canSave = food.trim().length > 0 && dayMs != null;

  const resetForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setFood('');
    setDayOption('today');
    setCustomDate('');
    setPreparation('');
    setReaction('nenhuma');
    setReactionNotes('');
  };

  const submit = async () => {
    if (!canSave || dayMs == null) return;
    const notes = reaction !== 'nenhuma' ? reactionNotes.trim() : '';
    const fields = {
      food: food.trim(),
      introducedAt: middayOf(dayMs),
      reaction,
      ...(preparation.trim() ? { preparation: preparation.trim() } : {}),
      ...(notes ? { reactionNotes: notes } : {}),
    };
    if (editingId != null) {
      update({ id: editingId, ...fields });
    } else {
      await save(fields);
    }
    resetForm();
    saved.flash();
  };

  const startEdit = (entry: FoodEntry) => {
    setEditingId(entry.id);
    setFood(entry.food);
    setDayOption('custom');
    setCustomDate(dayLabel(entry.introducedAt));
    setPreparation(entry.preparation ?? '');
    setReaction(entry.reaction);
    setReactionNotes(entry.reactionNotes ?? '');
    setFormOpen(true);
  };

  const removeEntry = (id: string) => {
    remove(id);
    if (editingId === id) resetForm();
  };

  const renderEntry = (entry: FoodEntry) => (
    <Card key={entry.id} style={[styles.row, entry.reaction !== 'nenhuma' && styles.rowWithReaction]}>
      <Pressable style={styles.rowText} onPress={() => startEdit(entry)} accessibilityLabel={`${entry.food}, editar`}>
        <Text style={type.body}>{entry.food}</Text>
        <Text style={type.caption}>
          {formatDay(entry.introducedAt)}
          {entry.preparation ? ` · ${entry.preparation}` : ''}
          {' · toca para editar'}
        </Text>
        {entry.reaction !== 'nenhuma' && (
          <Text style={styles.reactionText}>
            Reação {reactionLabel(entry.reaction).toLowerCase()}
            {entry.reactionNotes ? `: ${entry.reactionNotes}` : ''}
          </Text>
        )}
      </Pressable>
      <RemoveEntryButton onRemove={() => removeEntry(entry.id)} />
    </Card>
  );

  const withoutReaction = entries.filter((e) => e.reaction === 'nenhuma');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={type.h1}>Introdução alimentar</Text>

        <Card style={styles.summary}>
          <Text style={type.caption}>Alimentos já introduzidos</Text>
          <Text style={type.data}>{entries.length}</Text>
          {withReaction.length > 0 && (
            <Text style={styles.reactionText}>
              {withReaction.length} com reação
            </Text>
          )}
        </Card>

        {saved.visible && <Text style={styles.savedLabel}>Guardado ✓</Text>}

        {formOpen ? (
          <Card style={{ gap: spacing.md }}>
            <View style={styles.banner}>
              <Text style={styles.bannerLabel}>{editingId != null ? 'A editar alimento' : 'Novo alimento'}</Text>
              <Pressable onPress={resetForm} hitSlop={8}>
                <Text style={styles.bannerCancel}>Cancelar</Text>
              </Pressable>
            </View>

            <View>
              <Text style={type.caption}>Alimento</Text>
              <TextInput
                value={food}
                onChangeText={setFood}
                placeholder="ex: Cenoura"
                placeholderTextColor={colors.inkMuted}
                style={styles.input}
              />
              {duplicate && <Text style={styles.hint}>Este alimento já foi registado — podes guardar na mesma.</Text>}
            </View>

            <View>
              <Text style={type.caption}>Dia</Text>
              <View style={styles.pillRow}>
                {(['today', 'yesterday', 'custom'] as DayOption[]).map((option) => (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected: dayOption === option }}
                    onPress={() => setDayOption(option)}
                    style={[styles.pill, dayOption === option && styles.pillOn]}
                  >
                    <Text style={[styles.pillLabel, dayOption === option && styles.pillLabelOn]}>
                      {option === 'today' ? 'Hoje' : option === 'yesterday' ? 'Ontem' : 'Outro dia'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {dayOption === 'custom' && (
                <TextInput
                  value={customDate}
                  onChangeText={setCustomDate}
                  placeholder="DD/MM"
                  placeholderTextColor={colors.inkMuted}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  style={styles.input}
                />
              )}
              {customDateInvalid && <Text style={styles.fieldError}>Data inválida — usa o formato DD/MM.</Text>}
            </View>

            <View>
              <Text style={type.caption}>Preparação (opcional)</Text>
              <View style={styles.pillRow}>
                {PREPARATIONS.map((option) => (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected: preparation === option }}
                    onPress={() => setPreparation((prev) => (prev === option ? '' : option))}
                    style={[styles.pill, preparation === option && styles.pillOn]}
                  >
                    <Text style={[styles.pillLabel, preparation === option && styles.pillLabelOn]}>{option}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View>
              <Text style={type.caption}>Reação</Text>
              <View style={styles.pillRow}>
                {REACTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: reaction === option.value }}
                    onPress={() => setReaction(option.value)}
                    style={[
                      styles.pill,
                      reaction === option.value && (option.value === 'nenhuma' ? styles.pillOn : styles.pillReactionOn),
                    ]}
                  >
                    <Text style={[styles.pillLabel, reaction === option.value && styles.pillLabelOn]}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
              {reaction !== 'nenhuma' && (
                <TextInput
                  value={reactionNotes}
                  onChangeText={setReactionNotes}
                  placeholder="O que notaste? (ex: manchas na cara, vómito)"
                  placeholderTextColor={colors.inkMuted}
                  multiline
                  style={[styles.input, styles.notesInput]}
                />
              )}
            </View>

            <BigButton
              label={editingId != null ? 'Guardar alterações' : 'Guardar alimento'}
              background={canSave ? colors.domain.foods.bg : colors.surfaceSunken}
              foreground={canSave ? colors.domain.foods.ink : colors.inkMuted}
              onPress={submit}
              full
            />
          </Card>
        ) : (
          <BigButton
            label="+ Novo alimento"
            background={colors.domain.foods.bg}
            foreground={colors.domain.foods.ink}
            onPress={() => setFormOpen(true)}
            full
          />
        )}

        {entries.length === 0 ? (
          <Text style={type.caption}>Ainda sem alimentos registados. Regista cada alimento novo que o bebé experimenta.</Text>
        ) : (
          <>
            {withReaction.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Com reação</Text>
                {withReaction.map(renderEntry)}
              </View>
            )}
            {withoutReaction.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sem reação</Text>
                {withoutReaction.map(renderEntry)}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  scroll: { gap: spacing.md, paddingBottom: spacing.xl },
  summary: { alignItems: 'center', gap: spacing.xs },
  savedLabel: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.ink, textAlign: 'center' },
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceSunken,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bannerLabel: { fontFamily: fontFamily.bodyBold, fontSize: 12.5, color: colors.ink },
  bannerCancel: { fontFamily: fontFamily.bodyMedium, fontSize: 12.5, color: colors.coral },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
    fontFamily: fontFamily.bodyMedium,
    fontSize: 15,
    color: colors.ink,
  },
  notesInput: { minHeight: 64, textAlignVertical: 'top' },
  hint: { marginTop: spacing.xs, fontFamily: fontFamily.bodyMedium, fontSize: 12.5, color: colors.inkSecondary },
  fieldError: { marginTop: spacing.xs, fontFamily: fontFamily.bodyMedium, fontSize: 12.5, color: colors.coral },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillOn: { backgroundColor: colors.domain.foods.bg, borderColor: colors.inkBorder },
  pillReactionOn: { backgroundColor: colors.coral, borderColor: colors.inkBorder },
  pillLabel: { fontFamily: fontFamily.bodyMedium, fontSize: 13.5, color: colors.ink },
  pillLabelOn: { fontFamily: fontFamily.bodyBold },
  section: { gap: spacing.sm },
  sectionTitle: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.inkSecondary, textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowWithReaction: { borderColor: colors.coral, borderWidth: 2 },
  rowText: { flex: 1 },
  reactionText: { fontFamily: fontFamily.bodyBold, fontSize: 12.5, color: colors.coral },
});
