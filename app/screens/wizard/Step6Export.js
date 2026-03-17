import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { colors, fonts, spacing } from '../../constants/theme';
import { useProjectStore } from '../../store/projectStore';
import GuideBanner from '../../components/wizard/GuideBanner';
import * as api from '../../services/api';

export default function Step6Export({ projectId }) {
  const { musicTrack, setMusicTrack } = useProjectStore();

  const [assets, setAssets] = useState([]);
  const [allReady, setAllReady] = useState(false);
  const [generatingMusic, setGeneratingMusic] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAssets = async () => {
    try {
      const res = await api.getExportAssets(projectId);
      setAssets(res.assets || []);
      setAllReady(res.allReady || false);
    } catch (err) {
      // non-fatal
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, [projectId]);

  const handleGenerateMusic = async () => {
    setGeneratingMusic(true);
    try {
      const res = await api.generateMusic(projectId);
      setMusicTrack(res.musicTrackUrl);
      await loadAssets();
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not generate music track.');
    } finally {
      setGeneratingMusic(false);
    }
  };

  const handleDownloadAll = async () => {
    for (const asset of assets) {
      if (asset.url) {
        await Linking.openURL(asset.url).catch(() => {});
      }
    }
  };

  const handleComplete = async () => {
    try {
      await api.completeProject(projectId);
      Alert.alert('Project Complete', 'Your listing transformation video assets are ready. Import them into your editor in the order listed.');
    } catch (err) {
      // non-fatal
    }
  };

  const hasMusicAsset = assets.some((a) => a.type === 'AUDIO');

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <GuideBanner step={6} />

      <Text style={styles.heading}>Your Video Assets Are Ready</Text>

      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Asset list */}
          <View style={styles.assetList}>
            {assets.map((asset, i) => (
              <View key={i} style={styles.assetRow}>
                <View style={styles.assetLeft}>
                  <Text style={styles.assetLabel}>{asset.label}</Text>
                  <Text style={styles.assetMeta}>{asset.duration} · {asset.type}</Text>
                </View>
                <View style={[styles.statusBadge, styles.statusReady]}>
                  <Text style={styles.statusBadgeText}>✓ READY</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Generate music if not done */}
          {!hasMusicAsset && (
            <TouchableOpacity
              onPress={handleGenerateMusic}
              disabled={generatingMusic}
              style={[styles.musicBtn, generatingMusic && styles.btnDisabled]}
            >
              {generatingMusic ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.bg} size="small" />
                  <Text style={styles.musicBtnText}>GENERATING MUSIC TRACK...</Text>
                </View>
              ) : (
                <Text style={styles.musicBtnText}>GENERATE MUSIC TRACK →</Text>
              )}
            </TouchableOpacity>
          )}

          {/* Download all */}
          <TouchableOpacity
            onPress={handleDownloadAll}
            disabled={!allReady}
            style={[styles.downloadBtn, !allReady && styles.btnDisabled]}
          >
            <Text style={[styles.downloadBtnText, !allReady && styles.btnTextDisabled]}>
              DOWNLOAD ALL ASSETS
            </Text>
          </TouchableOpacity>

          {/* Completion note */}
          {allReady && (
            <>
              <View style={styles.completionNote}>
                <Text style={styles.completionNoteText}>
                  Import assets into your editor in the order listed above.
                  Drag the music track underneath all clips, trim to taste, and export.
                </Text>
              </View>

              <TouchableOpacity onPress={handleComplete} style={styles.completeBtn}>
                <Text style={styles.completeBtnText}>MARK PROJECT COMPLETE ✓</Text>
              </TouchableOpacity>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 40 },
  heading: { fontSize: 18, fontFamily: fonts.serif, color: colors.text, marginBottom: 24 },
  assetList: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 6, overflow: 'hidden', marginBottom: 20,
  },
  assetRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  assetLeft: { flex: 1 },
  assetLabel: { fontSize: 12, fontFamily: fonts.mono, color: colors.text, marginBottom: 3 },
  assetMeta: { fontSize: 10, fontFamily: fonts.mono, color: colors.muted },
  statusBadge: {
    borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1,
  },
  statusReady: { backgroundColor: '#0a1a0a', borderColor: colors.green },
  statusBadgeText: { fontSize: 8, fontFamily: fonts.mono, color: colors.green, letterSpacing: 1 },
  musicBtn: {
    borderWidth: 1, borderColor: colors.gold, borderRadius: 5,
    paddingVertical: 14, alignItems: 'center', marginBottom: 12,
  },
  musicBtnText: { fontSize: 10, fontFamily: fonts.mono, letterSpacing: 2, color: colors.gold },
  downloadBtn: {
    backgroundColor: colors.gold, borderRadius: 5,
    paddingVertical: 14, alignItems: 'center', marginBottom: 20,
  },
  btnDisabled: { backgroundColor: colors.border, borderColor: colors.border },
  downloadBtnText: { fontSize: 10, fontFamily: fonts.mono, letterSpacing: 2, color: colors.bg, fontWeight: '700' },
  btnTextDisabled: { color: colors.muted },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  completionNote: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 6, padding: 14, marginBottom: 16,
  },
  completionNoteText: { fontSize: 11, fontFamily: fonts.mono, color: colors.muted, lineHeight: 18 },
  completeBtn: {
    borderWidth: 1, borderColor: colors.green, borderRadius: 5,
    paddingVertical: 14, alignItems: 'center',
  },
  completeBtnText: { fontSize: 10, fontFamily: fonts.mono, letterSpacing: 2, color: colors.green },
});
