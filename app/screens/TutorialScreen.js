import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fonts, spacing } from '../constants/theme';
import { TUTORIAL_SLIDES } from '../constants/rooms';

const STORAGE_KEY = 'aria_tutorial_complete';

export default function TutorialScreen({ onComplete }) {
  const [slide, setSlide] = useState(0);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === 'true') {
        onComplete();
      } else {
        setChecked(true);
      }
    });
  }, []);

  if (!checked) return null;

  const s = TUTORIAL_SLIDES[slide];
  const isLast = slide === TUTORIAL_SLIDES.length - 1;

  const handleNext = async () => {
    if (isLast) {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
      onComplete();
    } else {
      setSlide((p) => p + 1);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
    onComplete();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>ARIA</Text>
        <Text style={styles.divider}>|</Text>
        <Text style={styles.subtitle}>LISTING TRANSFORMATION VIDEO</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Dot indicators */}
        <View style={styles.dots}>
          {TUTORIAL_SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === slide && styles.dotActive]}
            />
          ))}
        </View>

        <Text style={styles.icon}>{s.icon}</Text>
        <Text style={styles.heading}>{s.heading}</Text>
        <Text style={styles.body}>{s.body}</Text>

        {/* Buttons */}
        <View style={styles.buttons}>
          {slide > 0 && (
            <TouchableOpacity onPress={() => setSlide((p) => p - 1)} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← BACK</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
            <Text style={styles.nextBtnText}>
              {isLast ? 'START BUILDING →' : 'NEXT →'}
            </Text>
          </TouchableOpacity>
        </View>

        {!isLast && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipBtnText}>skip intro</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
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
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 36,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.gold,
  },
  icon: {
    fontSize: 34,
    color: colors.gold,
    marginBottom: 18,
  },
  heading: {
    fontSize: 22,
    fontFamily: fonts.serif,
    color: colors.text,
    marginBottom: 14,
    textAlign: 'center',
    lineHeight: 30,
  },
  body: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: fonts.mono,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 44,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  backBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 5,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  backBtnText: {
    fontSize: 10,
    fontFamily: fonts.mono,
    letterSpacing: 2,
    color: colors.muted,
  },
  nextBtn: {
    backgroundColor: colors.gold,
    borderRadius: 5,
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  nextBtnText: {
    fontSize: 10,
    fontFamily: fonts.mono,
    letterSpacing: 2,
    color: colors.bg,
    fontWeight: '700',
  },
  skipBtn: {
    marginTop: 18,
  },
  skipBtnText: {
    fontSize: 10,
    fontFamily: fonts.mono,
    letterSpacing: 1,
    color: colors.dim,
    textDecorationLine: 'underline',
  },
});
