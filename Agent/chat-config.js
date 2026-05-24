window.AGENT_API_BASE_URL = window.AGENT_API_BASE_URL || "https://api.zhoutianwen.com";

window.AGENT_CHAT_CONFIG = {
  endpoint: `${window.AGENT_API_BASE_URL.replace(/\/+$/, "")}/api/chat`,
  assistantName: "Agent Chat",
  modelName: "DeepSeek",
};
