import { useState, useEffect } from 'react';
import { T } from '../constants/theme';
import { useProjectStore } from '../store/projectStore';
import WizardHeader from '../components/wizard/WizardHeader';
import StepProgressBar from '../components/wizard/StepProgressBar';
import SideGuidePanel from '../components/wizard/SideGuidePanel';
import Step1PhotoUpload from '../components/steps/Step1PhotoUpload';
import Step2StyleIdentity from '../components/steps/Step2StyleIdentity';
import Step3TransformRooms from '../components/steps/Step3TransformRooms';
import Step4Animate from '../components/steps/Step4Animate';
import Step5ClosingShot from '../components/steps/Step5ClosingShot';
import Step6Export from '../components/steps/Step6Export';
import * as api from '../services/api';

export default function Wizard() {
  const { step, setStep, projectId, setProjectId } = useProjectStore();
  const [guideOpen, setGuideOpen] = useState(false);
  const [initializing, setInitializing] = useState(!projectId);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    if (projectId) return;
    api.createProject()
      .then(res => {
        setProjectId(res.id);
        setInitializing(false);
      })
      .catch(err => {
        setInitError(err.message);
        setInitializing(false);
      });
  }, []);

  if (initializing) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div className="spin" style={{ width: 28, height: 28, border: `2px solid ${T.gold}`, borderTopColor: 'transparent', borderRadius: '50%' }} />
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: T.muted, letterSpacing: 2 }}>INITIALIZING...</span>
      </div>
    );
  }

  if (initError) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#c94a4a', letterSpacing: 2 }}>FAILED TO CONNECT TO SERVER</span>
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: T.muted, textAlign: 'center' }}>{initError}</span>
        <button onClick={() => window.location.reload()} style={{ fontSize: 10, fontFamily: 'monospace', color: T.gold, background: 'none', border: `1px solid ${T.gold}`, padding: '10px 20px', borderRadius: 5, cursor: 'pointer', letterSpacing: 2 }}>RETRY</button>
      </div>
    );
  }

  const goToStep = (n) => setStep(n);
  const goNext = () => setStep(step + 1);

  const renderStep = () => {
    switch (step) {
      case 1: return <Step1PhotoUpload projectId={projectId} onNext={goNext} />;
      case 2: return <Step2StyleIdentity projectId={projectId} onNext={goNext} />;
      case 3: return <Step3TransformRooms projectId={projectId} onNext={goNext} />;
      case 4: return <Step4Animate projectId={projectId} onNext={goNext} />;
      case 5: return <Step5ClosingShot projectId={projectId} onNext={goNext} />;
      case 6: return <Step6Export projectId={projectId} />;
      default: return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column' }}>
      <WizardHeader onGuidePress={() => setGuideOpen(true)} />
      <StepProgressBar currentStep={step} onStepPress={goToStep} />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {renderStep()}
      </div>

      <SideGuidePanel isOpen={guideOpen} onClose={() => setGuideOpen(false)} currentStep={step} />
    </div>
  );
}
