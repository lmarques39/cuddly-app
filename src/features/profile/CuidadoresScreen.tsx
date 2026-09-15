import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { Card } from '../../components/Card';
import { inviteCaregiver } from '../caregivers/inviteCaregiver';
import { InviteCaregiverForm } from '../caregivers/InviteCaregiverForm';
import { useCuidadores } from '../caregivers/useCuidadores';
import { ROLE_LABEL, ParentRole } from '../auth/RegisterParentScreen';
import { colors, fontFamily, radii, spacing, type } from '../../theme/tokens';
import { Invite, Member } from '../../types/records';
import { formatSince } from '../../utils/time';

type Row = { kind: 'member'; data: Member } | { kind: 'invite'; data: Invite };

export function CuidadoresScreen() {
  const { members, pendingInvites, currentUid } = useCuidadores();
  const [inviting, setInviting] = useState(false);

  const rows: Row[] = [
    ...members.map((m): Row => ({ kind: 'member', data: m })),
    ...pendingInvites.map((i): Row => ({ kind: 'invite', data: i })),
  ];

  const handleInvite = async (email: string) => {
    await inviteCaregiver(email);
    setInviting(false);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={type.h1}>Cuidadores</Text>

      <FlatList
        data={rows}
        keyExtractor={(row) => (row.kind === 'member' ? `member-${row.data.id}` : `invite-${row.data.id}`)}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.lg }}
        ListEmptyComponent={<Text style={type.caption}>Ainda sem cuidadores.</Text>}
        renderItem={({ item }) =>
          item.kind === 'member' ? (
            <Card style={styles.row}>
              <View>
                <Text style={type.body}>{item.data.name}</Text>
                <Text style={type.caption}>{ROLE_LABEL[item.data.role as ParentRole] ?? item.data.role}</Text>
              </View>
              {item.data.id === currentUid && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Tu</Text>
                </View>
              )}
            </Card>
          ) : (
            <Card style={[styles.row, styles.pendingCard]}>
              <View>
                <Text style={type.body}>{item.data.email}</Text>
                <Text style={type.caption}>Convite pendente · Enviado {formatSince(item.data.invitedAt)}</Text>
              </View>
            </Card>
          )
        }
      />

      <View style={styles.footer}>
        {inviting ? <InviteCaregiverForm onInvite={handleInvite} /> : null}
        <BigButton
          label={inviting ? 'Fechar' : 'Convidar cuidador'}
          background={colors.action}
          foreground={colors.actionInk}
          onPress={() => setInviting((current) => !current)}
          full
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pendingCard: { backgroundColor: colors.surfaceSunken, borderStyle: 'dashed' },
  badge: {
    backgroundColor: colors.cream,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.creamInk },
  footer: { gap: spacing.sm, paddingBottom: spacing.md },
});
