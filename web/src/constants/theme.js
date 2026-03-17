export const T = {
  gold: '#c9a96e',
  bg: '#090910',
  surface: '#0e0e18',
  border: '#1c1c2e',
  muted: '#6b6b8a',
  green: '#4a9a6a',
  text: '#e8e4dc',
  dim: '#3a3a5a',
};

export const btn = (active, disabled) => ({
  background: disabled ? T.border : active ? T.gold : T.surface,
  color: disabled ? T.muted : active ? T.bg : T.muted,
  border: `1px solid ${disabled ? T.border : active ? T.gold : T.border}`,
  padding: '11px 22px',
  borderRadius: '5px',
  fontSize: '10px',
  fontFamily: 'monospace',
  letterSpacing: '2px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: active ? 700 : 400,
  transition: 'all 0.2s',
});
