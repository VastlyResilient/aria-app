import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { colors, fonts, spacing } from '../../constants/theme';
import { ROOMS } from '../../constants/rooms';
import { useProjectStore } from '../../store/projectStore';
import GuideBanner from '../../components/wizard/GuideBanner';
import * as api from '../../services/api';

export default function Step3TransformRooms({ projectId, onNext }) {
  const {
    selectedPhotos, photoUris, convertedUrls,
    rooms, currentRoomIndex,
    setCurrentRoomIndex, updateRoom,
  } = useProjectStore();

  const [generating, setGenerating] = useState(false);

  // Hero is never transformed — it's used only for the video intro
  const selectedRooms = ROOMS.filter((r) => selectedPhotos.includes(r.id) && r.id !== 'hero');
  const activeRoom = selectedRooms[currentRoomIndex];
  const roomData = rooms.find((r) => r.id === activeRoom?.id);

  const allTransformed = selectedRooms.every((r) => {
    const rd = rooms.find((x) => x.id === r.id);
    return rd?.selectedVersion != null;
  });

  const pollTransform = useCallback((projectId, roomId) => {
    const interval = setInterval(async () => {
      try {
        const res = await api.checkTransformStatus(projectId, roomId);
        if (res.status === 'completed' && res.version1Url && res.version2Url) {
          clearInterval(interval);
          setGenerating(false);
          updateRoom(roomId, { version1: res.version1Url, version2: res.version2Url });
        } else if (res.status === 'failed') {
          clearInterval(interval);
          setGenerating(false);
          Alert.alert('Generation Failed', 'Could not transform room. Please try again.');
        }
      } catch (err) {
        // keep polling
      }
    }, 3000);
    return interval;
  }, [updateRoom]);

  const handleGenerate = async () => {
    if (!activeRoom || generating) return;
    setGenerating(true);
    try {
      await api.transformRoom(projectId, activeRoom.id);
      pollTransform(projectId, activeRoom.id);
    } catch (err) {
      setGenerating(false);
      Alert.alert('Error', err.message || 'Could not start transformation.');
    }
  };

  const handleSelect = async (version) => {
    if (!activeRoom) return;
    try {
      await api.selectVersion(projectId, activeRoom.id, version);
      updateRoom(activeRoom.id, { selectedVersion: version });
    } catch (err) {
      Alert.alert('Error', 'Could not save selection.');
    }
  };

  if (!activeRoom) return null;

  const isBackyard = activeRoom.id === 'backyard';
  const originalUri = photoUris[activeRoom.id] || convertedUrls[activeRoom.id];

  return (
    <View style={styles.container}>
      {/* Room tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.tabs}>
          {selectedRooms.map((room, i) => {
            const rd = rooms.find((x) => x.id === room.id);
            const isDone = rd?.selectedVersion != null;
            const isActive = i === currentRoomIndex;
            return (
              <TouchableOpacity
                key={room.id}
                onPress={() => setCurrentRoomIndex(i)}
                style={[styles.tab, isActive && styles.tabActive]}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {room.label}
                </Text>
                {isDone && <Text style={styles.tabCheck}> ✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <GuideBanner step={3} />

        {/* Original photo */}
        {originalUri && (
          <View style={styles.originalBox}>
            <Text style={styles.frameLabel}>ORIGINAL PHOTO</Text>
            <Image source={{ uri: originalUri }} style={styles.originalImage} />
          </View>
        )}

        {/* Prompt source banner */}
        <View style={[styles.promptBanner, isBackyard ? styles.promptBannerGreen : styles.promptBannerGold]}>
          <Text style={[styles.promptBannerText, isBackyard ? styles.promptBannerTextGreen : styles.promptBannerTextGold]}>
            {isBackyard ? '🌿 BACKYARD SPECIALIST PROMPT ACTIVE' : '✦ STYLE IDENTITY APPLIED'}
          </Text>
          <Text style={styles.promptBannerSub}>
            {isBackyard
              ? 'Professional landscaping renovation prompt with Austin-market outdoor design logic.'
              : 'Your locked style identity will be applied to every surface, finish, and material in this room.'}
          </Text>
        </View>

        {/* Generate button */}
        {!roomData?.version1 && (
          <TouchableOpacity
            onPress={handleGenerate}
            disabled={generating}
            style={[styles.generateBtn, generating && styles.btnDisabled]}
          >
            {generating ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.bg} size="small" />
                <Text style={styles.generateBtnText}>GENERATING 2 VERSIONS...</Text>
              </View>
            ) : (
              <Text style={styles.generateBtnText}>GENERATE 2 VERSIONS →</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Version cards */}
        {roomData?.version1 && (
          <>
            <Text style={styles.sectionLabel}>SELECT YOUR PREFERRED VERSION</Text>
            <View style={styles.versionRow}>
              {[1, 2].map((v) => {
                const imgUrl = v === 1 ? roomData.version1 : roomData.version2;
                const isSelected = roomData.selectedVersion === v;
                return (
                  <TouchableOpacity
                    key={v}
                    onPress={() => handleSelect(v)}
                    style={[styles.versionCard, isSelected && styles.versionCardSelected]}
                  >
                    <Image source={{ uri: imgUrl }} style={styles.versionImage} />
                    {isSelected && (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>✓ SELECTED</Text>
                      </View>
                    )}
                    <Text style={styles.versionLabel}>Version {v}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Re-generate option */}
            <TouchableOpacity
              onPress={() => { updateRoom(activeRoom.id, { version1: null, version2: null, selectedVersion: null }); }}
              style={styles.regenBtn}
            >
              <Text style={styles.regenBtnText}>↺ REGENERATE</Text>
            </TouchableOpacity>
          </>
        )}

        {/* All done button */}
        {allTransformed && (
          <TouchableOpacity
            onPress={() => { useProjectStore.getState().setStep(4); onNext(); }}
            style={styles.doneBtn}
          >
            <Text style={styles.doneBtnText}>ALL DONE → ANIMATE</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  tabsScroll: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    maxHeight: 48,
  },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.md },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.gold },
  tabText: { fontSize: 10, fontFamily: fonts.mono, color: colors.muted, letterSpacing: 1 },
  tabTextActive: { color: colors.gold },
  tabCheck: { fontSize: 10, color: colors.green },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 40 },
  originalBox: { marginBottom: 16 },
  frameLabel: { fontSize: 9, fontFamily: fonts.mono, color: colors.muted, letterSpacing: 2, marginBottom: 8 },
  originalImage: { width: '100%', height: 200, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
  promptBanner: {
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  promptBannerGreen: { backgroundColor: '#0a1a0a', borderColor: colors.green },
  promptBannerGold: { backgroundColor: '#1a1000', borderColor: colors.gold },
  promptBannerText: { fontSize: 10, fontFamily: fonts.mono, letterSpacing: 1, marginBottom: 4, fontWeight: '700' },
  promptBannerTextGreen: { color: colors.green },
  promptBannerTextGold: { color: colors.gold },
  promptBannerSub: { fontSize: 10, fontFamily: fonts.mono, color: colors.muted, lineHeight: 15 },
  generateBtn: {
    backgroundColor: colors.gold,
    borderRadius: 5,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  btnDisabled: { backgroundColor: colors.border },
  generateBtnText: { fontSize: 10, fontFamily: fonts.mono, letterSpacing: 2, color: colors.bg, fontWeight: '700' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionLabel: { fontSize: 9, fontFamily: fonts.mono, color: colors.muted, letterSpacing: 2, marginBottom: 12 },
  versionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  versionCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  versionCardSelected: { borderColor: colors.gold },
  versionImage: { width: '100%', height: 140 },
  selectedBadge: {
    position: 'absolute',
    top: 6, right: 6,
    backgroundColor: colors.gold,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  selectedBadgeText: { fontSize: 8, fontFamily: fonts.mono, color: colors.bg, fontWeight: '700' },
  versionLabel: { fontSize: 10, fontFamily: fonts.mono, color: colors.muted, padding: 8 },
  regenBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 5,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  regenBtnText: { fontSize: 9, fontFamily: fonts.mono, color: colors.muted, letterSpacing: 2 },
  doneBtn: {
    backgroundColor: colors.gold,
    borderRadius: 5,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  doneBtnText: { fontSize: 10, fontFamily: fonts.mono, letterSpacing: 2, color: colors.bg, fontWeight: '700' },
});
