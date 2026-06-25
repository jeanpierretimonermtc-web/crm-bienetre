import { supabase } from '@/shared/lib/supabase'
import type { NextActionType } from '@/shared/lib/types'

// ── Types ─────────────────────────────────────────────────────────────────────

export type AutoTrigger = 'new_client' | 'order' | 'appointment' | 'no_contact'

export interface AutomationRule {
  id:          string
  trigger:     AutoTrigger
  moduleKey:   string
  delayDays:   number
  title:       string          // variables: {prénom}
  actionType:  NextActionType
  description: string
}

// ── Règles par défaut ─────────────────────────────────────────────────────────

export const AUTOMATION_RULES: AutomationRule[] = [
  // ── Nouveau client (J+3, J+30) ────────────────────────────────────────────
  {
    id: 'nc_j3',  trigger: 'new_client', moduleKey: 'auto_new_client', delayDays: 3,
    title:       'J+3 · Réception produits {prénom}',
    actionType:  'whatsapp',
    description: 'Vérifier que le client a bien reçu ses produits',
  },
  {
    id: 'nc_j30', trigger: 'new_client', moduleKey: 'auto_new_client', delayDays: 30,
    title:       'J+30 · Bilan 1 mois {prénom} — satisfaction ?',
    actionType:  'call',
    description: 'Bilan mensuel pour fidéliser le nouveau client',
  },

  // ── Commande (J+3, J+15, J+30) ────────────────────────────────────────────
  {
    id: 'ord_j3',  trigger: 'order', moduleKey: 'auto_order', delayDays: 3,
    title:       'J+3 · Réception commande {prénom} — bien reçu ?',
    actionType:  'whatsapp',
    description: 'Confirmer la bonne réception de la commande',
  },
  {
    id: 'ord_j15', trigger: 'order', moduleKey: 'auto_order', delayDays: 15,
    title:       'J+15 · Retours produits {prénom} après 2 semaines',
    actionType:  'whatsapp',
    description: 'Recueillir les retours après 2 semaines d\'utilisation',
  },
  {
    id: 'ord_j30', trigger: 'order', moduleKey: 'auto_order', delayDays: 30,
    title:       'J+30 · Check mensuel {prénom} — nouvelle commande ?',
    actionType:  'call',
    description: 'Fidélisation et opportunité de récommande',
  },

  // ── Rendez-vous complété (J+7) ────────────────────────────────────────────
  {
    id: 'appt_j7', trigger: 'appointment', moduleKey: 'auto_appointment', delayDays: 7,
    title:       'J+7 · Feedback RDV {prénom} — des questions ?',
    actionType:  'whatsapp',
    description: 'Suivi une semaine après le rendez-vous',
  },

  // ── Sans contact > 30 jours ───────────────────────────────────────────────
  {
    id: 'noc_30d', trigger: 'no_contact', moduleKey: 'auto_no_contact', delayDays: 0,
    title:       'Reprendre contact {prénom} — absent depuis 30+ jours',
    actionType:  'call',
    description: 'Relance automatique après 30 jours sans contact',
  },
]

export const TRIGGER_LABELS: Record<AutoTrigger, string> = {
  new_client:  'Nouveau client',
  order:       'Nouvelle commande',
  appointment: 'RDV complété',
  no_contact:  'Sans contact 30+ jours',
}

export const TRIGGER_ICONS: Record<AutoTrigger, string> = {
  new_client:  '👤',
  order:       '🛒',
  appointment: '📅',
  no_contact:  '😴',
}

export const TRIGGER_MODULE: Record<AutoTrigger, string> = {
  new_client:  'auto_new_client',
  order:       'auto_order',
  appointment: 'auto_appointment',
  no_contact:  'auto_no_contact',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function dueDateStr(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split('T')[0]
}

function render(title: string, prénom: string): string {
  return title.replace(/\{prénom\}/g, prénom)
}

async function getEnabledModules(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('user_business_profiles')
    .select('active_modules')
    .eq('user_id', userId)
    .single()
  return (data?.active_modules as string[]) ?? [
    'products','renewals_lrp','downline','goals','calendar_sync',
    'auto_new_client','auto_order','auto_appointment','auto_no_contact',
  ]
}

async function insertFollowup(
  userId: string,
  clientId: string,
  title: string,
  due: string,
  actionType: NextActionType,
): Promise<void> {
  // Idempotent: ne crée pas si relance auto avec même titre existe déjà et non faite
  const { count } = await supabase
    .from('followups')
    .select('id', { count: 'exact', head: true })
    .eq('user_id',       userId)
    .eq('client_id',     clientId)
    .eq('auto_generated', true)
    .eq('done',          false)
    .eq('title',         title)

  if ((count ?? 0) > 0) return

  await supabase.from('followups').insert({
    user_id:       userId,
    client_id:     clientId,
    title,
    due_date:      due,
    done:          false,
    auto_generated: true,
    action_type:   actionType,
  })
}

// ── Triggers publics ──────────────────────────────────────────────────────────

export async function triggerNewClient(
  userId: string,
  clientId: string,
  firstName: string,
): Promise<void> {
  try {
    const modules = await getEnabledModules(userId)
    if (!modules.includes('auto_new_client')) return
    const rules = AUTOMATION_RULES.filter(r => r.trigger === 'new_client')
    for (const rule of rules) {
      await insertFollowup(userId, clientId, render(rule.title, firstName), dueDateStr(rule.delayDays), rule.actionType)
    }
  } catch (e) {
    console.error('[automation.newClient]', e)
  }
}

export async function triggerOrder(
  userId: string,
  clientId: string,
  firstName: string,
): Promise<void> {
  try {
    const modules = await getEnabledModules(userId)
    if (!modules.includes('auto_order')) return
    const rules = AUTOMATION_RULES.filter(r => r.trigger === 'order')
    for (const rule of rules) {
      await insertFollowup(userId, clientId, render(rule.title, firstName), dueDateStr(rule.delayDays), rule.actionType)
    }
  } catch (e) {
    console.error('[automation.order]', e)
  }
}

export async function triggerAppointmentCompleted(
  userId: string,
  clientId: string,
  firstName: string,
): Promise<void> {
  try {
    const modules = await getEnabledModules(userId)
    if (!modules.includes('auto_appointment')) return
    const rules = AUTOMATION_RULES.filter(r => r.trigger === 'appointment')
    for (const rule of rules) {
      await insertFollowup(userId, clientId, render(rule.title, firstName), dueDateStr(rule.delayDays), rule.actionType)
    }
  } catch (e) {
    console.error('[automation.appointment]', e)
  }
}

export async function checkNoContact(userId: string): Promise<void> {
  try {
    const modules = await getEnabledModules(userId)
    if (!modules.includes('auto_no_contact')) return

    const rule = AUTOMATION_RULES.find(r => r.id === 'noc_30d')!
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()

    const { data: clients } = await supabase
      .from('clients')
      .select('id, first_name, full_name')
      .eq('user_id', userId)
      .lt('updated_at', thirtyDaysAgo)
      .in('status', ['active', 'loyal', 'new_client'])
      .limit(20)

    for (const c of clients ?? []) {
      const prénom = c.first_name || c.full_name.split(' ')[0]
      await insertFollowup(userId, c.id, render(rule.title, prénom), dueDateStr(0), rule.actionType)
    }
  } catch (e) {
    console.error('[automation.noContact]', e)
  }
}
