window.AGENT_API_BASE_URL = window.AGENT_API_BASE_URL || "http://39.97.233.15";

window.AGENT_CHAT_CONFIG = {
  endpoint: `${window.AGENT_API_BASE_URL.replace(/\/+$/, "")}/api/chat`,
  assistantName: "Agent Chat",
  modelName: "DeepSeek",
};
