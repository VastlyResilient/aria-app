import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../../constants/theme';
import { STEPS } from '../../constants/rooms';

export default function GuideBanner({ step }) {
  const stepData = STEPS.find((s) => s.id === step);
  if (!stepData) return null;
  const { guide } = stepData;

  return (
    <View style={styles.container}>
      <View style={styles.columns}>
        <View style={styles.col}>
          <Text style={styles.goldLabel}>WHAT TO DO</Text>
          <Text style={styles.body}>{guide.what}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.greenLabel}>WHY IT MATTERS</Text>
          <Text style={styles.body}>{guide.why}</Text>
        </View>
      </View>
      <View style={styles.tipRow}>
        <Text style={styles.tipIcon}>💡</Text>
        <Text style={styles.tipText}>{guide.tip}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0c0c1a',
    borderWidth: 1,
    borderColor: '#1a1a2e',
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    borderRadius: 6,
    padding: 14,
    marginBottom: spacing.lg,
  },
  columns: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
  },
  col: {
    flex: 1,
  },
  goldLabel: {
    fontSize: 9,
    fontFamily: fonts.mono,
    color: colors.gold,
    letterSpacing: 2,
    marginBottom: 5,
  },
  greenLabel: {
    fontSize: 9,
    fontFamily: fonts.mono,
    color: colors.green,
    letterSpacing: 2,
    marginBottom: 5,
  },
  body: {
    fontSize: 11,
    color: '#9a9ab0',
    fontFamily: fonts.mono,
    lineHeight: 18,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  tipIcon: {
    fontSize: 12,
  },
  tipText: {
    fontSize: 10,
    color: colors.muted,
    fontFamily: fonts.mono,
    lineHeight: 16,
    flex: 1,
  },
});
