import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Image, StyleSheet, ActivityIndicator, Alert, FlatList,
} from 'react-native';
import { colors, fonts, spacing } from '../../constants/theme';
import { useProjectStore } from '../../store/projectStore';
import GuideBanner from '../../components/wizard/GuideBanner';
import * as api from '../../services/api';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export default function Step2StyleIdentity({ projectId, onNext }) {
  const {
    convertedUrls, address, styleOptions, selectedStyle, stylePreviews,
    setAddress, setStyleOptions, setSelectedStyle, setStyleIdentity, setStylePreview,
  } = useProjectStore();

  const [analyzing, setAnalyzing] = useState(false);
  const [locking, setLocking] = useState(false);
  const [locked, setLocked] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [previewLoading, setPreviewLoading] = useState({});
  const debounceRef = useRef(null);
  const heroUrl = convertedUrls['hero'] || null;

  // ── Address autocomplete ──────────────────────────────────────────────────
  const handleAddressChange = (val) => {
    setAddress(val);
    setSuggestions([]);
    clearTimeout(debounceRef.current);
    if (val.length < 4) return;
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${NOMINATIM_URL}?q=${encodeURIComponent(val)}&format=json&addressdetails=1&countrycodes=us&limit=5`,
          { headers: { 'User-Agent': 'ARIA-App/1.0' } }
        );
        const data = await res.json();
        setSuggestions(data.map(d => d.display_name));
      } catch (_) {}
    }, 400);
  };

  const selectSuggestion = (s) => {
    setAddress(s);
    setSuggestions([]);
  };

  // ── Style analyze ─────────────────────────────────────────────────────────
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
      Alert.alert('Analysis Failed', err.message || 'Could not analyze the property.');
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Style preview ─────────────────────────────────────────────────────────
  const handlePreview = async (opt) => {
    if (stylePreviews[opt.id] || previewLoading[opt.id]) return;
    setPreviewLoading(p => ({ ...p, [opt.id]: true }));
    try {
      const res = await api.previewStyle(projectId, opt.id, opt.label, opt.description);
      setStylePreview(opt.id, res.url);
    } catch (err) {
      Alert.alert('Preview Failed', err.message || 'Could not generate preview.');
    } finally {
      setPreviewLoading(p => ({ ...p, [opt.id]: false }));
    }
  };

  // ── Style lock ────────────────────────────────────────────────────────────
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
      Alert.alert('Lock Failed', err.message || 'Could not lock style.');
    } finally {
      setLocking(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <GuideBanner step={2} />
      <Text style={styles.heading}>Style Identity</Text>

      {heroUrl ? (
        <Image source={{ uri: heroUrl }} style={styles.heroThumb} />
      ) : (
        <View style={styles.heroPlaceholder}>
          <Text style={styles.heroPlaceholderText}>Hero photo not yet converted</Text>
        </View>
      )}

      <Text style={styles.fieldLabel}>PROPERTY ADDRESS</Text>
      <TextInput
        style={styles.input}
        value={address}
        onChangeText={handleAddressChange}
        placeholder="123 Main St, Austin TX 78701"
        placeholderTextColor={colors.dim}
        editable={!analyzing && !locked}
      />

      {suggestions.length > 0 && (
        <View style={styles.dropdown}>
          {suggestions.map((s, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => selectSuggestion(s)}
              style={[styles.suggestion, i < suggestions.length - 1 && styles.suggestionBorder]}
            >
              <Text style={styles.suggestionText} numberOfLines={2}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

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

      {styleOptions.length > 0 && !locked && (
        <>
          <Text style={styles.sectionLabel}>SELECT YOUR RENOVATION STYLE</Text>
          {styleOptions.map((opt) => {
            const isSelected = selectedStyle?.id === opt.id;
            const previewUrl = stylePreviews[opt.id];
            const isLoading = previewLoading[opt.id];
            return (
              <View key={opt.id} style={styles.styleCardWrapper}>
                <TouchableOpacity
                  onPress={() => setSelectedStyle(opt)}
                  style={[styles.styleCard, isSelected && styles.styleCardSelected]}
                >
                  <View style={[styles.radio, isSelected && styles.radioSelected]} />
                  <View style={styles.styleCardText}>
                    <Text style={[styles.styleLabel, isSelected && styles.styleLabelSelected]}>{opt.label}</Text>
                    <Text style={styles.styleDesc}>{opt.description}</Text>
                    <TouchableOpacity
                      onPress={() => handlePreview(opt)}
                      disabled={!!previewUrl || isLoading}
                      style={styles.previewBtn}
                    >
                      {isLoading ? (
                        <View style={styles.loadingRow}>
                          <ActivityIndicator size="small" color={colors.muted} />
                          <Text style={styles.previewBtnText}>GENERATING...</Text>
                        </View>
                      ) : (
                        <Text style={[styles.previewBtnText, previewUrl && { color: colors.green }]}>
                          {previewUrl ? '✓ PREVIEW READY' : 'PREVIEW STYLE'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>

                {(previewUrl || isLoading) && (
                  <View style={styles.previewImageWrapper}>
                    {isLoading && (
                      <View style={styles.previewLoading}>
                        <ActivityIndicator color={colors.gold} />
                        <Text style={styles.previewLoadingText}>Generating {opt.label} preview...</Text>
                      </View>
                    )}
                    {previewUrl && (
                      <Image source={{ uri: previewUrl }} style={styles.previewImage} resizeMode="cover" />
                    )}
                  </View>
                )}
              </View>
            );
          })}

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
  heading: { fontSize: 18, fontFamily: fonts.serif, color: colors.text, marginBottom: 16 },
  heroThumb: { width: '100%', height: 180, borderRadius: 6, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  heroPlaceholder: { width: '100%', height: 180, borderRadius: 6, marginBottom: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  heroPlaceholderText: { fontSize: 11, fontFamily: fonts.mono, color: colors.muted },
  fieldLabel: { fontSize: 9, fontFamily: fonts.mono, color: colors.muted, letterSpacing: 2, marginBottom: 8 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 5, padding: 12, fontSize: 13, fontFamily: fonts.mono, color: colors.text, marginBottom: 4 },
  dropdown: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 5, marginBottom: 12, overflow: 'hidden' },
  suggestion: { padding: 12 },
  suggestionBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  suggestionText: { fontSize: 12, fontFamily: fonts.mono, color: colors.text, lineHeight: 16 },
  analyzeBtn: { backgroundColor: colors.gold, borderRadius: 5, paddingVertical: 14, alignItems: 'center', marginBottom: 24, marginTop: 12 },
  btnDisabled: { backgroundColor: colors.border },
  analyzeBtnText: { fontSize: 10, fontFamily: fonts.mono, letterSpacing: 2, color: colors.bg, fontWeight: '700' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionLabel: { fontSize: 9, fontFamily: fonts.mono, color: colors.muted, letterSpacing: 2, marginBottom: 12 },
  styleCardWrapper: { marginBottom: 12 },
  styleCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 6, padding: 14, gap: 12 },
  styleCardSelected: { borderColor: colors.gold },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: colors.muted, marginTop: 2 },
  radioSelected: { borderColor: colors.gold, backgroundColor: colors.gold },
  styleCardText: { flex: 1 },
  styleLabel: { fontSize: 13, fontFamily: fonts.serif, color: colors.text, marginBottom: 4 },
  styleLabelSelected: { color: colors.gold },
  styleDesc: { fontSize: 11, fontFamily: fonts.mono, color: colors.muted, lineHeight: 16, marginBottom: 10 },
  previewBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4, borderWidth: 1, borderColor: colors.border, alignSelf: 'flex-start' },
  previewBtnText: { fontSize: 10, fontFamily: fonts.mono, letterSpacing: 1, color: colors.muted },
  previewImageWrapper: { borderWidth: 1, borderColor: colors.border, borderTopWidth: 0, borderBottomLeftRadius: 6, borderBottomRightRadius: 6, overflow: 'hidden', backgroundColor: colors.surface },
  previewLoading: { height: 200, alignItems: 'center', justifyContent: 'center', gap: 12 },
  previewLoadingText: { fontSize: 11, fontFamily: fonts.mono, color: colors.muted },
  previewImage: { width: '100%', height: 240 },
  lockBtn: { backgroundColor: colors.gold, borderRadius: 5, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  lockBtnText: { fontSize: 10, fontFamily: fonts.mono, letterSpacing: 2, color: colors.bg, fontWeight: '700' },
  lockedBanner: { backgroundColor: '#1a3a1a', borderWidth: 1, borderColor: colors.green, borderRadius: 6, padding: 14, alignItems: 'center', marginTop: 16 },
  lockedText: { fontSize: 12, fontFamily: fonts.mono, color: colors.green, letterSpacing: 1 },
});
