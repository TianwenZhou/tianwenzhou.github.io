function jsonResponse(data, origin, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...buildCorsHeaders(origin),
    },
  });
}

function buildCorsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function getAllowedOrigin(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowlist = String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (allowlist.includes(origin)) {
    return origin;
  }

  return allowlist[0] || "*";
}

function buildDeepSeekMessages(messages, env) {
  const history = messages
    .slice(-8)
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: String(message.content || "").trim(),
    }))
    .filter((message) => message.content);

  if (env.SYSTEM_PROMPT) {
    return [{ role: "system", content: env.SYSTEM_PROMPT }, ...history];
  }

  return history;
}

function extractResponseText(payload) {
  return payload?.choices?.[0]?.message?.content?.trim?.() ?? "";
}

function buildDeepSeekRequestBody(messages, env) {
  const model = env.DEEPSEEK_MODEL || "deepseek-v4-flash";
  const body = {
    model,
    messages,
    stream: false,
    max_tokens: Number(env.MAX_OUTPUT_TOKENS || 220),
  };

  if (String(env.DEEPSEEK_THINKING || "").trim()) {
    body.thinking = { type: String(env.DEEPSEEK_THINKING).trim() };
  }

  return body;
}

async function handleChat(request, env) {
  if (!env.DEEPSEEK_API_KEY) {
    return jsonResponse({ error: "DEEPSEEK_API_KEY is not configured." }, getAllowedOrigin(request, env), 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, getAllowedOrigin(request, env), 400);
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const deepSeekMessages = buildDeepSeekMessages(messages, env);
  if (!deepSeekMessages.length) {
    return jsonResponse({ error: "No chat messages provided." }, getAllowedOrigin(request, env), 400);
  }

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify(buildDeepSeekRequestBody(deepSeekMessages, env)),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return jsonResponse(
      { error: `DeepSeek request failed: ${errorText}` },
      getAllowedOrigin(request, env),
      response.status,
    );
  }

  const payload = await response.json();
  const reply = extractResponseText(payload);
  if (!reply) {
    return jsonResponse({ error: "DeepSeek returned an empty reply." }, getAllowedOrigin(request, env), 502);
  }

  return jsonResponse(
    {
      reply,
      assistantName: "Agent Chat",
      model: env.DEEPSEEK_MODEL || "deepseek-v4-flash",
    },
    getAllowedOrigin(request, env),
  );
}

export default {
  async fetch(request, env) {
    const origin = getAllowedOrigin(request, env);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: buildCorsHeaders(origin),
      });
    }

    if (url.pathname === "/health") {
      return jsonResponse({ ok: true }, origin);
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      return handleChat(request, env);
    }

    return jsonResponse({ error: "Not found." }, origin, 404);
  },
};
