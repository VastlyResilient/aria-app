import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../../constants/theme';
import { STEPS } from '../../constants/rooms';

export default function StepProgressBar({ currentStep, onStepPress }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.container}
    >
      {STEPS.map((s, i) => {
        const isCompleted = s.id < currentStep;
        const isCurrent = s.id === currentStep;
        const isFuture = s.id > currentStep;

        return (
          <React.Fragment key={s.id}>
            <TouchableOpacity
              onPress={() => isCompleted && onStepPress(s.id)}
              disabled={!isCompleted}
              style={[styles.stepItem, isFuture && styles.dimmed]}
            >
              <View style={[
                styles.circle,
                isCurrent && styles.circleCurrent,
                isCompleted && styles.circleCompleted,
              ]}>
                <Text style={[
                  styles.circleText,
                  isCurrent && styles.circleTextCurrent,
                  isCompleted && styles.circleTextCompleted,
                ]}>
                  {isCompleted ? '✓' : s.id}
                </Text>
              </View>
              <Text style={[
                styles.label,
                isCurrent && styles.labelCurrent,
                isCompleted && styles.labelCompleted,
              ]}>
                {s.label.toUpperCase()}
              </Text>
            </TouchableOpacity>
            {i < STEPS.length - 1 && (
              <View style={styles.connector} />
            )}
          </React.Fragment>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dimmed: {
    opacity: 0.28,
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.border,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCurrent: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  circleCompleted: {
    backgroundColor: '#1a3a1a',
    borderColor: colors.green,
  },
  circleText: {
    fontSize: 9,
    fontFamily: fonts.mono,
    fontWeight: '700',
    color: '#4a4a6a',
  },
  circleTextCurrent: {
    color: colors.bg,
  },
  circleTextCompleted: {
    color: colors.green,
  },
  label: {
    fontSize: 9,
    letterSpacing: 1,
    fontFamily: fonts.mono,
    color: '#4a4a6a',
    whiteSpace: 'nowrap',
  },
  labelCurrent: {
    color: colors.gold,
  },
  labelCompleted: {
    color: colors.green,
  },
  connector: {
    width: 18,
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 5,
  },
});
