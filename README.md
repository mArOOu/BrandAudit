# BrandAudit

BrandAudit is a local-first workspace for creating polished, editable brand audit reports.

The current MVP supports:

- Editing client and brand context
- Adding, editing, deleting, approving, and reordering findings
- Report preview
- Browser print / Save as PDF
- Draft persistence in the current browser using `localStorage`

Supabase and Gemini configuration are documented below as the next integration step. **Adding environment variables alone does not enable either integration yet**; the current UI still uses local browser storage and does not call Gemini.

## Requirements

- Node.js 20 LTS or newer
- npm
- A Supabase account, when persistent storage is required
- A Google AI Studio account/API key, when Gemini assistance is implemented

## Run the application locally

From the project directory:

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful validation commands:

```powershell
npm run lint
npm run typecheck
npm run build
```

## Environment variables

Create a local environment file by copying the example:

```powershell
Copy-Item .env.example .env.local
```

Add values to `.env.local`:

```dotenv
# Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key

# Gemini server-side settings
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
```

Restart `npm run dev` after changing `.env.local`.

### Secret handling

- Never commit `.env.local`.
- Never put `GEMINI_API_KEY` in a variable beginning with `NEXT_PUBLIC_`.
- The Supabase publishable/anonymous key is intended for client configuration, but it is not a replacement for Row Level Security.
- Do not use a Supabase service-role key in browser code.
- Do not paste API keys into source files, screenshots, issues, or chat messages.

## Configure Supabase

### 1. Create a Supabase project

