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

function buildConversationPrompt(messages) {
  return messages
    .slice(-8)
    .map((message) => {
      const role = message.role === "assistant" ? "Assistant" : "User";
      return `${role}: ${String(message.content || "").trim()}`;
    })
    .filter(Boolean)
    .join("\n");
}

function extractResponseText(payload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const output = Array.isArray(payload.output) ? payload.output : [];
  const fragments = [];

  output.forEach((item) => {
    const content = Array.isArray(item.content) ? item.content : [];
    content.forEach((part) => {
      if (typeof part.text === "string" && part.text.trim()) {
        fragments.push(part.text.trim());
      }
    });
  });

  return fragments.join("\n\n").trim();
}

async function handleChat(request, env) {
  if (!env.OPENAI_API_KEY) {
    return jsonResponse({ error: "OPENAI_API_KEY is not configured." }, getAllowedOrigin(request, env), 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, getAllowedOrigin(request, env), 400);
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const prompt = buildConversationPrompt(messages);
  if (!prompt) {
    return jsonResponse({ error: "No chat messages provided." }, getAllowedOrigin(request, env), 400);
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions:
        env.SYSTEM_PROMPT ||
        "You are a concise Chinese chat assistant embedded in a dashboard. Keep replies short and helpful.",
      input: prompt,
      max_output_tokens: Number(env.MAX_OUTPUT_TOKENS || 220),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return jsonResponse(
      { error: `OpenAI request failed: ${errorText}` },
      getAllowedOrigin(request, env),
      response.status,
    );
  }

  const payload = await response.json();
  const reply = extractResponseText(payload);
  if (!reply) {
    return jsonResponse({ error: "OpenAI returned an empty reply." }, getAllowedOrigin(request, env), 502);
  }

  return jsonResponse(
    {
      reply,
      assistantName: "Agent Chat",
      model: env.OPENAI_MODEL || "gpt-4.1-mini",
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
