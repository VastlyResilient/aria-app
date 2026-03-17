import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Animated,
  Dimensions, StyleSheet, ScrollView,
} from 'react-native';
import { colors, fonts, spacing } from '../../constants/theme';
import { STEPS } from '../../constants/rooms';

const PANEL_WIDTH = 290;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SideGuidePanel({ isOpen, onClose, currentStep }) {
  const slideAnim = useRef(new Animated.Value(PANEL_WIDTH)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : PANEL_WIDTH,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={onClose}
          activeOpacity={1}
        />
      )}
      <Animated.View
        style={[styles.panel, { transform: [{ translateX: slideAnim }] }]}
      >
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>STEP GUIDE</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {STEPS.map((s) => {
            const isActive = s.id === currentStep;
            return (
              <View key={s.id} style={[styles.stepBlock, !isActive && styles.stepDimmed]}>
                <View style={styles.stepHeaderRow}>
                  <View style={[styles.stepCircle, isActive && styles.stepCircleActive]}>
                    <Text style={[styles.stepNum, isActive && styles.stepNumActive]}>{s.id}</Text>
                  </View>
                  <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                    {s.label.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepWhat}>{s.guide.what}</Text>
                  <View style={styles.tipBox}>
                    <Text style={styles.tipLabel}>💡 TIP</Text>
                    <Text style={styles.tipText}>{s.guide.tip}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 99,
  },
  panel: {
    position: 'absolute',
    top: 0, right: 0, bottom: 0,
    width: PANEL_WIDTH,
    backgroundColor: '#0b0b16',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    zIndex: 100,
    padding: 22,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 26,
  },
  panelTitle: {
    fontSize: 10,
    letterSpacing: 3,
    color: colors.gold,
    fontFamily: fonts.mono,
  },
  closeBtn: {
    color: colors.muted,
    fontSize: 17,
  },
  stepBlock: {
    marginBottom: 26,
  },
  stepDimmed: {
    opacity: 0.38,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 9,
  },
  stepCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: colors.gold,
  },
  stepNum: {
    fontSize: 9,
    fontFamily: fonts.mono,
    fontWeight: '700',
    color: colors.muted,
  },
  stepNumActive: {
    color: colors.bg,
  },
  stepLabel: {
    fontSize: 10,
    fontFamily: fonts.mono,
    letterSpacing: 1,
    color: colors.muted,
  },
  stepLabelActive: {
    color: colors.gold,
  },
  stepContent: {
    paddingLeft: 28,
  },
  stepWhat: {
    fontSize: 11,
    color: '#9a9ab0',
    lineHeight: 18,
    fontFamily: fonts.mono,
    marginBottom: 8,
  },
  tipBox: {
    backgroundColor: '#12121e',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 9,
  },
  tipLabel: {
    fontSize: 9,
    color: colors.gold,
    fontFamily: fonts.mono,
    letterSpacing: 1,
    marginBottom: 3,
  },
  tipText: {
    fontSize: 10,
    color: colors.muted,
    lineHeight: 16,
    fontFamily: fonts.mono,
  },
});
