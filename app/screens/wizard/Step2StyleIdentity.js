import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Image, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { colors, fonts, spacing } from '../../constants/theme';
import { useProjectStore } from '../../store/projectStore';
import GuideBanner from '../../components/wizard/GuideBanner';
import * as api from '../../services/api';

export default function Step2StyleIdentity({ projectId, onNext }) {
  const {
    convertedUrls, address, styleOptions, selectedStyle,
    setAddress, setStyleOptions, setSelectedStyle, setStyleIdentity,
  } = useProjectStore();

  const [analyzing, setAnalyzing] = useState(false);
  const [locking, setLocking] = useState(false);
  const [locked, setLocked] = useState(false);

  const heroUrl = convertedUrls['hero'] || null;

  const handleAnalyze = async () => {
    if (!address.trim()) {
      Alert.alert('Address Required', 'Please enter the property address.');
      return;
    }
    setAnalyzing(true);
    try {
      const res = await api.analyzeStyle(projectId, address.trim());
      setStyleOptions(res.styleOptions || []);
    } catch (err) {
      Alert.alert('Analysis Failed', err.message || 'Could not analyze the property. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLock = async () => {
    if (!selectedStyle) return;
    setLocking(true);
    try {
      const res = await api.lockStyle(projectId, selectedStyle.id, selectedStyle.label);
      setStyleIdentity(res.styleIdentity);
      setLocked(true);
      setTimeout(() => {
        useProjectStore.getState().setStep(3);
        onNext();
      }, 600);
    } catch (err) {
      Alert.alert('Lock Failed', err.message || 'Could not lock style. Please try again.');
    } finally {
      setLocking(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <GuideBanner step={2} />

      <Text style={styles.heading}>Style Identity</Text>

      {/* Hero thumbnail */}
      {heroUrl ? (
        <Image source={{ uri: heroUrl }} style={styles.heroThumb} />
      ) : (
        <View style={styles.heroPlaceholder}>
          <Text style={styles.heroPlaceholderText}>Hero photo not yet converted</Text>
        </View>
      )}

      {/* Address input */}
      <Text style={styles.fieldLabel}>PROPERTY ADDRESS</Text>
      <TextInput
        style={styles.input}
        value={address}
        onChangeText={setAddress}
        placeholder="123 Main St, Austin TX 78701"
        placeholderTextColor={colors.dim}
        editable={!analyzing && !locked}
      />

      {/* Analyze button */}
      {!styleOptions.length && (
        <TouchableOpacity
          onPress={handleAnalyze}
          disabled={analyzing || !address.trim() || !heroUrl}
          style={[styles.analyzeBtn, (analyzing || !address.trim() || !heroUrl) && styles.btnDisabled]}
        >
          {analyzing ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.bg} size="small" />
              <Text style={styles.analyzeBtnText}>ANALYZING...</Text>
            </View>
          ) : (
            <Text style={styles.analyzeBtnText}>ANALYZE →</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Style options */}
      {styleOptions.length > 0 && !locked && (
        <>
          <Text style={styles.sectionLabel}>SELECT YOUR RENOVATION STYLE</Text>
          {styleOptions.map((opt) => {
            const isSelected = selectedStyle?.id === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setSelectedStyle(opt)}
                style={[styles.styleCard, isSelected && styles.styleCardSelected]}
              >
                <View style={[styles.radio, isSelected && styles.radioSelected]} />
                <View style={styles.styleCardText}>
                  <Text style={[styles.styleLabel, isSelected && styles.styleLabelSelected]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.styleDesc}>{opt.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Lock button */}
          <TouchableOpacity
            onPress={handleLock}
            disabled={!selectedStyle || locking}
            style={[styles.lockBtn, (!selectedStyle || locking) && styles.btnDisabled]}
          >
            {locking ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.bg} size="small" />
                <Text style={styles.lockBtnText}>LOCKING...</Text>
              </View>
            ) : (
              <Text style={styles.lockBtnText}>LOCK STYLE →</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {/* Locked confirmation */}
      {locked && (
        <View style={styles.lockedBanner}>
          <Text style={styles.lockedText}>✓ STYLE LOCKED — {selectedStyle?.label}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 40 },
  heading: {
    fontSize: 18,
    fontFamily: fonts.serif,
    color: colors.text,
    marginBottom: 16,
  },
  heroThumb: {
    width: '100%',
    height: 180,
    borderRadius: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroPlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: 6,
    marginBottom: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderText: {
    fontSize: 11,
    fontFamily: fonts.mono,
    color: colors.muted,
  },
  fieldLabel: {
    fontSize: 9,
    fontFamily: fonts.mono,
    color: colors.muted,
    letterSpacing: 2,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 5,
    padding: 12,
    fontSize: 13,
    fontFamily: fonts.mono,
    color: colors.text,
    marginBottom: 16,
  },
  analyzeBtn: {
    backgroundColor: colors.gold,
    borderRadius: 5,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  btnDisabled: {
    backgroundColor: colors.border,
  },
  analyzeBtnText: {
    fontSize: 10,
    fontFamily: fonts.mono,
    letterSpacing: 2,
    color: colors.bg,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: fonts.mono,
    color: colors.muted,
    letterSpacing: 2,
    marginBottom: 12,
  },
  styleCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  styleCardSelected: {
    borderColor: colors.gold,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.muted,
    marginTop: 2,
  },
  radioSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.gold,
  },
  styleCardText: { flex: 1 },
  styleLabel: {
    fontSize: 13,
    fontFamily: fonts.serif,
    color: colors.text,
    marginBottom: 4,
  },
  styleLabelSelected: {
    color: colors.gold,
  },
  styleDesc: {
    fontSize: 11,
    fontFamily: fonts.mono,
    color: colors.muted,
    lineHeight: 16,
  },
  lockBtn: {
    backgroundColor: colors.gold,
    borderRadius: 5,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  lockBtnText: {
    fontSize: 10,
    fontFamily: fonts.mono,
    letterSpacing: 2,
    color: colors.bg,
    fontWeight: '700',
  },
  lockedBanner: {
    backgroundColor: '#1a3a1a',
    borderWidth: 1,
    borderColor: colors.green,
    borderRadius: 6,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  lockedText: {
    fontSize: 12,
    fontFamily: fonts.mono,
    color: colors.green,
    letterSpacing: 1,
  },
});
