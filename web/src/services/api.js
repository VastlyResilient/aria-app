import { v4 as uuidv4 } from 'uuid';

// In dev, proxy to local server. In production, same domain so relative URLs work.
const BASE_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

// Anonymous session ID stored in localStorage — replaces Clerk auth
const getSessionId = () => {
  let id = localStorage.getItem('aria_session_id');
  if (!id) { id = uuidv4(); localStorage.setItem('aria_session_id', id); }
  return id;
};

const headers = () => ({
  'Content-Type': 'application/json',
  'x-session-id': getSessionId(),
});

const request = async (method, path, body) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: headers(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${method} ${path} failed (${res.status}): ${err}`);
  }
  return res.json();
};

const toBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export const createProject = () => request('POST', '/api/projects', {});
export const getProject = (id) => request('GET', `/api/projects/${id}`);
export const updateProject = (id, data) => request('PATCH', `/api/projects/${id}`, data);
export const listProjects = () => request('GET', '/api/projects');

export const convertPhoto = async (projectId, roomId, file) => {
  const imageDataUrl = await toBase64(file);
  return request('POST', '/api/step1/convert', { projectId, roomId, imageDataUrl });
};
export const checkConvertStatus = (requestId) => request('GET', `/api/step1/status/${requestId}`);

export const analyzeStyle = (projectId, address) => request('POST', '/api/step2/analyze', { projectId, address });
export const lockStyle = (projectId, selectedStyleId, selectedStyleLabel) => request('POST', '/api/step2/lock', { projectId, selectedStyleId, selectedStyleLabel });

export const transformRoom = (projectId, roomId) => request('POST', '/api/step3/transform', { projectId, roomId });
export const checkTransformStatus = (projectId, roomId) => request('GET', `/api/step3/status/${projectId}/${roomId}`);
export const selectVersion = (projectId, roomId, selectedVersion) => request('POST', '/api/step3/select', { projectId, roomId, selectedVersion });

export const setVideoModel = (projectId, videoModel) => request('POST', '/api/step4/set-model', { projectId, videoModel });
export const animateRoom = (projectId, roomId) => request('POST', '/api/step4/animate', { projectId, roomId });
export const checkAnimateStatus = (projectId, roomId) => request('GET', `/api/step4/status/${projectId}/${roomId}`);
export const selectAnimation = (projectId, roomId, selectedAnimation) => request('POST', '/api/step4/select', { projectId, roomId, selectedAnimation });

export const saveAgent = (projectId, agent) => request('POST', '/api/step5/save-agent', { projectId, agent });
export const uploadHeadshot = async (projectId, file) => {
  const imageDataUrl = await toBase64(file);
  return request('POST', '/api/step5/upload-headshot', { projectId, imageDataUrl });
};
export const generateOutro = (projectId) => request('POST', '/api/step5/generate', { projectId });
export const checkOutroStatus = (projectId) => request('GET', `/api/step5/status/${projectId}`);

export const generateMusic = (projectId) => request('POST', '/api/step6/generate-music', { projectId });
export const getExportAssets = (projectId) => request('GET', `/api/step6/assets/${projectId}`);
export const completeProject = (projectId) => request('POST', '/api/step6/complete', { projectId });
