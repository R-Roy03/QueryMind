import { useState, useCallback } from "react";
import { agentApi } from "../services/api";

/**
 * Hook for managing the AI agent chat state.
 * Handles message history, loading states, and agent thinking steps.
 */
export function useAgent() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState([]);

  const sendMessage = useCallback(async (text) => {
    // Add user message immediately
    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setSteps([]);

    try {
      // Build history for the API (exclude the current message)
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await agentApi.chat(text, history);
      const agentMsg = {
        role: "assistant",
        content: res.data.answer,
        steps: res.data.steps || [],
      };

      setMessages((prev) => [...prev, agentMsg]);
      setSteps(res.data.steps || []);
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        "Sorry, I ran into an issue processing your request. Please try again.";
      const errorMsg = {
        role: "assistant",
        content: detail,
        isError: true,
        steps: [],
      };
      setMessages((prev) => [...prev, errorMsg]);
      console.error("Agent error:", err);
    } finally {
      setLoading(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSteps([]);
  }, []);

  return { messages, loading, steps, sendMessage, clearChat };
}
