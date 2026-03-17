import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  Animated, StyleSheet,
} from 'react-native';
import { colors, fonts, spacing } from '../../constants/theme';

export default function PhotoCard({ room, localUri, isSelected, isConverting, isConverted, isMaxed, onPress }) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinLoopRef = useRef(null);

  useEffect(() => {
    if (isConverting) {
      spinLoopRef.current = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        })
      );
      spinLoopRef.current.start();
    } else {
      spinLoopRef.current?.stop();
      spinAnim.setValue(0);
    }
    return () => spinLoopRef.current?.stop();
  }, [isConverting]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const borderColor = isSelected
    ? isConverting ? colors.muted : colors.gold
    : colors.border;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={room.required || isMaxed || isConverting}
      activeOpacity={0.8}
      style={[
        styles.card,
        { borderColor },
        isMaxed && styles.maxed,
      ]}
    >
      {/* Photo or placeholder */}
      <View style={styles.imageArea}>
        {localUri ? (
          <Image source={{ uri: localUri }} style={[styles.image, !isSelected && styles.dimImage]} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderPlus}>+</Text>
          </View>
        )}

        {/* Converting overlay */}
        {isConverting && (
          <View style={styles.overlay}>
            <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
            <Text style={styles.convertingLabel}>CONVERTING 16:9</Text>
          </View>
        )}

        {/* 16:9 done badge */}
        {isConverted && !isConverting && (
          <View style={styles.convertedBadge}>
            <Text style={styles.convertedText}>16:9 ✓</Text>
          </View>
        )}
      </View>

      {/* Label row */}
      <View style={styles.labelRow}>
        <Text style={styles.roomLabel} numberOfLines={1}>{room.label}</Text>
        {room.tag && (
          <View style={[styles.tag, room.tag === 'Required' && styles.tagRequired]}>
            <Text style={styles.tagText}>{room.tag.toUpperCase()}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  maxed: {
    opacity: 0.4,
  },
  imageArea: {
    height: 110,
    position: 'relative',
    backgroundColor: colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  dimImage: {
    opacity: 0.4,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderPlus: {
    fontSize: 24,
    color: colors.dim,
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(9,9,16,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  spinner: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: colors.gold,
    borderTopColor: 'transparent',
    borderRadius: 9,
  },
  convertingLabel: {
    fontSize: 8,
    fontFamily: fonts.mono,
    color: colors.gold,
    letterSpacing: 1,
  },
  convertedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.gold,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  convertedText: {
    fontSize: 8,
    fontFamily: fonts.mono,
    color: colors.bg,
    fontWeight: '700',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    gap: 4,
  },
  roomLabel: {
    fontSize: 9,
    fontFamily: fonts.mono,
    color: colors.text,
    flex: 1,
  },
  tag: {
    backgroundColor: colors.border,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  tagRequired: {
    backgroundColor: '#3a1a1a',
    borderWidth: 1,
    borderColor: '#6a2a2a',
  },
  tagText: {
    fontSize: 7,
    fontFamily: fonts.mono,
    color: colors.muted,
    letterSpacing: 1,
  },
});
