import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../../constants/theme';

export default function WizardHeader({ onGuidePress }) {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>ARIA</Text>
      <Text style={styles.divider}>|</Text>
      <Text style={styles.subtitle}>LISTING TRANSFORMATION VIDEO</Text>
      <TouchableOpacity onPress={onGuidePress} style={styles.guideBtn}>
        <Text style={styles.guideBtnText}>GUIDE ☰</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  logo: {
    fontSize: 12,
    letterSpacing: 4,
    color: colors.gold,
    fontFamily: fonts.mono,
    fontWeight: '700',
  },
  divider: {
    color: colors.border,
    fontSize: 16,
  },
  subtitle: {
    fontSize: 10,
    letterSpacing: 2,
    color: colors.muted,
    fontFamily: fonts.mono,
    flex: 1,
  },
  guideBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 5,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  guideBtnText: {
    fontSize: 9,
    letterSpacing: 2,
    color: colors.muted,
    fontFamily: fonts.mono,
  },
});
