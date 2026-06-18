import { useState, useEffect } from "react";
import { schemaApi, semanticApi } from "../services/api";

/**
 * Hook for fetching and managing database schema + semantic layer.
 * Used across QueryPage and SchemaPage.
 */
export function useSchema() {
  const [schema, setSchema] = useState(null);
  const [semantic, setSemantic] = useState(null);
  const [semanticReady, setSemanticReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Fetch schema on mount
  useEffect(() => {
    fetchSchema();
    checkSemanticStatus();
  }, []);

  async function fetchSchema() {
    try {
      setLoading(true);
      const res = await schemaApi.get();
      setSchema(res.data);
    } catch (err) {
      setError("Failed to load schema. Is the backend running?");
      console.error("Schema fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function checkSemanticStatus() {
    try {
      const res = await semanticApi.status();
      setSemanticReady(res.data.ready);
    } catch (err) {
      // Not a critical error
    }
  }

  async function generateSemantic(force = false) {
    try {
      setGenerating(true);
      const res = await semanticApi.generate(force);
      setSemantic(res.data.data);
      setSemanticReady(true);
      return res.data;
    } catch (err) {
      setError("Failed to generate semantic layer");
      throw err;
    } finally {
      setGenerating(false);
    }
  }

  return {
    schema,
    semantic,
    semanticReady,
    loading,
    generating,
    error,
    generateSemantic,
    refetch: fetchSchema,
  };
}
