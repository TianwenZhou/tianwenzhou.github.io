# Agent Chat Worker

This Cloudflare Worker provides the `/api/chat` endpoint for the dashboard chat bar.

## Setup

1. Install dependencies:

```bash
cd worker
npm install
```

2. Authenticate Wrangler:

```bash
npx wrangler login
```

3. Add the DeepSeek key as a secret:

```bash
npx wrangler secret put DEEPSEEK_API_KEY
```

The default model is configured in `wrangler.toml` as `deepseek-v4-flash`, with `DEEPSEEK_THINKING=disabled` for quick dashboard replies.

4. Optional local development:

```bash
copy .dev.vars.example .dev.vars
npm run dev
```

5. Deploy:

```bash
npm run deploy
```

After deploy, copy the Worker URL and paste it into `Agent/chat-config.js`:

```js
window.AGENT_CHAT_CONFIG = {
  endpoint: "https://your-worker-name.workers.dev/api/chat",
  assistantName: "Agent Chat",
};
```

If you later bind a custom subdomain, update the same file to that custom URL.
