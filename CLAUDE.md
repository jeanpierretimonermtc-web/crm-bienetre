@AGENTS.md

# Caelys — CRM SaaS pour praticiens du bien-être

## Produit

**Caelys** est un CRM SaaS multiplateforme (iOS / Android / Web) destiné aux praticiens du bien-être : naturopathes, thérapeutes MTC, distributeurs DoTerra/Zinzino, coachs, etc.

- **Production** : https://crm-bienetre.vercel.app
- **GitHub** : https://github.com/jeanpierretimonermtc-web/crm-bienetre.git
- **Supabase project** : `nhpvjfyjyculnijipzoa` (région eu-west-1)
- **Propriétaire** : Jean-Pierre Timoner (`jeanpierre.timoner.mtc@gmail.com`)

---

## Stack technique

| Couche | Technologie |
|---|---|
| Mobile + Web | Expo SDK 56 + React Native 0.85 |
| Navigation | Expo Router v4 (file-based) |
| Backend / DB | Supabase (PostgreSQL + Auth + RLS) |
| i18n | i18next + react-i18next + expo-localization |
| Déploiement web | Vercel (`npx vercel --prod`) |
| Migrations DB | Node.js + `pg` (scripts `migrate*.mjs`) |

**Important** : Expo SDK 56 n'est pas sur l'App Store public. iOS → TestFlight beta : `https://testflight.apple.com/join/GZJxxfUU`

---

## Architecture des dossiers

```
app/
  _layout.tsx              — Root layout (AuthProvider + i18n)
  (auth)/
    login.tsx
    register.tsx
  (app)/
    _layout.tsx            — Sidebar (web ≥768px) + Bottom tabs (mobile)
    index.tsx              — Dashboard (KPIs, agenda, relances, LRP)
    clients/
      index.tsx            — Liste clients avec search + filtres statut
      new.tsx              — Formulaire création client
      [id]/
        index.tsx          — Fiche client (hub central)
        appointments.tsx
        notes.tsx
        followups.tsx
        recommendations.tsx — Utilise CatalogProductPicker
    appointments/index.tsx — Agenda global
    followups/index.tsx    — Relances globales (overdue / today / upcoming)

features/
  auth/AuthProvider.tsx    — Context session Supabase
  clients/                 — clientService.ts + useClients.ts + useClient.ts
  appointments/            — appointmentService.ts + useAppointments.ts
  notes/                   — noteService.ts + useNotes.ts
  followups/               — followupService.ts + useFollowups.ts
  recommendations/         — recommendationService.ts + useRecommendations.ts
  dashboard/               — useDashboard.ts (stats + LRP)
  catalogs/                — catalogService.ts + useCatalog.ts + CatalogProductPicker.tsx
  modules/
    doterra/               — products.ts (référence legacy) + DoterraProductPicker (déprécié)

shared/
  lib/
    supabase.ts            — Client Supabase avec AsyncStorage
    types.ts               — Tous les types TypeScript
  i18n/
    index.ts               — Config i18next (EN canonique, fallback EN)
    locales/en.json        — Langue canonique (source de vérité)
    locales/fr.json        — Traduction française complète
  theme/colors.ts          — Palette couleurs + statusColors
  components/ui/           — Button, Card, Badge, Avatar, Input, TextArea, EmptyState

supabase/migrations/       — SQL de référence (non exécuté via CLI)
migrate*.mjs               — Scripts Node.js + pg pour migrations DB
```

---

## Base de données (schéma complet)

### Tables

```sql
profiles          — id (= auth.users.id), full_name, email, locale, timezone, plan, updated_at
clients           — id, user_id, full_name, first_name, email, phone, status, source, language,
                    birth_date, inscription_date, profession, children, interests[], client_type,
                    medical_treatment, medical_notes, particularities, welcome_email_sent,
                    doterra_id, next_lrp_date, created_at, updated_at
appointments      — id, client_id, user_id, appointment_number, appointment_date,
                    themes_discussed, solutions_proposed, recap_sent, next_appointment_date
notes             — id, client_id, user_id, content, created_at
followups         — id, client_id, user_id, title, content, due_date, done, updated_at
recommendations   — id, client_id, user_id, product_name, reason, status, catalog_id, product_id
catalogs          — id, slug (UNIQUE), name, brand, type (official|custom), user_id (null=officiel),
                    color, icon, created_at
catalog_products  — id, catalog_id, sku, name, category, created_at
```

### RLS
Toutes les tables ont RLS activé. Pattern : `USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`.
Exception `catalogs` : les catalogues `type='official'` sont visibles par tous (`user_id IS NULL`).

### Trigger
`handle_new_user()` → insère dans `profiles` à chaque signup. `SECURITY DEFINER SET search_path = public`.

---

## Migrations DB

**Ne jamais utiliser Supabase CLI** (projet sous un compte différent).  
Toujours utiliser Node.js + `pg` :

