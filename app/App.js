import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, StatusBar,
  SafeAreaView,
} from 'react-native';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from './constants/theme';
import TutorialScreen from './screens/TutorialScreen';
import WizardHeader from './components/wizard/WizardHeader';
import StepProgressBar from './components/wizard/StepProgressBar';
import SideGuidePanel from './components/wizard/SideGuidePanel';
import Step1PhotoUpload from './screens/wizard/Step1PhotoUpload';
import Step2StyleIdentity from './screens/wizard/Step2StyleIdentity';
import Step3TransformRooms from './screens/wizard/Step3TransformRooms';
import Step4Animate from './screens/wizard/Step4Animate';
import Step5ClosingShot from './screens/wizard/Step5ClosingShot';
import Step6Export from './screens/wizard/Step6Export';
import { useProjectStore } from './store/projectStore';
import * as api from './services/api';
import { setAuthToken } from './services/api';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
const TUTORIAL_KEY = 'aria_tutorial_complete';

function ARIAApp() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { step, projectId, setStep, setProjectId } = useProjectStore();

  const [phase, setPhase] = useState('loading'); // 'loading' | 'tutorial' | 'wizard'
  const [guideOpen, setGuideOpen] = useState(false);

  // Set auth token for API calls whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    const refreshToken = async () => {
      const token = await getToken();
      setAuthToken(token);
    };
    refreshToken();
    const interval = setInterval(refreshToken, 60 * 1000);
    return () => clearInterval(interval);
  }, [isLoaded, isSignedIn, getToken]);

  // Check tutorial completion and initialize project
  useEffect(() => {
    if (!isLoaded) return;
    const init = async () => {
      const tutorialDone = await AsyncStorage.getItem(TUTORIAL_KEY);
      if (tutorialDone === 'true') {
        await initProject();
        setPhase('wizard');
      } else {
        setPhase('tutorial');
      }
    };
    init();
  }, [isLoaded]);

  const initProject = async () => {
    if (projectId) return;
    try {
      const project = await api.createProject();
      setProjectId(project.id);
    } catch (err) {
      // User may not be signed in during dev — continue without project
      console.warn('Could not create project:', err.message);
    }
  };

  const handleTutorialComplete = async () => {
    await initProject();
    setPhase('wizard');
  };

  const handleStepPress = (stepId) => {
    if (stepId < step) setStep(stepId);
  };

  const handleNext = () => {
    // Step advancement is handled inside each step screen via store.setStep
    // This callback can be used for any post-advance side effects
  };

  if (phase === 'loading') {
    return <View style={styles.loading} />;
  }

  if (phase === 'tutorial') {
    return (
      <TutorialScreen
        onComplete={handleTutorialComplete}
      />
    );
  }

  // Wizard
  const stepScreenProps = { projectId, onNext: handleNext };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <WizardHeader onGuidePress={() => setGuideOpen(true)} />
      <StepProgressBar currentStep={step} onStepPress={handleStepPress} />

      <View style={styles.stepContainer}>
        {step === 1 && <Step1PhotoUpload {...stepScreenProps} />}
        {step === 2 && <Step2StyleIdentity {...stepScreenProps} />}
        {step === 3 && <Step3TransformRooms {...stepScreenProps} />}
        {step === 4 && <Step4Animate {...stepScreenProps} />}
        {step === 5 && <Step5ClosingShot {...stepScreenProps} />}
        {step === 6 && <Step6Export projectId={projectId} />}
      </View>

      <SideGuidePanel
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        currentStep={step}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ARIAApp />
    </ClerkProvider>
  );
}

// Simple AsyncStorage token cache for Clerk
const tokenCache = {
  async getToken(key) {
    return AsyncStorage.getItem(key);
  },
  async saveToken(key, value) {
    return AsyncStorage.setItem(key, value);
  },
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, backgroundColor: colors.bg },
  stepContainer: { flex: 1 },
});
