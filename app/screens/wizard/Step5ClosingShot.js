import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Image, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts, spacing } from '../../constants/theme';
import { useProjectStore } from '../../store/projectStore';
import GuideBanner from '../../components/wizard/GuideBanner';
import * as api from '../../services/api';

export default function Step5ClosingShot({ projectId, onNext }) {
  const { rooms, agent, outro, convertedUrls, setAgent, setOutro } = useProjectStore();

  const [generating, setGenerating] = useState(false);
  const [nightDone, setNightDone] = useState(false);
  const [clipDone, setClipDone] = useState(false);
  const [uploadingHeadshot, setUploadingHeadshot] = useState(false);

  const backyardRoom = rooms.find((r) => r.id === 'backyard');
  const backyardDone = backyardRoom?.selectedVersion != null;

  const allAgentFieldsFilled =
    agent.name.trim() &&
    agent.phone.trim() &&
    agent.email.trim() &&
    agent.brokerage.trim() &&
    agent.headshot;

  const canGenerate = backyardDone && allAgentFieldsFilled;
  const backyardPreviewUri = convertedUrls['backyard'] || null;

  const handleHeadshotPick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled && result.assets?.[0]) {
      setUploadingHeadshot(true);
      try {
        const res = await api.uploadHeadshot(projectId, result.assets[0].uri);
        setAgent({ headshot: res.url });
      } catch (err) {
        Alert.alert('Upload Failed', 'Could not upload headshot.');
      } finally {
        setUploadingHeadshot(false);
      }
    }
  };

  const pollOutroStatus = () => {
    const interval = setInterval(async () => {
      try {
        const res = await api.checkOutroStatus(projectId);
        if (res.nightStatus === 'completed') setNightDone(true);
        if (res.videoStatus === 'completed' && res.clipUrl) {
          clearInterval(interval);
          setClipDone(true);
          setGenerating(false);
          setOutro({ nightImage: res.nightImageUrl, clip: res.clipUrl });
          setTimeout(() => {
            useProjectStore.getState().setStep(6);
            onNext();
          }, 800);
        }
      } catch (err) {
        // keep polling
      }
    }, 5000);
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    try {
      await api.saveAgent(projectId, agent);
      await api.generateOutro(projectId);
      pollOutroStatus();
    } catch (err) {
      setGenerating(false);
      Alert.alert('Error', err.message || 'Could not start outro generation.');
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <GuideBanner step={5} />
      <Text style={styles.heading}>Closing Shot</Text>

      {/* 3-step progress cards */}
      <View style={styles.progressCards}>
        {/* Step 01 */}
        <View style={[styles.progressCard, backyardDone && styles.progressCardDone]}>
          <Text style={styles.progressCardNum}>01</Text>
          <View style={styles.progressCardText}>
            <Text style={[styles.progressCardTitle, backyardDone && styles.progressCardTitleDone]}>
              Renovated Backyard
            </Text>
            <Text style={styles.progressCardSub}>Selected in Step 3</Text>
          </View>
          <Text style={[styles.progressCardStatus, backyardDone && styles.progressCardStatusDone]}>
            {backyardDone ? '✓ DONE' : 'PENDING'}
          </Text>
        </View>

        {/* Step 02 */}
        <View style={[styles.progressCard, nightDone && styles.progressCardDone]}>
          <Text style={styles.progressCardNum}>02</Text>
          <View style={styles.progressCardText}>
            <Text style={[styles.progressCardTitle, nightDone && styles.progressCardTitleDone]}>
              Night Scene Convert
            </Text>
            <Text style={styles.progressCardSub}>Auto-generated from backyard image</Text>
          </View>
          {generating && !nightDone
            ? <ActivityIndicator color={colors.gold} size="small" />
            : <Text style={[styles.progressCardStatus, nightDone && styles.progressCardStatusDone]}>
                {nightDone ? '✓ DONE' : 'PENDING'}
              </Text>}
        </View>

        {/* Step 03 */}
        <View style={[styles.progressCard, clipDone && styles.progressCardDone]}>
          <Text style={styles.progressCardNum}>03</Text>
          <View style={styles.progressCardText}>
            <Text style={[styles.progressCardTitle, clipDone && styles.progressCardTitleDone]}>
              Contact Card + Dolly
            </Text>
            <Text style={styles.progressCardSub}>8-second outro animation</Text>
          </View>
          {generating && nightDone && !clipDone
            ? <ActivityIndicator color={colors.gold} size="small" />
            : <Text style={[styles.progressCardStatus, clipDone && styles.progressCardStatusDone]}>
                {clipDone ? '✓ DONE' : 'PENDING'}
              </Text>}
        </View>
      </View>

      {/* Motion info bar */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoBannerText}>
          Backyard Night — Micro Dolly-In · 6–12in · 8 sec · 4K HDR
        </Text>
      </View>

      {/* Agent contact form */}
      <Text style={styles.sectionLabel}>AGENT CONTACT INFO</Text>

      {/* Headshot uploader */}
      <View style={styles.headshotRow}>
        <TouchableOpacity onPress={handleHeadshotPick} style={styles.headshotCircle}>
          {agent.headshot ? (
            <Image source={{ uri: agent.headshot }} style={styles.headshotImage} />
          ) : uploadingHeadshot ? (
            <ActivityIndicator color={colors.gold} />
          ) : (
            <Text style={styles.headshotPlus}>+</Text>
          )}
        </TouchableOpacity>
        <View style={styles.headshotText}>
          <Text style={styles.headshotLabel}>AGENT HEADSHOT</Text>
          <Text style={styles.headshotSub}>Tap to upload · Square photo recommended</Text>
          {agent.headshot && (
            <TouchableOpacity onPress={() => setAgent({ headshot: null })}>
              <Text style={styles.removeLink}>remove</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Form fields */}
      <View style={styles.formGrid}>
        {[
          { key: 'name', label: 'AGENT NAME', placeholder: 'Jane Smith' },
          { key: 'phone', label: 'PHONE', placeholder: '(512) 555-0100' },
          { key: 'email', label: 'EMAIL', placeholder: 'jane@brokerage.com' },
          { key: 'brokerage', label: 'BROKERAGE', placeholder: 'Compass Realty' },
        ].map((field) => (
          <View key={field.key} style={styles.formField}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <TextInput
              style={styles.input}
              value={agent[field.key]}
              onChangeText={(val) => setAgent({ [field.key]: val })}
              placeholder={field.placeholder}
              placeholderTextColor={colors.dim}
              keyboardType={field.key === 'email' ? 'email-address' : field.key === 'phone' ? 'phone-pad' : 'default'}
            />
          </View>
        ))}
      </View>

      {/* Ending shot preview */}
      {agent.headshot && (
        <View style={styles.previewSection}>
          <Text style={styles.sectionLabel}>ENDING SHOT PREVIEW</Text>
          <View style={styles.preview}>
            {backyardPreviewUri && (
              <Image source={{ uri: backyardPreviewUri }} style={styles.previewBg} blurRadius={8} />
            )}
            <View style={styles.previewOverlay} />

            {/* Agent card */}
            <View style={styles.agentCard}>
              <Image source={{ uri: agent.headshot }} style={styles.agentCardHeadshot} />
              <Text style={styles.agentCardName}>{agent.name || 'Agent Name'}</Text>
              <Text style={styles.agentCardBrokerage}>{agent.brokerage || 'Brokerage'}</Text>
              <Text style={styles.agentCardContact}>{agent.phone}</Text>
              <Text style={styles.agentCardContact}>{agent.email}</Text>
            </View>

            {/* Badge */}
            <View style={styles.previewBadge}>
              <Text style={styles.previewBadgeText}>5 SEC HOLD · 4K HDR</Text>
            </View>
          </View>
          <Text style={styles.previewCaption}>
            The backyard animates for the first 3 seconds, then softly blurs into this contact card for the final 5 seconds.
          </Text>
        </View>
      )}

      {/* Generate button */}
      <TouchableOpacity
        onPress={handleGenerate}
        disabled={!canGenerate || generating}
        style={[styles.generateBtn, (!canGenerate || generating) && styles.btnDisabled]}
      >
        {generating ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.bg} size="small" />
            <Text style={styles.generateBtnText}>GENERATING OUTRO...</Text>
          </View>
        ) : (
          <Text style={styles.generateBtnText}>GENERATE OUTRO →</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 40 },
  heading: { fontSize: 18, fontFamily: fonts.serif, color: colors.text, marginBottom: 20 },
  progressCards: { gap: 10, marginBottom: 20 },
  progressCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 6, padding: 14,
  },
  progressCardDone: { borderColor: colors.green, backgroundColor: '#0a1a0a' },
  progressCardNum: { fontSize: 16, fontFamily: fonts.mono, color: colors.dim, fontWeight: '700', width: 28 },
  progressCardText: { flex: 1 },
  progressCardTitle: { fontSize: 12, fontFamily: fonts.mono, color: colors.muted },
  progressCardTitleDone: { color: colors.green },
  progressCardSub: { fontSize: 10, fontFamily: fonts.mono, color: colors.dim, marginTop: 2 },
  progressCardStatus: { fontSize: 9, fontFamily: fonts.mono, color: colors.muted, letterSpacing: 1 },
  progressCardStatusDone: { color: colors.green },
  infoBanner: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 6, padding: 12, marginBottom: 24, alignItems: 'center',
  },
  infoBannerText: { fontSize: 10, fontFamily: fonts.mono, color: colors.gold, letterSpacing: 1 },
  sectionLabel: { fontSize: 9, fontFamily: fonts.mono, color: colors.muted, letterSpacing: 2, marginBottom: 14 },
  headshotRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  headshotCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  headshotImage: { width: 80, height: 80, borderRadius: 40 },
  headshotPlus: { fontSize: 28, color: colors.dim },
  headshotText: { flex: 1 },
  headshotLabel: { fontSize: 10, fontFamily: fonts.mono, color: colors.gold, letterSpacing: 1, marginBottom: 4 },
  headshotSub: { fontSize: 10, fontFamily: fonts.mono, color: colors.muted },
  removeLink: { fontSize: 10, fontFamily: fonts.mono, color: colors.dim, textDecorationLine: 'underline', marginTop: 4 },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  formField: { width: '47%' },
  fieldLabel: { fontSize: 9, fontFamily: fonts.mono, color: colors.muted, letterSpacing: 2, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 5, padding: 10, fontSize: 12, fontFamily: fonts.mono, color: colors.text,
  },
  previewSection: { marginBottom: 24 },
  preview: { width: '100%', aspectRatio: 16 / 9, borderRadius: 8, overflow: 'hidden', marginBottom: 10 },
  previewBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  previewOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9,9,16,0.6)' },
  agentCard: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(14,14,24,0.7)',
    padding: 20,
  },
  agentCardHeadshot: {
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 2, borderColor: colors.gold, marginBottom: 10,
  },
  agentCardName: { fontSize: 14, fontFamily: fonts.serif, color: colors.text, marginBottom: 2 },
  agentCardBrokerage: { fontSize: 10, fontFamily: fonts.mono, color: colors.gold, marginBottom: 6 },
  agentCardContact: { fontSize: 10, fontFamily: fonts.mono, color: colors.muted },
  previewBadge: {
    position: 'absolute', bottom: 10, right: 10,
    backgroundColor: 'rgba(201,169,110,0.2)', borderWidth: 1, borderColor: colors.gold,
    borderRadius: 3, paddingHorizontal: 8, paddingVertical: 4,
  },
  previewBadgeText: { fontSize: 8, fontFamily: fonts.mono, color: colors.gold, letterSpacing: 1 },
  previewCaption: { fontSize: 10, fontFamily: fonts.mono, color: colors.muted, lineHeight: 16, textAlign: 'center' },
  generateBtn: {
    backgroundColor: colors.gold, borderRadius: 5, paddingVertical: 14, alignItems: 'center',
  },
  btnDisabled: { backgroundColor: colors.border },
  generateBtnText: { fontSize: 10, fontFamily: fonts.mono, letterSpacing: 2, color: colors.bg, fontWeight: '700' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
