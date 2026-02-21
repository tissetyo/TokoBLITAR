# 02_RULES.md
> Hard constraints. Enforce in every file you create or edit. No exceptions.

---

## CODE STYLE

```
TypeScript strict: true
No `any` — use `unknown` + type guards
No unused imports or variables
Single quotes, 2-space indent, trailing commas, 100 char max line
ESLint + Prettier must pass on every file
```

---

## NAMING CONVENTIONS

| Thing | Format | Example |
|-------|--------|---------|
| React components | PascalCase | `ProductCard.tsx` |
| Hooks | `use` + camelCase | `useProductStore.ts` |
| API route files | `route.ts` in folder | `/app/api/seller/products/route.ts` |
| DB tables | snake_case | `order_items` |
| DB columns | snake_case | `store_id`, `created_at` |
| Constants | SCREAMING_SNAKE | `MAX_PRODUCT_IMAGES` |
| Types | PascalCase, no prefix | `Product`, `Order`, `Store` |
| Env vars (public) | `NEXT_PUBLIC_` prefix | `NEXT_PUBLIC_SUPABASE_URL` |
| Env vars (server) | no prefix | `SUPABASE_SERVICE_ROLE_KEY` |

---

## GIT

```
Branches:
  feature/S0-01-project-init
  fix/S3-08-midtrans-webhook

Commits:
  feat(seller): add product create endpoint
  fix(ai): handle tool execution timeout
  chore(db): add RLS policy for shipments
```

---

## EVERY API ROUTE MUST FOLLOW THIS PATTERN

```ts
import { z } from 'zod'
import { getServerUser } from '@/lib/supabase/server'

const schema = z.object({ ... })

export async function POST(req: Request) {
  // 1. Validate
  const body = schema.safeParse(await req.json())
  if (!body.success) {
    return Response.json({ data: null, error: body.error.message, meta: {} }, { status: 400 })
  }

  // 2. Auth
  const user = await getServerUser()
  if (!user) {
    return Response.json({ data: null, error: 'Unauthorized', meta: {} }, { status: 401 })
  }

  // 3. Execute + return
  const result = await doSomething(body.data)
  return Response.json({
    data: result,
    error: null,
    meta: { timestamp: new Date().toISOString() }
  })
}
```

HTTP codes: `200` OK · `201` Created · `400` Bad input · `401` No auth · `403` Wrong role · `404` Not found · `500` Server error

---

## DATABASE RULES

```
- RLS ON for every table. Write the policy before using the table.
- All tables have: id (uuid, gen_random_uuid()), created_at (timestamptz, now())
- Tables with user content: add deleted_at (timestamptz, nullable)
- FKs: always specify ON DELETE behavior
- Migrations: numbered files — 001_init.sql, 002_stores.sql, etc.
- Never use service role key in client-side code
- Never bypass RLS by using service role in frontend
```

---

## SECURITY RULES

```
- NEVER put SUPABASE_SERVICE_ROLE_KEY or ANTHROPIC_API_KEY in any 'use client' file
- NEVER log tokens, API keys, or user PII to console
- File uploads: validate MIME type server-side, max 5MB, strip EXIF
- Marketplace tokens: AES-256 encrypt before insert, decrypt only in server routes
- Webhook handlers: verify signature before processing (Midtrans, KirimAja)
- Rate limit every /api/* route: 100 req/min per IP via Upstash
```

---

## COMPONENT RULES

```
- Tailwind classes only. No inline styles, no CSS modules.
- No hardcoded color hex values. Use CSS variables: var(--color-primary)
- Every async action needs loading + error + success state
- Every form needs inline validation + disabled submit while loading
- Always next/image, never <img>
- Touch targets: min 44x44px
- Every page needs a loading.tsx and error.tsx in its folder
```

---

## ENV FILES

```
.env.local        → local dev, NEVER commit
.env.example      → commit this, all keys blank, no values
Vercel dashboard  → production secrets, never in repo
```

Update `.env.example` every time you add a new env var.

---

## WHEN STUCK

1. Check `03_ERD.md` for table/column names
2. Check `04_BACKEND.md` for API structure
3. Check `06_FRONTEND.md` for component patterns
4. If still stuck: build the simplest working version, add `// TODO: improve` comment, move on
5. Never block on something already specified in these docs — just implement it
