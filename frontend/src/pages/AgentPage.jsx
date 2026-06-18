import { useAgent } from "../hooks/useAgent";
import AgentChat from "../components/agent/AgentChat";

export default function AgentPage() {
  const { messages, loading, sendMessage, clearChat } = useAgent();

  return (
    <div style={{ height: "calc(100vh - 100px)" }}>
      <AgentChat messages={messages} loading={loading} onSend={sendMessage} onClear={clearChat} />
    </div>
  );
}
