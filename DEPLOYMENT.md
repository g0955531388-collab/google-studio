# Lifex-AI Deployment & DevOps Guide

> **Runtime:** Node.js 20+ / Docker / Kubernetes  
> **Target:** Cloud Native Multi-Region Sovereign Clusters

---

## 1. Environment Configurations
Refer to `.env.example`:
- `PORT=3000`
- `NODE_ENV=production`
- `VITE_LIFEX_VERSION=v0.1.0`
- `VITE_DEFAULT_LANGUAGE=ar`

---

## 2. Production Build & Verification

```bash
# 1. Clean build directory
npm run clean

# 2. Run TypeScript linter
npm run lint

# 3. Execute invariant architectural tests
npm test

# 4. Compile client bundle
npm run build
```

---

## 3. Production Verification Checklist
- [x] Zero plain text secrets in Git repository.
- [x] Immutable audit trail active for all read/write endpoints.
- [x] Zero-trust consent gates enforced.
- [x] RTL & LTR layout responsiveness verified.
- [x] Strict non-diagnostic disclaimers present on all AI outputs.
