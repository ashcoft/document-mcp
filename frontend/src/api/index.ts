// ============================================================
// API entry point — selects the live backend or the static demo
// data set at build time (VITE_DEMO_MODE=true).
// ============================================================

import * as backend from './backend';
import * as demo from './demo';

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

const impl = isDemoMode ? demo : backend;

export const uploadDocument = impl.uploadDocument;
export const getUploadStatus = impl.getUploadStatus;
export const searchDocuments = impl.searchDocuments;
export const askQuestion = impl.askQuestion;
export const getDocuments = impl.getDocuments;
export const getDocument = impl.getDocument;
export const getDocumentChunks = impl.getDocumentChunks;
export const getSystemMetrics = impl.getSystemMetrics;
export const getAgentActions = impl.getAgentActions;
export const getAgentActionStats = impl.getAgentActionStats;
export const getFlaggedRegions = impl.getFlaggedRegions;
export const getReviewStats = impl.getReviewStats;
export const validateDocument = impl.validateDocument;
