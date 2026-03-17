import { T } from '../../constants/theme';
import { STEPS } from '../../constants/rooms';

export default function StepProgressBar({ currentStep, onStepPress }) {
  return (
    <div style={{ padding: '16px 22px', display: 'flex', alignItems: 'center', overflowX: 'auto', borderBottom: `1px solid ${T.border}`, background: T.surface, gap: 0 }}>
      {STEPS.map((s, i) => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
          <div
            onClick={() => s.id < currentStep && onStepPress(s.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: s.id < currentStep ? 'pointer' : 'default', opacity: s.id > currentStep ? 0.28 : 1 }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontFamily: 'monospace', fontWeight: 700, flexShrink: 0,
              background: s.id === currentStep ? T.gold : s.id < currentStep ? '#1a3a1a' : T.border,
              color: s.id === currentStep ? T.bg : s.id < currentStep ? T.green : '#4a4a6a',
              border: `1px solid ${s.id < currentStep ? T.green : T.border}`,
            }}>
              {s.id < currentStep ? '✓' : s.id}
            </div>
            <span style={{ fontSize: 9, letterSpacing: 1, fontFamily: 'monospace', whiteSpace: 'nowrap', color: s.id === currentStep ? T.gold : s.id < currentStep ? T.green : '#4a4a6a' }}>
              {s.label.toUpperCase()}
            </span>
          </div>
          {i < STEPS.length - 1 && <div style={{ width: 18, height: 1, background: T.border, margin: '0 5px', flexShrink: 0 }} />}
        </div>
      ))}
    </div>
  );
}
