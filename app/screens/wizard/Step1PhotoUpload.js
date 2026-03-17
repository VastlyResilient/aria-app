import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts, spacing } from '../../constants/theme';
import { ROOMS } from '../../constants/rooms';
import { useProjectStore } from '../../store/projectStore';
import PhotoCard from '../../components/wizard/PhotoCard';
import GuideBanner from '../../components/wizard/GuideBanner';
import * as api from '../../services/api';

export default function Step1PhotoUpload({ projectId, onNext }) {
  const {
    selectedPhotos, photoUris, photoConverting, photoConverted,
    togglePhoto, setPhotoUri, setPhotoConverting, setPhotoConverted,
  } = useProjectStore();

  const allConverted = selectedPhotos.every(
    (id) => photoConverted[id] === true
  );
  const canContinue = allConverted && selectedPhotos.includes('hero');

  const pollConversion = useCallback((requestId, roomId) => {
    const interval = setInterval(async () => {
      try {
        const res = await api.checkConvertStatus(requestId);
        if (res.status === 'completed' && res.result?.url) {
          clearInterval(interval);
          setPhotoConverting(roomId, false);
          setPhotoConverted(roomId, true, res.result.url);
        } else if (res.status === 'failed') {
          clearInterval(interval);
          setPhotoConverting(roomId, false);
          Alert.alert('Conversion Failed', `Could not convert ${roomId} photo. Please try again.`);
        }
      } catch (err) {
        // Keep polling on network errors
      }
    }, 3000);
    return interval;
  }, []);

  const handlePhotoPress = useCallback(async (room) => {
    if (room.required) return;
    if (selectedPhotos.includes(room.id)) {
      togglePhoto(room.id);
      return;
    }
    if (selectedPhotos.length >= 5) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
    });

    if (!result.canceled && result.assets?.[0]) {
      const uri = result.assets[0].uri;
      togglePhoto(room.id);
      setPhotoUri(room.id, uri);
      setPhotoConverting(room.id, true);

      try {
        const { requestId } = await api.convertPhoto(projectId, room.id, uri);
        pollConversion(requestId, room.id);
      } catch (err) {
        setPhotoConverting(room.id, false);
        Alert.alert('Upload Failed', 'Could not upload photo. Please try again.');
      }
    }
  }, [selectedPhotos, projectId, togglePhoto, setPhotoUri, setPhotoConverting, pollConversion]);

  // Hero photo — on first open, prompt picker for the required hero shot
  const handleHeroPress = useCallback(async () => {
    if (photoUris['hero']) return; // already uploaded

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
    });

    if (!result.canceled && result.assets?.[0]) {
      const uri = result.assets[0].uri;
      setPhotoUri('hero', uri);
      setPhotoConverting('hero', true);

      try {
        const { requestId } = await api.convertPhoto(projectId, 'hero', uri);
        pollConversion(requestId, 'hero');
      } catch (err) {
        setPhotoConverting('hero', false);
        Alert.alert('Upload Failed', 'Could not upload photo. Please try again.');
      }
    }
  }, [photoUris, projectId, setPhotoUri, setPhotoConverting, pollConversion]);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <GuideBanner step={1} />

      {/* Heading row */}
      <View style={styles.headingRow}>
        <Text style={styles.heading}>Select Your Listing Photos</Text>
        <Text style={[styles.counter, selectedPhotos.length >= 5 && styles.counterMax]}>
          {selectedPhotos.length} / 5 SELECTED
        </Text>
      </View>

      {/* Upload instruction banner */}
      <View style={styles.instructionBanner}>
        <Text style={styles.instructionIcon}>📁</Text>
        <View style={styles.instructionText}>
          <Text style={styles.instructionLabel}>UPLOAD YOUR LISTING PHOTOS</Text>
          <Text style={styles.instructionBody}>
            Tap any slot to upload a photo from your device. Select up to 5 photos total —
            Front of Home is required. Each photo is automatically converted to 16:9 the moment it's uploaded.
          </Text>
        </View>
      </View>

      {/* Photo grid */}
      <View style={styles.grid}>
        {ROOMS.map((room) => {
          const isSelected = selectedPhotos.includes(room.id);
          const isMaxed = !isSelected && selectedPhotos.length >= 5;
          return (
            <View key={room.id} style={styles.gridItem}>
              <PhotoCard
                room={room}
                localUri={photoUris[room.id] || null}
                isSelected={isSelected}
                isConverting={!!photoConverting[room.id]}
                isConverted={!!photoConverted[room.id]}
                isMaxed={isMaxed}
                onPress={() => room.id === 'hero' ? handleHeroPress() : handlePhotoPress(room)}
              />
            </View>
          );
        })}
      </View>

      {/* 16:9 status bar */}
      {selectedPhotos.length > 0 && (
        <View style={styles.statusBar}>
          <Text style={styles.statusBarLabel}>CONVERSION STATUS</Text>
          <View style={styles.statusDots}>
            {selectedPhotos.map((roomId) => {
              const converting = photoConverting[roomId];
              const converted = photoConverted[roomId];
              const room = ROOMS.find((r) => r.id === roomId);
              return (
                <View key={roomId} style={styles.statusDotItem}>
                  <View style={[
                    styles.statusDot,
                    converting && styles.statusDotConverting,
                    converted && styles.statusDotConverted,
                  ]} />
                  <Text style={styles.statusDotLabel}>{room?.label.split(' ')[0]}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Continue button */}
      <TouchableOpacity
        onPress={() => { useProjectStore.getState().setStep(2); onNext(); }}
        disabled={!canContinue}
        style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
      >
        <Text style={[styles.continueBtnText, !canContinue && styles.continueBtnTextDisabled]}>
          CONTINUE →
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 40 },
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  heading: {
    fontSize: 18,
    fontFamily: fonts.serif,
    color: colors.text,
  },
  counter: {
    fontSize: 10,
    fontFamily: fonts.mono,
    color: colors.muted,
  },
  counterMax: { color: colors.gold },
  instructionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0e0e1c',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 12,
    marginBottom: 18,
    gap: 12,
  },
  instructionIcon: { fontSize: 20 },
  instructionText: { flex: 1 },
  instructionLabel: {
    fontSize: 10,
    fontFamily: fonts.mono,
    color: colors.gold,
    letterSpacing: 2,
    marginBottom: 3,
  },
  instructionBody: {
    fontSize: 11,
    fontFamily: fonts.mono,
    color: colors.muted,
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  gridItem: { width: '31%' },
  statusBar: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
  },
  statusBarLabel: {
    fontSize: 9,
    fontFamily: fonts.mono,
    color: colors.muted,
    letterSpacing: 2,
    marginBottom: 10,
  },
  statusDots: {
    flexDirection: 'row',
    gap: 16,
  },
  statusDotItem: {
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  statusDotConverting: { backgroundColor: colors.gold },
  statusDotConverted: { backgroundColor: colors.green },
  statusDotLabel: {
    fontSize: 8,
    fontFamily: fonts.mono,
    color: colors.muted,
  },
  continueBtn: {
    backgroundColor: colors.gold,
    borderRadius: 5,
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueBtnDisabled: {
    backgroundColor: colors.border,
  },
  continueBtnText: {
    fontSize: 10,
    fontFamily: fonts.mono,
    letterSpacing: 2,
    color: colors.bg,
    fontWeight: '700',
  },
  continueBtnTextDisabled: {
    color: colors.muted,
  },
});
