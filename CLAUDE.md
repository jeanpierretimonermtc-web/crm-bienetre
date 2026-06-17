@AGENTS.md

# Oryalis — CRM SaaS pour praticiens du bien-être

## Produit

**Oryalis** est un CRM SaaS multiplateforme (iOS / Android / Web) destiné aux praticiens du bien-être : naturopathes, thérapeutes MTC, distributeurs DoTerra/Zinzino, coachs, etc.

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
| Police | Inter (400/500/600/700) via `@expo-google-fonts/inter` |
| Déploiement web | Vercel (`npx vercel --prod`) |
| Migrations DB | Node.js + `pg` (scripts `migrate*.mjs`) |

**Important** : Expo SDK 56 n'est pas sur l'App Store public. iOS → TestFlight beta : `https://testflight.apple.com/join/GZJxxfUU`

---

## Architecture des dossiers

```
app/
  _layout.tsx              — Root layout : ThemeProvider > AuthProvider > Slot
                             Charge les polices Inter (useFonts)
  reset-password.tsx       — Route publique reset mot de passe (email Supabase)
  (auth)/
    _layout.tsx
    login.tsx
    register.tsx
  (app)/
    _layout.tsx            — Sidebar (web ≥768px) + Header mobile + Bottom tabs
                             Utilise DemoProvider, useTheme, StatusBar
    index.tsx              — Dashboard (KPIs, agenda, relances, LRP, mode démo)
    settings.tsx           — Profil praticien + toggle dark mode + masquer démo
    catalog/
      index.tsx            — Catalogue produits (onglets par marque, recherche, recommandation)
    clients/
      index.tsx            — Liste clients (search + filtres statut)
      new.tsx              — Formulaire création client
      [id]/
        index.tsx          — Fiche client (hub central)
        edit.tsx           — Édition fiche client
        appointments.tsx
        notes.tsx
        followups.tsx
        recommendations.tsx — Utilise CatalogProductPicker
    appointments/
      index.tsx            — Agenda : vue jour / vue semaine (grille horaire)
      new.tsx              — Nouveau RDV avec sélecteur client
    followups/
      index.tsx            — Relances globales (overdue / today / upcoming)

features/
  auth/AuthProvider.tsx    — Context session Supabase
  clients/                 — clientService.ts + useClients.ts + useClient.ts
  appointments/            — appointmentService.ts + useAppointments.ts
  notes/                   — noteService.ts + useNotes.ts
  followups/               — followupService.ts + useFollowups.ts
  recommendations/         — recommendationService.ts + useRecommendations.ts
  dashboard/               — useDashboard.ts (stats + LRP)
  catalogs/                — catalogService.ts + useCatalog.ts + CatalogProductPicker.tsx
  demo/                    — DemoProvider.tsx + demoService.ts
                             Charge/supprime des données fictives pour démo
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
  theme/
    colors.ts              — Design system : lightColors, darkColors, ThemeColors,
                             lightStatusColors, darkStatusColors,
                             export colors.{light,dark,brand,kpi,gradients}
    fonts.ts               — Constantes typographiques Inter (display/body/medium/semibold/bold)
    ThemeProvider.tsx      — Context thème : useTheme() → { mode, colors, statusColors,
                             toggleTheme, setMode }. Persisté AsyncStorage @oryalis:themeMode
  components/ui/           — Button, Card, Badge (StatusBadge), Avatar, Input, TextArea, EmptyState

assets/
  logo-icon.png            — Glyphe colibri transparent (extrait du master 1024, chroma-key)
  wordmark-day.png         — "ORYALIS" texte navy, fond transparent — sidebar light mode
  wordmark-dark.png        — "ORYALIS" texte gradient cyan→bleu→violet, fond transparent — sidebar dark mode
  wordmark-white.png       — "ORYALIS" texte blanc, fond transparent — header mobile (fond coloré)
  icon.png                 — Icône app 1024×1024 (iOS / Expo)
  favicon.png              — Favicon web 192×192
  android-icon-foreground.png / android-icon-background.png / android-icon-monochrome.png
  splash-icon.png

supabase/migrations/       — SQL de référence (non exécuté via CLI)
migrate*.mjs               — Scripts Node.js + pg pour migrations DB
```

---

## Design system

### Thème light / dark

Le projet a un **vrai système de thème** clair/sombre avec bascule dans Paramètres > Affichage.

**Règle absolue** : ne jamais importer `colors` statiquement depuis `colors.ts`. Toujours `useTheme()` à l'intérieur d'un composant React.

```ts
// ✅ Correct
const { colors, statusColors, mode } = useTheme()
const styles = useMemo(() => makeStyles(colors), [colors])

// ❌ Interdit — ne réagit pas au changement de thème
import { lightColors as colors } from '@/shared/theme/colors'
```

**Pattern standard pour tout composant avec styles colorés :**

```tsx
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ThemeColors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'

export function MonComposant() {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  // ...
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({ ... })
}
```

Si un helper au scope module a besoin de couleurs, passer `colors` en paramètre (ne peut pas appeler un hook hors composant).

### Palette (tokens principaux)

