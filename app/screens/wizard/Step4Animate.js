import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { colors, fonts, spacing } from '../../constants/theme';
import { ROOMS } from '../../constants/rooms';
import { useProjectStore } from '../../store/projectStore';
import GuideBanner from '../../components/wizard/GuideBanner';
import * as api from '../../services/api';

const VIDEO_MODELS = [
  { id: 'kling', label: 'Kling', desc: 'Strong structural integrity, smooth material transitions' },
  { id: 'seedance', label: 'Seedance', desc: 'High realism, cinematic motion, rich lighting' },
];

export default function Step4Animate({ projectId, onNext }) {
  const {
    selectedPhotos, photoUris, convertedUrls,
    rooms, currentRoomIndex, videoModel,
    setCurrentRoomIndex, setVideoModel, updateRoom,
  } = useProjectStore();

  const [animatingRoomId, setAnimatingRoomId] = useState(null);
  const [animStage, setAnimStage] = useState(null); // 'analyzing' | 'generating'

  const selectedRooms = ROOMS.filter((r) => selectedPhotos.includes(r.id));
  const activeRoom = selectedRooms[currentRoomIndex];
  const roomData = rooms.find((r) => r.id === activeRoom?.id);

  const allAnimated = selectedRooms.every((r) => {
    const rd = rooms.find((x) => x.id === r.id);
    return rd?.selectedAnimation != null;
  });

  const pollAnimate = useCallback((projectId, roomId) => {
    const interval = setInterval(async () => {
      try {
        const res = await api.checkAnimateStatus(projectId, roomId);
        if (res.status === 'completed' && res.animation1Url && res.animation2Url) {
          clearInterval(interval);
          setAnimatingRoomId(null);
          setAnimStage(null);
          updateRoom(roomId, { animation1: res.animation1Url, animation2: res.animation2Url });
        } else if (res.status === 'failed') {
          clearInterval(interval);
          setAnimatingRoomId(null);
          setAnimStage(null);
          Alert.alert('Animation Failed', 'Could not generate animation. Please try again.');
        }
      } catch (err) {
        // keep polling
      }
    }, 5000);
    return interval;
  }, [updateRoom]);

  const handleAnimate = async () => {
    if (!activeRoom || animatingRoomId) return;
    setAnimatingRoomId(activeRoom.id);
    setAnimStage('analyzing');

    // After 2.5s, switch to stage 2 (generating) while polling continues
    setTimeout(() => setAnimStage('generating'), 2500);

    try {
      await api.animateRoom(projectId, activeRoom.id);
      pollAnimate(projectId, activeRoom.id);
    } catch (err) {
      setAnimatingRoomId(null);
      setAnimStage(null);
      Alert.alert('Error', err.message || 'Could not start animation.');
    }
  };

  const handleSelectAnimation = async (version) => {
    if (!activeRoom) return;
    try {
      await api.selectAnimation(projectId, activeRoom.id, version);
      updateRoom(activeRoom.id, { selectedAnimation: version });
    } catch (err) {
      Alert.alert('Error', 'Could not save selection.');
    }
  };

  const handleSetModel = async (modelId) => {
    setVideoModel(modelId);
    try {
      await api.setVideoModel(projectId, modelId);
    } catch (err) {
      // non-critical, continue
    }
  };

  if (!activeRoom) return null;

  const originalUri = photoUris[activeRoom.id] || convertedUrls[activeRoom.id];
  const renovatedUri = roomData?.selectedVersion === 1 ? roomData?.version1 : roomData?.version2;
  const isAnimating = animatingRoomId === activeRoom.id;

  return (
    <View style={styles.container}>
      {/* Model selector */}
      <View style={styles.modelSelector}>
        <Text style={styles.modelSelectorLabel}>VIDEO MODEL</Text>
        <View style={styles.modelOptions}>
          {VIDEO_MODELS.map((m) => (
            <TouchableOpacity
              key={m.id}
              onPress={() => handleSetModel(m.id)}
              style={[styles.modelCard, videoModel === m.id && styles.modelCardSelected]}
            >
              <View style={[styles.modelRadio, videoModel === m.id && styles.modelRadioSelected]} />
              <View style={styles.modelCardText}>
                <Text style={[styles.modelName, videoModel === m.id && styles.modelNameSelected]}>
                  {m.label}
                </Text>
                <Text style={styles.modelDesc}>{m.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Room tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.tabs}>
          {selectedRooms.map((room, i) => {
            const rd = rooms.find((x) => x.id === room.id);
            const isDone = rd?.selectedAnimation != null;
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
        <GuideBanner step={4} />

        {/* Before / After frames */}
        <View style={styles.framesRow}>
          <View style={styles.frameBox}>
            <Text style={styles.frameLabel}>START FRAME</Text>
            {originalUri
              ? <Image source={{ uri: originalUri }} style={styles.frameImage} />
              : <View style={styles.framePlaceholder} />}
          </View>
          <Text style={styles.frameArrow}>→</Text>
          <View style={styles.frameBox}>
            <Text style={styles.frameLabel}>END FRAME</Text>
            {renovatedUri
              ? <Image source={{ uri: renovatedUri }} style={styles.frameImage} />
              : <View style={styles.framePlaceholder} />}
          </View>
        </View>

        {/* Generate button / loading states */}
        {!roomData?.animation1 && (
          <>
            {isAnimating ? (
              <View style={styles.statusCards}>
                {/* Stage 1 */}
                <View style={[styles.statusCard, animStage === 'analyzing' && styles.statusCardActive]}>
                  <View style={styles.statusCardLeft}>
                    {animStage === 'analyzing'
                      ? <ActivityIndicator color={colors.gold} size="small" />
                      : <Text style={styles.statusDone}>✓</Text>}
                  </View>
                  <View>
                    <Text style={[styles.statusTitle, animStage === 'analyzing' && styles.statusTitleActive]}>
                      ANALYZING SCENE...
                    </Text>
                    <Text style={styles.statusSub}>Detecting renovation upgrades and building animation sequence</Text>
                  </View>
                </View>
                {/* Stage 2 */}
                <View style={[styles.statusCard, animStage === 'generating' && styles.statusCardActive]}>
                  <View style={styles.statusCardLeft}>
                    {animStage === 'generating'
                      ? <ActivityIndicator color={colors.gold} size="small" />
                      : <View style={styles.statusPending} />}
                  </View>
                  <View>
                    <Text style={[styles.statusTitle, animStage === 'generating' && styles.statusTitleActive]}>
                      GENERATING WITH {videoModel.toUpperCase()}...
                    </Text>
                    <Text style={styles.statusSub}>
                      Rendering 2 versions of the transformation · 5 sec · 16:9
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <TouchableOpacity onPress={handleAnimate} style={styles.animateBtn}>
                <Text style={styles.animateBtnText}>
                  GENERATE WITH {videoModel.toUpperCase()} →
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Animation version cards */}
        {roomData?.animation1 && (
          <>
            <Text style={styles.sectionLabel}>SELECT YOUR PREFERRED VERSION</Text>
            <View style={styles.versionRow}>
              {[1, 2].map((v) => {
                const url = v === 1 ? roomData.animation1 : roomData.animation2;
                const isSelected = roomData.selectedAnimation === v;
                return (
                  <TouchableOpacity
                    key={v}
                    onPress={() => handleSelectAnimation(v)}
                    style={[styles.versionCard, isSelected && styles.versionCardSelected]}
                  >
                    <View style={styles.versionThumbnail}>
                      <Text style={styles.playIcon}>▶</Text>
                      <Text style={styles.versionNumLabel}>Version {v}</Text>
                    </View>
                    <View style={styles.versionMeta}>
                      <Text style={styles.versionMetaText}>
                        {videoModel.charAt(0).toUpperCase() + videoModel.slice(1)} · 5 sec · 16:9
                      </Text>
                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Text style={styles.selectedBadgeText}>✓ SELECTED</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={() => updateRoom(activeRoom.id, { animation1: null, animation2: null, selectedAnimation: null })}
              style={styles.regenBtn}
            >
              <Text style={styles.regenBtnText}>↺ REGENERATE</Text>
            </TouchableOpacity>
          </>
        )}

        {/* All animated button */}
        {allAnimated && (
          <TouchableOpacity
            onPress={() => { useProjectStore.getState().setStep(5); onNext(); }}
            style={styles.doneBtn}
          >
            <Text style={styles.doneBtnText}>ALL ANIMATED → CLOSING SHOT</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  modelSelector: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: spacing.md,
  },
  modelSelectorLabel: {
    fontSize: 9, fontFamily: fonts.mono, color: colors.muted, letterSpacing: 2, marginBottom: 10,
  },
  modelOptions: { flexDirection: 'row', gap: 10 },
  modelCard: {
    flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: 6, padding: 10,
  },
  modelCardSelected: { borderColor: colors.gold },
  modelRadio: {
    width: 14, height: 14, borderRadius: 7, borderWidth: 1.5,
    borderColor: colors.muted, marginTop: 2,
  },
  modelRadioSelected: { borderColor: colors.gold, backgroundColor: colors.gold },
  modelCardText: { flex: 1 },
  modelName: { fontSize: 11, fontFamily: fonts.mono, color: colors.text, marginBottom: 2 },
  modelNameSelected: { color: colors.gold },
  modelDesc: { fontSize: 9, fontFamily: fonts.mono, color: colors.muted, lineHeight: 13 },
  tabsScroll: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    maxHeight: 48,
  },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.md },
  tab: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 14,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.gold },
  tabText: { fontSize: 10, fontFamily: fonts.mono, color: colors.muted, letterSpacing: 1 },
  tabTextActive: { color: colors.gold },
  tabCheck: { fontSize: 10, color: colors.green },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 40 },
  framesRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  frameBox: { flex: 1 },
  frameLabel: { fontSize: 9, fontFamily: fonts.mono, color: colors.muted, letterSpacing: 2, marginBottom: 6 },
  frameImage: { width: '100%', height: 120, borderRadius: 5, borderWidth: 1, borderColor: colors.border },
  framePlaceholder: {
    width: '100%', height: 120, borderRadius: 5,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  frameArrow: { fontSize: 20, color: colors.gold, marginTop: 18 },
  statusCards: { gap: 10, marginBottom: 20 },
  statusCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 6, padding: 12,
  },
  statusCardActive: { borderColor: colors.gold },
  statusCardLeft: { width: 24, alignItems: 'center', paddingTop: 2 },
  statusDone: { fontSize: 14, color: colors.green },
  statusPending: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.border },
  statusTitle: { fontSize: 10, fontFamily: fonts.mono, color: colors.muted, letterSpacing: 1, marginBottom: 2 },
  statusTitleActive: { color: colors.gold },
  statusSub: { fontSize: 10, fontFamily: fonts.mono, color: colors.dim, lineHeight: 14 },
  animateBtn: {
    backgroundColor: colors.gold, borderRadius: 5,
    paddingVertical: 14, alignItems: 'center', marginBottom: 24,
  },
  animateBtnText: { fontSize: 10, fontFamily: fonts.mono, letterSpacing: 2, color: colors.bg, fontWeight: '700' },
  sectionLabel: { fontSize: 9, fontFamily: fonts.mono, color: colors.muted, letterSpacing: 2, marginBottom: 12 },
  versionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  versionCard: {
    flex: 1, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 6, overflow: 'hidden', backgroundColor: colors.surface,
  },
  versionCardSelected: { borderColor: colors.gold },
  versionThumbnail: {
    height: 100, backgroundColor: colors.border,
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  playIcon: { fontSize: 24, color: colors.muted },
  versionNumLabel: { fontSize: 9, fontFamily: fonts.mono, color: colors.muted },
  versionMeta: {
    padding: 8, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  versionMetaText: { fontSize: 9, fontFamily: fonts.mono, color: colors.muted },
  selectedBadge: {
    backgroundColor: colors.gold, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2,
  },
  selectedBadgeText: { fontSize: 8, fontFamily: fonts.mono, color: colors.bg, fontWeight: '700' },
  regenBtn: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 5,
    paddingVertical: 10, alignItems: 'center', marginBottom: 20,
  },
  regenBtnText: { fontSize: 9, fontFamily: fonts.mono, color: colors.muted, letterSpacing: 2 },
  doneBtn: {
    backgroundColor: colors.gold, borderRadius: 5,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  doneBtnText: { fontSize: 10, fontFamily: fonts.mono, letterSpacing: 2, color: colors.bg, fontWeight: '700' },
});
