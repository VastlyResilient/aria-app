import { useState, useRef } from 'react';
import { T, btn } from '../../constants/theme';
import { useProjectStore } from '../../store/projectStore';
import GuideBanner from '../wizard/GuideBanner';
import * as api from '../../services/api';

export default function Step5ClosingShot({ projectId, onNext }) {
  const { rooms, agent, outro, convertedUrls, setAgent, setOutro } = useProjectStore();
  const [generating, setGenerating] = useState(false);
  const [nightDone, setNightDone] = useState(false);
  const [clipDone, setClipDone] = useState(false);
  const [uploadingHeadshot, setUploadingHeadshot] = useState(false);
  const headshotInputRef = useRef(null);

  const backyardRoom = rooms.find(r => r.id === 'backyard');
  const backyardDone = backyardRoom?.selectedVersion != null;
  const backyardPreviewUrl = convertedUrls['backyard'] || null;
  const allAgentFilled = agent.name.trim() && agent.phone.trim() && agent.email.trim() && agent.brokerage.trim() && agent.headshot;
  const canGenerate = backyardDone && allAgentFilled;

  const handleHeadshotFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploadingHeadshot(true);
    try {
      const res = await api.uploadHeadshot(projectId, file);
      setAgent({ headshot: res.url });
    } catch (err) { alert('Headshot upload failed.'); }
    finally { setUploadingHeadshot(false); }
  };

  const pollOutro = () => {
    const iv = setInterval(async () => {
      try {
        const res = await api.checkOutroStatus(projectId);
        if (res.nightStatus === 'completed') setNightDone(true);
        if (res.videoStatus === 'completed' && res.clipUrl) {
          clearInterval(iv);
          setClipDone(true);
          setGenerating(false);
          setOutro({ nightImage: res.nightImageUrl, clip: res.clipUrl });
          setTimeout(() => { useProjectStore.getState().setStep(6); onNext(); }, 800);
        }
      } catch (e) {}
    }, 5000);
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    try {
      await api.saveAgent(projectId, agent);
      await api.generateOutro(projectId);
      pollOutro();
    } catch (err) { setGenerating(false); alert(err.message); }
  };

  return (
    <div style={{ padding: '24px 22px', maxWidth: 800, overflowY: 'auto' }}>
      <GuideBanner step={5} />
      <h2 style={{ fontSize: 18, fontWeight: 400, marginBottom: 20, color: T.text }}>Closing Shot</h2>

      {/* Progress cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {[
          { n: '01', label: 'Renovated Backyard', sub: 'Selected in Step 3', done: backyardDone },
          { n: '02', label: 'Night Scene Convert', sub: 'Auto-generated from backyard image', done: nightDone, loading: generating && !nightDone },
          { n: '03', label: 'Contact Card + Dolly', sub: '8-second outro animation', done: clipDone, loading: generating && nightDone && !clipDone },
        ].map(card => (
          <div key={card.n} style={{ display: 'flex', alignItems: 'center', gap: 12, background: T.surface, border: `1px solid ${card.done ? T.green : T.border}`, borderRadius: 6, padding: 14, background: card.done ? '#0a1a0a' : T.surface }}>
            <span style={{ fontSize: 16, fontFamily: 'monospace', color: T.dim, fontWeight: 700, width: 28 }}>{card.n}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontFamily: 'monospace', color: card.done ? T.green : T.muted }}>{card.label}</div>
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: T.dim, marginTop: 2 }}>{card.sub}</div>
            </div>
            {card.loading
              ? <div className="spin" style={{ width: 16, height: 16, border: `2px solid ${T.gold}`, borderTopColor: 'transparent', borderRadius: '50%' }} />
              : <span style={{ fontSize: 9, fontFamily: 'monospace', color: card.done ? T.green : T.muted, letterSpacing: 1 }}>{card.done ? '✓ DONE' : 'PENDING'}</span>}
          </div>
        ))}
      </div>

      {/* Motion info */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 12, marginBottom: 24, textAlign: 'center' }}>
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: T.gold, letterSpacing: 1 }}>Backyard Night — Micro Dolly-In · 6–12in · 8 sec · 4K HDR</span>
      </div>

      {/* Agent form */}
      <div style={{ fontSize: 9, fontFamily: 'monospace', color: T.muted, letterSpacing: 2, marginBottom: 14 }}>AGENT CONTACT INFO</div>

      {/* Headshot */}
      <input ref={headshotInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleHeadshotFile} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <div onClick={() => headshotInputRef.current?.click()} style={{ width: 80, height: 80, borderRadius: '50%', border: `2px solid ${agent.headshot ? T.gold : T.border}`, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.surface, flexShrink: 0 }}>
          {agent.headshot
            ? <img src={agent.headshot} style={{ width: 80, height: 80, objectFit: 'cover' }} />
            : uploadingHeadshot
              ? <div className="spin" style={{ width: 20, height: 20, border: `2px solid ${T.gold}`, borderTopColor: 'transparent', borderRadius: '50%' }} />
              : <span style={{ fontSize: 28, color: T.dim }}>+</span>}
        </div>
        <div>
          <div style={{ fontSize: 10, fontFamily: 'monospace', color: T.gold, letterSpacing: 1, marginBottom: 4 }}>AGENT HEADSHOT</div>
          <div style={{ fontSize: 10, fontFamily: 'monospace', color: T.muted }}>Tap to upload · Square photo recommended</div>
          {agent.headshot && <button onClick={() => setAgent({ headshot: null })} style={{ background: 'none', border: 'none', color: T.dim, fontSize: 10, fontFamily: 'monospace', cursor: 'pointer', textDecoration: 'underline', padding: 0, marginTop: 4 }}>remove</button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {[{ key: 'name', label: 'AGENT NAME', ph: 'Jane Smith' }, { key: 'phone', label: 'PHONE', ph: '(512) 555-0100' }, { key: 'email', label: 'EMAIL', ph: 'jane@brokerage.com' }, { key: 'brokerage', label: 'BROKERAGE', ph: 'Compass Realty' }].map(f => (
          <div key={f.key}>
            <div style={{ fontSize: 9, fontFamily: 'monospace', color: T.muted, letterSpacing: 2, marginBottom: 6 }}>{f.label}</div>
            <input value={agent[f.key]} onChange={e => setAgent({ [f.key]: e.target.value })} placeholder={f.ph} style={{ width: '100%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, padding: '10px 12px', fontSize: 12, fontFamily: 'monospace', color: T.text, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        ))}
      </div>

      {/* Preview */}
      {agent.headshot && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 9, fontFamily: 'monospace', color: T.muted, letterSpacing: 2, marginBottom: 10 }}>ENDING SHOT PREVIEW</div>
          <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
            {backyardPreviewUrl && <img src={backyardPreviewUrl} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(8px) brightness(0.4)' }} />}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: 'rgba(14,14,24,0.75)', borderRadius: 10, padding: '20px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, backdropFilter: 'blur(8px)', border: `1px solid ${T.border}` }}>
                <img src={agent.headshot} style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${T.gold}` }} />
                <div style={{ fontSize: 14, color: T.text, textAlign: 'center' }}>{agent.name || 'Agent Name'}</div>
                <div style={{ fontSize: 10, fontFamily: 'monospace', color: T.gold }}>{agent.brokerage || 'Brokerage'}</div>
                <div style={{ fontSize: 10, fontFamily: 'monospace', color: T.muted }}>{agent.phone}</div>
                <div style={{ fontSize: 10, fontFamily: 'monospace', color: T.muted }}>{agent.email}</div>
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(201,169,110,0.15)', border: `1px solid ${T.gold}`, borderRadius: 3, padding: '4px 8px' }}>
              <span style={{ fontSize: 8, fontFamily: 'monospace', color: T.gold, letterSpacing: 1 }}>5 SEC HOLD · 4K HDR</span>
            </div>
          </div>
          <p style={{ fontSize: 10, fontFamily: 'monospace', color: T.muted, textAlign: 'center', lineHeight: 1.6 }}>The backyard animates for the first 3 seconds, then softly blurs into this contact card for the final 5 seconds.</p>
        </div>
      )}

      <button onClick={handleGenerate} disabled={!canGenerate || generating} style={{ ...btn(canGenerate && !generating, !canGenerate || generating), width: '100%', textAlign: 'center' }}>
        {generating ? '⟳ GENERATING OUTRO...' : 'GENERATE OUTRO →'}
      </button>
    </div>
  );
}
