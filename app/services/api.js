import * as FileSystem from 'expo-file-system';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

let _authToken = null;

export const setAuthToken = (token) => {
  _authToken = token;
};

const headers = () => ({
  'Content-Type': 'application/json',
  ..._authToken ? { Authorization: `Bearer ${_authToken}` } : {},
});

const request = async (method, path, body) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: headers(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${method} ${path} failed (${res.status}): ${err}`);
  }
  return res.json();
};

// ── Projects ────────────────────────────────────────────────────────────────

export const createProject = () => request('POST', '/api/projects', {});
export const getProject = (id) => request('GET', `/api/projects/${id}`);
export const updateProject = (id, data) => request('PATCH', `/api/projects/${id}`, data);
export const deleteProject = (id) => request('DELETE', `/api/projects/${id}`);
export const listProjects = () => request('GET', '/api/projects');

// ── Step 1 ──────────────────────────────────────────────────────────────────

export const convertPhoto = async (projectId, roomId, imageUri) => {
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const ext = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
  const imageDataUrl = `data:${mimeType};base64,${base64}`;
  return request('POST', '/api/step1/convert', { projectId, roomId, imageDataUrl });
};

export const checkConvertStatus = (requestId) =>
  request('GET', `/api/step1/status/${requestId}`);

// ── Step 2 ──────────────────────────────────────────────────────────────────

export const analyzeStyle = (projectId, address) =>
  request('POST', '/api/step2/analyze', { projectId, address });

export const lockStyle = (projectId, selectedStyleId, selectedStyleLabel) =>
  request('POST', '/api/step2/lock', { projectId, selectedStyleId, selectedStyleLabel });

// ── Step 3 ──────────────────────────────────────────────────────────────────

export const transformRoom = (projectId, roomId) =>
  request('POST', '/api/step3/transform', { projectId, roomId });

export const checkTransformStatus = (projectId, roomId) =>
  request('GET', `/api/step3/status/${projectId}/${roomId}`);

export const selectVersion = (projectId, roomId, selectedVersion) =>
  request('POST', '/api/step3/select', { projectId, roomId, selectedVersion });

// ── Step 4 ──────────────────────────────────────────────────────────────────

export const setVideoModel = (projectId, videoModel) =>
  request('POST', '/api/step4/set-model', { projectId, videoModel });

export const animateRoom = (projectId, roomId) =>
  request('POST', '/api/step4/animate', { projectId, roomId });

export const checkAnimateStatus = (projectId, roomId) =>
  request('GET', `/api/step4/status/${projectId}/${roomId}`);

export const selectAnimation = (projectId, roomId, selectedAnimation) =>
  request('POST', '/api/step4/select', { projectId, roomId, selectedAnimation });

// ── Step 5 ──────────────────────────────────────────────────────────────────

export const saveAgent = (projectId, agent) =>
  request('POST', '/api/step5/save-agent', { projectId, agent });

export const uploadHeadshot = async (projectId, imageUri) => {
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const ext = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
  const imageDataUrl = `data:${mimeType};base64,${base64}`;
  return request('POST', '/api/step5/upload-headshot', { projectId, imageDataUrl });
};

export const generateOutro = (projectId) =>
  request('POST', '/api/step5/generate', { projectId });

export const checkOutroStatus = (projectId) =>
  request('GET', `/api/step5/status/${projectId}`);

// ── Step 6 ──────────────────────────────────────────────────────────────────

export const generateMusic = (projectId) =>
  request('POST', '/api/step6/generate-music', { projectId });

export const getExportAssets = (projectId) =>
  request('GET', `/api/step6/assets/${projectId}`);

export const completeProject = (projectId) =>
  request('POST', '/api/step6/complete', { projectId });

// ── Jobs ────────────────────────────────────────────────────────────────────

export const getJobStatus = (requestId) =>
  request('GET', `/api/jobs/${requestId}`);