```js
// Pattern migrate*.mjs
import pg from 'pg'
const { Client } = pg
const password = encodeURIComponent('Smallville!0945!')
const client = new Client({
  connectionString: `postgresql://postgres.nhpvjfyjyculnijipzoa:${password}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`
})
await client.connect()
// ... queries ...
await client.end()
```

Historique :
- `migrate.mjs` — init tables + trigger
- `migrate2.mjs` — correctifs RLS + trigger
- `migrate3.mjs` — ajout first_name + inscription_date sur clients
- `migrate4.mjs` — tables catalogs + catalog_products + seed doTERRA (52 produits)

---

## Déploiement

**Le webhook GitHub→Vercel n'est PAS actif.** Toujours déployer manuellement :

```bash
# 1. Commit + push GitHub
git add ... && git commit -m "..." && git push origin main

# 2. Déployer sur Vercel
npx vercel --prod
```

Le build Vercel exécute `npx expo export --platform web` → dossier `dist/`.

---

## i18n

- **Langue canonique** : `en` (EN est la source de vérité pour toutes les clés)
- **Fallback** : `en`
- **Détection** : `expo-localization` détecte la langue appareil
- **Fichiers** : `shared/i18n/locales/en.json` + `fr.json`
- Toujours ajouter une clé en EN **et** FR simultanément
- Pas de string français codé en dur dans les composants — toujours `t('...')`
- Pour les dates : `const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US'`

---

## Architecture catalogues (Phase 2)

Les produits à recommander aux clients viennent de **catalogues** :

- **Officiels** (`type='official'`, `user_id=null`) : maintenus par Caelys, visibles par tous
  - `slug='doterra'` : 52 produits seedés
  - À venir : `slug='zinzino'`, etc.
- **Custom** (`type='custom'`, `user_id=X`) : créés par le praticien

Pour ajouter une nouvelle marque : `INSERT INTO catalogs` + `INSERT INTO catalog_products` — **zéro changement de code**.

`CatalogProductPicker` (`features/catalogs/`) est le composant générique qui charge les catalogues depuis la DB avec onglets par marque.

---

## Conventions de code

- **Pas de `Alert.alert`** sur web — toujours `errorMsg` state inline
- **Pas de `console.log`** en prod — uniquement `console.error` dans les catch
- **Pas de commentaires** sauf si la logique est non-évidente
- **Pas de mock** — toujours les vraies données Supabase
- Hooks : `use[Resource].ts` dans `features/[resource]/`
- Services : `[resource]Service.ts` dans `features/[resource]/`
- Composants UI partagés : uniquement dans `shared/components/ui/`
- **PowerShell + BOM** : ne jamais piper des strings vers des processus natifs via PowerShell (BOM 0xFEFF). Toujours utiliser Node.js API calls pour écrire des fichiers ou appeler des APIs externes.

---

## État du projet

### Phase 1 ✅ Terminée
Clients, RDV, Notes, Relances, Recommandations, Module DoTerra, Dashboard KPI, Sidebar responsive, i18n EN/FR, Architecture catalogues DB.

### Phase 2 — À construire
- [ ] Stripe abonnements (Free / Pro 29€ / Cabinet 79€)
- [ ] Webhook Stripe → `subscriptions` table Supabase
- [ ] Gates fonctionnalités Pro
- [ ] Landing page lumora.app
- [ ] Onboarding guidé 3 étapes
- [ ] Données de démo au premier login
- [ ] Emails transactionnels (Resend)
- [ ] Agenda calendrier (vue semaine + jour)
- [ ] Page Paramètres (profil, langue, timezone)

### Phase 3 — Rétention
- [ ] Export PDF fiche client
- [ ] Comptabilité (revenus + URSAF)
- [ ] Facturation PDF
- [ ] RGPD dashboard + consentements
- [ ] Résumé IA séance (Claude API)

### Phase 4 — Croissance mondiale
- [ ] Module MTC complet (référence : `C:\Users\timjp\development\synoria`)
- [ ] Module Zinzino + seed catalogue
- [ ] Marketplace praticiens
- [ ] App stores iOS + Android
- [ ] Multilingue ES, DE, PT, AR (RTL)
- [ ] White-label associations

---

## Plans tarifaires cibles

| Plan | Prix | Limites |
|---|---|---|
| Free | 0€ | 20 clients, 1 module |
| Pro | 29€/mois | Illimité, tous modules, export, IA |
| Cabinet | 79€/mois | Pro + 5 praticiens + marque blanche |

---

## Référence Synoria

`C:\Users\timjp\development\synoria` — App desktop Electron pour MTC (Electron 28 + React 18 + SQLite). Utiliser comme référence fonctionnelle pour :
- Phase 3 : comptabilité + facturation (même logique URSAF)
- Phase 4 : module MTC (formulaires séance, diagnostic énergétique)
- RGPD dashboard (consentements, registre Art.30)
