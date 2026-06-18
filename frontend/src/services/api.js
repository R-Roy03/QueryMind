import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const http = axios.create({ baseURL: BASE });

export const schemaApi = {
  get: () => http.get("/api/schema/"),
  profileColumn: (table, col) => http.get(`/api/schema/profile/${table}/${col}`),
};

export const semanticApi = {
  generate: (force = false) => http.post("/api/semantic/generate", { force }),
  status: () => http.get("/api/semantic/status"),
};

export const queryApi = {
  ask: (question, maxRows = 100) =>
    http.post("/api/query/ask", { question, max_rows: maxRows }),
  optimize: (sql) => http.post("/api/query/optimize", { sql }),
};

export const agentApi = {
  chat: (message, history = []) =>
    http.post("/api/agent/chat", { message, history }),
};

export const pipelineApi = {
  build: (description) =>
    http.post("/api/pipeline/build", { description }),
};

export const qualityApi = {
  scanAll: () => http.get("/api/quality/scan"),
  scanTable: (table) => http.get(`/api/quality/scan/${table}`),
};

// Phase 3 endpoints
export const piiApi = {
  scanAll: () => http.get("/api/pii/scan"),
  scanColumn: (table, col) => http.get(`/api/pii/scan/${table}/${col}`),
};

export const contractApi = {
  validateAll: () => http.get("/api/contracts/validate"),
  validateTable: (table) => http.get(`/api/contracts/validate/${table}`),
};

export const monitorApi = {
  history: (limit = 20) => http.get(`/api/monitor/history?limit=${limit}`),
  diagnose: (runId) => http.get(`/api/monitor/diagnose/${runId}`),
  logRun: (data) => http.post("/api/monitor/log", data),
};

export const anomalyApi = {
  scanAll: () => http.get("/api/anomaly/scan"),
  scanColumn: (table, col) => http.get(`/api/anomaly/scan/${table}/${col}`),
};

export const metricsApi = {
  live: () => http.get("/api/metrics/live"),
};

export const costApi = {
  estimate: (sql) => http.post("/api/cost/estimate", { sql }),
};

export const dbApi = {
  status: () => http.get("/api/db/status"),
  switchDb: (config) => http.post("/api/db/switch", config),
  testConnection: (config) => http.post("/api/db/test", config),
};