| Token | Light | Dark |
|---|---|---|
| `bg` | `#FFFFFF` | `#0B1220` |
| `surface` | `#F8FAFC` | `#111827` |
| `bgDim` | `#F1F5F9` | `#1E293B` |
| `card` | `#FFFFFF` | `#111827` |
| `border` | `#E2E8F0` | `#334155` |
| `text` | `#0F172A` | `#F8FAFC` |
| `textSecondary` | `#475569` | `#CBD5E1` |
| `textTertiary` | `#94A3B8` | `#64748B` |
| `primary` (CTA) | `#2563EB` | `#3B82F6` |
| `primaryAction` | `#1D4ED8` | `#2563EB` |
| `primaryLight` | `#DBEAFE` | `#1E3A5F` |

**Accents brand** (uniquement pour icônes, KPIs, états importants — pas partout) :
- `secondary` : cyan `#22D3EE`
- `tertiary` : violet `#6D3BFF` / `#8B5CF6` dark
- `success` : `#10B981` · `warning` : `#F59E0B` · `danger` : `#EF4444`

**KPI colors** (accès via `colors.kpi` — import statique autorisé ici car pas de styles RN) :
- clients `#22D3EE` · agenda `#3B82F6` · revenus `#10B981` · relances `#F59E0B`

**Gradient officiel** : `['#22D3EE', '#3B82F6', '#6D3BFF']` (dans `colors.gradients.brand`)

### Statuts CRM

| Statut | Light bg | Light text | Dark bg | Dark text |
|---|---|---|---|---|
| `active` | `#D1FAE5` | `#059669` | `#064E3B` | `#34D399` |
| `prospect` | `#DBEAFE` | `#1D4ED8` | `#1E3A5F` | `#60A5FA` |
| `inactive` | `#FEF3C7` | `#B45309` | `#451A03` | `#FCD34D` |
| `vip` | `#EDE9FE` | `#5B21B6` | `#1E1547` | `#A78BFA` |
| `advisor` | `#ECFEFF` | `#0E7490` | `#0C3B47` | `#67E8F9` |

### Typographie (Inter)

```ts
import { fonts } from '@/shared/theme/fonts'
// fonts.display / fonts.body / fonts.medium / fonts.semibold / fonts.bold
// → 'Inter_700Bold' / 'Inter_400Regular' / 'Inter_500Medium' / 'Inter_600SemiBold' / 'Inter_700Bold'
```

### Composants UI — border-radius premium

| Composant | borderRadius |
|---|---|
| Button (md) | 12 |
| Button (sm) | 10 |
| Card | 16 + borderWidth 1 |
| Input / TextArea | 12 |
| StatusBadge | 8 |

### Header mobile

- Fond : `colors.primary` (bleu)
- Wordmark : `wordmark-white.png` (texte blanc — les versions gradient/navy seraient invisibles sur fond bleu)
- `StatusBar style="light"` pour icônes système iOS en blanc
- Sidebar web day → `wordmark-day.png`, dark → `wordmark-dark.png`

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
catalog_products  — id, catalog_id, sku, name, category, image_url, created_at
                    (128 produits doTERRA seedés, images dans bucket Supabase Storage public)
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
- `migrate5.mjs` — 76 produits doTERRA supplémentaires + bucket images public + image_url

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

## Architecture catalogues

Les produits à recommander aux clients viennent de **catalogues** :

- **Officiels** (`type='official'`, `user_id=null`) : maintenus par Oryalis, visibles par tous
  - `slug='doterra'` : 128 produits seedés avec images S3
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
- **Thème** : toujours `useTheme()` — jamais import statique de `colors` (voir section Design system)
- **Styles** : pattern `makeStyles(colors: ThemeColors)` + `useMemo(() => makeStyles(colors), [colors])`
- **Fonts** : utiliser `fonts.semibold` etc. depuis `shared/theme/fonts.ts` — pas de `fontWeight` hardcodé
- Hooks : `use[Resource].ts` dans `features/[resource]/`
- Services : `[resource]Service.ts` dans `features/[resource]/`
- Composants UI partagés : uniquement dans `shared/components/ui/`
- **PowerShell + BOM** : ne jamais piper des strings vers des processus natifs via PowerShell (BOM 0xFEFF). Toujours utiliser Node.js API calls pour écrire des fichiers ou appeler des APIs externes.
- **Scripts Node utilitaires** (ex: chroma-key PNG) : créer comme `.mjs` à la racine du projet (besoin de `node_modules`), supprimer après usage, ne jamais committer

---

## État du projet

### Phase 1 ✅ Terminée
Clients, RDV, Notes, Relances, Recommandations, Module DoTerra (128 produits + images), Dashboard KPI, Agenda semaine/jour, Mode démo (chargement/suppression), Page Paramètres (profil + dark mode toggle), Sidebar responsive web, i18n EN/FR, Architecture catalogues DB, Design system light/dark mode premium (Inter, palette Linear/Stripe).

### Phase 2 — À construire
- [ ] Stripe abonnements (Free / Pro 29€ / Cabinet 79€)
- [ ] Webhook Stripe → `subscriptions` table Supabase
- [ ] Gates fonctionnalités Pro (limite 20 clients plan Free)
- [ ] Landing page oryalis.app
- [ ] Onboarding guidé 3 étapes (premier login)
- [ ] Emails transactionnels (Resend) — confirmation compte, récap RDV
- [ ] Page Paramètres : langue + timezone (section à compléter)

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
- [ ] App stores iOS + Android (publication)
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