1. Open [supabase.com](https://supabase.com/).
2. Create an account or sign in.
3. Create a new project.
4. Choose a strong database password and store it securely.
5. Wait for the project to finish provisioning.

### 2. Copy the project URL and publishable key

In the Supabase dashboard:

1. Open **Project Settings**.
2. Open **API**.
3. Copy the project URL into `NEXT_PUBLIC_SUPABASE_URL`.
4. Copy the publishable/anonymous client key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Use the current key label shown by the dashboard. Supabase is transitioning from legacy `anon` terminology to publishable keys, but both refer to the client-safe key in projects where the dashboard still uses the older label.

### 3. Add the initial database schema

Open **SQL Editor** in Supabase and run a schema appropriate for the MVP:

```sql
create extension if not exists "pgcrypto";

create table public.audits (
  id uuid primary key default gen_random_uuid(),
  client_name text not null default '',
  brand_name text not null default '',
  website text not null default '',
  industry text not null default '',
  audience text not null default '',
  objectives text not null default '',
  status text not null default 'draft'
    check (status in ('draft', 'in_progress', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.findings (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits(id) on delete cascade,
  title text not null default '',
  category text not null default '',
  observation text not null default '',
  impact text not null default '',
  recommendation text not null default '',
  priority text not null default 'medium'
    check (priority in ('high', 'medium', 'low')),
  status text not null default 'draft'
    check (status in ('draft', 'reviewed', 'approved')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.evidence_assets (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits(id) on delete cascade,
  finding_id uuid references public.findings(id) on delete set null,
  file_path text,
  source_url text,
  caption text not null default '',
  observation text not null default '',
  created_at timestamptz not null default now()
);

create table public.report_configurations (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null unique references public.audits(id) on delete cascade,
  studio_name text not null default '',
  logo_path text,
  report_date date,
  accent_color text not null default '#c5f36a',
  enabled_sections jsonb not null default
    '["cover", "summary", "overview", "methodology", "findings", "action_plan", "closing"]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

This schema is a starting point for the integration. The current application does not yet read or write these tables.

### 4. Enable Row Level Security before production use

The MVP has no authentication or user ownership yet. Do not expose production data until authentication and ownership policies have been implemented.

When authentication is added, enable RLS:

```sql
alter table public.audits enable row level security;
alter table public.findings enable row level security;
alter table public.evidence_assets enable row level security;
alter table public.report_configurations enable row level security;
```

Then add policies based on an ownership column such as `user_id uuid references auth.users(id)`. For example, an `audits` table intended for authenticated users would need policies that only allow `auth.uid() = user_id`.

Do not use a permissive policy such as `using (true)` for private client audits.

### 5. Install the Supabase client when implementing persistence

```powershell
npm install @supabase/supabase-js
```

Create a browser-safe client module, for example `lib/supabase/client.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
```

Before shipping, replace the non-null assertions with explicit environment validation so a missing configuration produces a clear error.

For server-side mutations and authenticated sessions, use a separate server client and follow the current Supabase Next.js SSR guidance rather than reusing a browser client in a server action.

### 6. Configure evidence storage

When evidence uploads are implemented:

1. Open **Storage** in Supabase.
2. Create a private bucket named `evidence`.
3. Store only the object path in `evidence_assets.file_path`.
4. Generate signed URLs when displaying private evidence.
5. Add Storage policies that restrict paths to the authenticated owner.

Do not make client evidence publicly readable by default.

## Configure Gemini AI

### 1. Create a Gemini API key

1. Open [Google AI Studio](https://aistudio.google.com/).
2. Sign in with a Google account.
3. Create or select a project.
4. Create an API key.
5. Put the key in `.env.local` as `GEMINI_API_KEY`.

The Gemini key must only be used from server-side code such as a Route Handler or Server Action. Do not import it into a Client Component.

### 2. Choose a model

Set the model through `GEMINI_MODEL` rather than hardcoding it throughout the application:

```dotenv
GEMINI_MODEL=gemini-2.5-flash
```

Confirm model availability and current limits in the Google AI Studio documentation for the project and region you are using. Model names, quotas, and pricing can change.

### 3. Install the official SDK when implementing AI operations

```powershell
npm install @google/genai zod
```

The provider should be hidden behind a server-side abstraction, for example:

```ts
export interface AiProvider {
  improveFinding(input: ImproveFindingInput): Promise<ImprovedFinding>;
  draftRecommendation(input: RecommendationInput): Promise<RecommendationDraft>;
  suggestInvestigationAreas(input: InvestigationInput): Promise<InvestigationSuggestions>;
  summarizeApprovedFindings(input: SummaryInput): Promise<ExecutiveSummary>;
}
```

Gemini should be one implementation of that interface. This keeps the UI independent from the provider and makes testing possible with a mock provider.

### 4. Validate every response

AI output must be parsed and validated with Zod before it reaches the UI or database. A response should contain structured fields such as:

```ts
const findingDraftSchema = z.object({
  title: z.string().min(1),
  observation: z.string().min(1),
  impact: z.string().min(1),
  recommendation: z.string().min(1),
  missingInformation: z.array(z.string()),
});
```

If parsing fails, return an explicit error to the user. Do not silently save malformed output or substitute invented content.

### 5. Keep evidence and inference separate

Prompts should clearly tell Gemini:

- Use only the supplied audit context and evidence.
- Do not claim to have visited a website unless the application actually retrieved it.
- Do not invent client facts, competitor facts, performance data, or image observations.
- State what information is missing when evidence is insufficient.
- Return suggestions for designer review, never final approved findings.

All generated content should appear as editable drafts. A user must explicitly approve it before it is included in the report.

### 6. Add operational safeguards

Server-side AI routes should include:

- Request validation
- Authentication and audit ownership checks
- A request timeout
- Rate-limit handling
- Provider error handling
- Quota exhaustion handling
- A reasonable input/output size limit
- Logging that excludes API keys and sensitive client evidence

Do not call Gemini on every keystroke. Invoke it only after an explicit user action such as **Improve writing** or **Draft recommendation**.

## Recommended integration order

1. Add Zod domain schemas shared by forms and server mutations.
2. Add Supabase client modules and a persistence adapter.
3. Add authentication and `user_id` ownership.
4. Move audits and findings from `localStorage` to Supabase.
5. Add the private evidence Storage bucket and upload flow.
6. Add a server-side Gemini provider.
7. Add explicit AI actions with validated, editable drafts.
8. Keep browser storage as a development fallback when Supabase variables are absent.
9. Add tests for persistence, authorization, malformed AI responses, and report rendering.

## Current integration status

| Area | Status |
| --- | --- |
| Local audit editing | Available |
| Browser draft persistence | Available |
| Report preview | Available |
| Browser Save as PDF | Available |
| Supabase database adapter | Not implemented |
| Supabase authentication | Not implemented |
| Supabase evidence storage | Not implemented |
| Gemini provider abstraction | Not implemented |
| AI writing actions | Not implemented |

## Reference documentation

- [Supabase documentation](https://supabase.com/docs)
- [Supabase Next.js guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API documentation](https://ai.google.dev/gemini-api/docs)
- [Google Gen AI JavaScript SDK](https://github.com/googleapis/js-genai)
