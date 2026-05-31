# RedHydra AI Chat Deployment Guidelines 🌐

This document details the configuration rules, build operations, and static/full-stack deployment procedures for RedHydra AI Chat.

---

## 🏗️ Production Build Sequence

RedHydra compiles as a custom, high-performance Express server-side app proxying client queries, but can also run purely as a static SPA if preferred.

To build the full-stack container or production artifacts, execute:
```bash
npm run build
```

This commands executes a dual-compile:
1. **Frontend Assets**: Runs `vite build` to compile the single-page React app into optimized, static files in `/dist`.
2. **Server Bundler**: Bundles the backend Express `server.ts` into a unified CommonJS file `/dist/server.cjs` using `esbuild`. This encapsulates Node imports and maps ES Module boundaries securely.

To start the production server:
```bash
npm start
```
By default, the server will serve static web files and establish secure `/api/chat` and `/api/chat-stream` API proxy routes.

---

## ☁️ Full-Stack Hosting (Cloud Run or Custom containers)

### Docker Deployment
The repository includes standard Node configurations making Docker integration extremely simple:

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
```

Build and launch:
```bash
docker build -t redhydra-chat .
docker run -p 3000:3000 -e GEMINI_API_KEY="your-key" redhydra-chat
```

---

## 🗂️ Client-Side Static Hosting (GitHub Pages, Vercel, Netlify)

If you prefer to host purely on static platforms, you can configure RedHydra as a client-side SPA.

### 1. Build Client Portion Only
```bash
npx vite build
```
This produces a static output inside `/dist`.

### 2. Configure SPA Routing
Since the static router runs inside standard SPA page configs, you must handle sub-route redirects:
- **Netlify**: Add a standard `_redirects` file in raw `/public` folder:
  ```text
  /*    /index.html   200
  ```
- **Vercel**: Add a `vercel.json` file:
  ```json
  {
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```
- **GitHub Pages**:
  - Add a `.nojekyll` file in `/dist` folder during builds to bypass Jekyll processing rules.
  - Set the appropriate `base` URL inside `vite.config.ts` if deploying to custom path repositories:
    ```typescript
    base: '/your-repository-name/'
    ```

---

## 🔒 Post-Deployment Security Hardening Checklist
- [ ] Connect your domain via HTTPS to protect client API keys in transit over network paths.
- [ ] Implement rate-limits on `/api/chat-stream` if hosting standard built-in keys publicly.
- [ ] Enable HTTP Strict Transport Security (HSTS) inside reverse proxies.
