# GPU backend for Dolphin EXL2

Base model:

```text
dphn/Dolphin-Llama3-8B-Instruct-exl2-6bpw
```

This is an EXL2 quantized model. It needs a GPU inference server. GitHub Pages and Cloudflare Workers cannot run the model directly.

Recommended shape:

```text
GitHub Pages frontend
        ↓
Cloudflare Worker proxy
        ↓
GPU server running OpenAI-compatible API
        ↓
dphn/Dolphin-Llama3-8B-Instruct-exl2-6bpw
```

Use an OpenAI-compatible EXL2 backend such as TabbyAPI or ExLlamaV2 OpenAI server.

Your backend must expose:

```text
/v1/chat/completions
```

Then set Worker secrets:

```bash
wrangler secret put UPSTREAM_BASE_URL
wrangler secret put UPSTREAM_API_KEY
wrangler secret put DEFAULT_MODEL
```

Values:

```text
UPSTREAM_BASE_URL=https://YOUR-GPU-SERVER
UPSTREAM_API_KEY=your-private-backend-key-if-any
DEFAULT_MODEL=dphn/Dolphin-Llama3-8B-Instruct-exl2-6bpw
```
