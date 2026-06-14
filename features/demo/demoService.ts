import { supabase } from '@/shared/lib/supabase'

function daysAgo(n: number, hour = 10): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

function daysFromNow(n: number, hour = 10): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

function dateOffset(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

// Throws on DB error — callers must handle it
export async function getDemoClientsCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('source', 'demo')
  if (error) throw error
  return count ?? 0
}

export async function loadDemoData(userId: string): Promise<void> {
  // Hard guard — throws if count check fails (prevents silent duplicate inserts)
  const existing = await getDemoClientsCount(userId)
  if (existing > 0) return

  // ── 1. Clients ────────────────────────────────────────────────────────────
  const { data: insertedClients, error: clientsErr } = await supabase
    .from('clients')
    .insert([
      {
        user_id: userId,
        first_name: 'Sophie',
        full_name: 'Sophie Durand',
        email: 'sophie.durand@email.fr',
        phone: '06 12 34 56 78',
        status: 'active',
        source: 'demo',
        profession: 'Enseignante',
        inscription_date: dateOffset(-180),
        birth_date: '1985-03-22',
        client_type: 'Naturopathie',
        interests: ['Nutrition', 'Stress', 'Sommeil'],
        particularities: 'Sensible au gluten\nFatigue chronique depuis 2 ans',
        medical_treatment: false,
        language: 'fr',
        welcome_email_sent: true,
      },
      {
        user_id: userId,
        first_name: 'Marc',
        full_name: 'Marc Lambert',
        email: 'marc.lambert@gmail.com',
        phone: '06 98 76 54 32',
        status: 'prospect',
        source: 'demo',
        profession: 'Commercial',
        inscription_date: dateOffset(-14),
        birth_date: '1979-11-08',
        client_type: 'Première consultation',
        interests: ['Énergie', 'Sport', 'Alimentation'],
        particularities: 'Sportif régulier, stress important au travail',
        medical_treatment: false,
        language: 'fr',
        welcome_email_sent: false,
      },
      {
        user_id: userId,
        first_name: 'Elise',
        full_name: 'Elise Bernard',
        email: 'elise.b@orange.fr',
        phone: '07 11 22 33 44',
        status: 'vip',
        source: 'demo',
        profession: 'Infirmière',
        inscription_date: dateOffset(-365),
        birth_date: '1990-07-14',
        client_type: 'Suivi régulier',
        interests: ['Sophrologie', 'Gestion du stress', 'Sommeil', 'Respiration'],
        particularities: 'Travail en horaires décalés\nAnxiété modérée\nSuivi depuis 1 an',
        medical_treatment: true,
        medical_notes: 'Escitalopram 10mg — prescrit par médecin traitant',
        language: 'fr',
        welcome_email_sent: true,
      },
      {
        user_id: userId,
        first_name: 'Claire',
        full_name: 'Claire Lefebvre',
        email: 'claire.lefebvre@yahoo.fr',
        phone: '06 55 44 33 22',
        status: 'active',
        source: 'demo',
        profession: 'Chef de projet',
        inscription_date: dateOffset(-90),
        birth_date: '1988-01-30',
        client_type: 'Relaxation guidée',
        interests: ['Méditation', 'Respiration', 'Yoga', 'Pleine conscience'],
        medical_treatment: false,
        language: 'fr',
        welcome_email_sent: true,
      },
      {
        user_id: userId,
        first_name: 'Julien',
        full_name: 'Julien Petit',
        email: 'j.petit@work.fr',
        phone: '07 66 77 88 99',
        status: 'inactive',
        source: 'demo',
        profession: 'Ingénieur',
        inscription_date: dateOffset(-300),
        birth_date: '1982-05-19',
        client_type: 'Suivi mensuel',
        interests: ['Nutrition', 'Detox', 'Perte de poids'],
        particularities: 'A arrêté le suivi sans prévenir. À relancer.',
        medical_treatment: false,
        language: 'fr',
        welcome_email_sent: true,
      },
      {
        user_id: userId,
        first_name: 'Marie-Christine',
        full_name: 'Marie-Christine Moreau',
        email: 'mc.moreau@gmail.com',
        phone: '06 33 22 11 00',
        status: 'advisor',
        source: 'demo',
        profession: 'Conseillère bien-être',
        inscription_date: dateOffset(-200),
        birth_date: '1975-08-03',
        client_type: 'doTERRA',
        interests: ['Huiles essentielles', 'LRP', 'Bien-être famille'],
        medical_treatment: false,
        doterra_id: 'DT-293847',
        next_lrp_date: dateOffset(5),
        language: 'fr',
        welcome_email_sent: true,
      },
    ])
    .select('id')

  if (clientsErr || !insertedClients) throw clientsErr ?? new Error('clients insert failed')

  // Positional indexing — no string comparison, no accent issues
  const [sophieId, marcId, eliseId, claireId, julienId] = insertedClients.map(c => c.id)

  // ── 2. Appointments ───────────────────────────────────────────────────────
  const { error: apptErr } = await supabase.from('appointments').insert([
    {
      user_id: userId, client_id: sophieId,
      appointment_number: 1,
      appointment_date: daysAgo(90, 10),
      themes_discussed: 'Bilan initial naturopathie — habitudes alimentaires',
      solutions_proposed: 'Programme nutrition anti-inflammatoire 4 semaines',
      recap_sent: true,
      next_appointment_date: daysAgo(45, 10),
    },
    {
      user_id: userId, client_id: sophieId,
      appointment_number: 2,
      appointment_date: daysAgo(45, 10),
      themes_discussed: 'Suivi nutrition — amélioration énergie constatée',
      solutions_proposed: 'Magnésium + vitamine D',
      recap_sent: true,
      next_appointment_date: daysFromNow(7, 10),
    },
    {
      user_id: userId, client_id: sophieId,
      appointment_number: 3,
      appointment_date: daysFromNow(7, 10),
      themes_discussed: null,
      solutions_proposed: null,
      recap_sent: false,
      next_appointment_date: null,
    },
    {
      user_id: userId, client_id: marcId,
      appointment_number: 1,
      appointment_date: daysFromNow(3, 14),
      themes_discussed: null,
      solutions_proposed: null,
      recap_sent: false,
      next_appointment_date: null,
    },
    {
      user_id: userId, client_id: eliseId,
      appointment_number: 1,
      appointment_date: daysAgo(180, 16),
      themes_discussed: 'Bilan sophrologie — anxiété et troubles du sommeil',
      solutions_proposed: 'Cohérence cardiaque quotidienne + relaxation du soir',
      recap_sent: true,
      next_appointment_date: daysAgo(90, 16),
    },
    {
      user_id: userId, client_id: eliseId,
      appointment_number: 2,
      appointment_date: daysAgo(90, 16),
      themes_discussed: 'Amélioration du sommeil (5h → 7h) — gestion horaires décalés',
      solutions_proposed: 'Protocole lumière bleue + routine matinale 10 min',
      recap_sent: true,
      next_appointment_date: daysAgo(30, 16),
    },
    {
      user_id: userId, client_id: eliseId,
      appointment_number: 3,
      appointment_date: daysAgo(30, 16),
      themes_discussed: 'Bilan 6 mois — stress diminué de 70%',
      solutions_proposed: 'Méditation guidée 5 min/jour',
      recap_sent: true,
      next_appointment_date: daysFromNow(10, 16),
    },
    {
      user_id: userId, client_id: eliseId,
      appointment_number: 4,
      appointment_date: daysFromNow(10, 16),
      themes_discussed: null,
      solutions_proposed: null,
      recap_sent: false,
      next_appointment_date: null,
    },
    {
      user_id: userId, client_id: claireId,
      appointment_number: 1,
      appointment_date: daysAgo(30, 11),
      themes_discussed: 'Relaxation guidée — gestion du stress au travail',
      solutions_proposed: 'Respiration 4-7-8 + scan corporel 10 min/soir',
      recap_sent: true,
      next_appointment_date: daysFromNow(14, 11),
    },
    {
      user_id: userId, client_id: claireId,
      appointment_number: 2,
      appointment_date: daysFromNow(14, 11),
      themes_discussed: null,
      solutions_proposed: null,
      recap_sent: false,
      next_appointment_date: null,
    },
    {
      user_id: userId, client_id: julienId,
      appointment_number: 1,
      appointment_date: daysAgo(200, 9),
      themes_discussed: 'Bilan nutritionnel — objectif -8kg',
      solutions_proposed: 'Plan alimentaire personnalisé',
      recap_sent: true,
      next_appointment_date: daysAgo(140, 9),
    },
    {
      user_id: userId, client_id: julienId,
      appointment_number: 2,
      appointment_date: daysAgo(140, 9),
      themes_discussed: 'Suivi — 4kg perdus, difficulté à maintenir',
      solutions_proposed: 'Simplification du programme',
      recap_sent: true,
      next_appointment_date: null,
    },
  ])

  if (apptErr) throw apptErr

  // ── 3. Notes ──────────────────────────────────────────────────────────────
  const { error: notesErr } = await supabase.from('notes').insert([
    {
      user_id: userId, client_id: sophieId,
      content: 'Sensibilité au gluten confirmée. Test éviction 3 semaines : +40% énergie. À inclure dans toutes les recommandations.',
    },
    {
      user_id: userId, client_id: eliseId,
      content: 'Nette amélioration du sommeil après cohérence cardiaque. Très assidue. Partage avec ses collègues.',
    },
    {
      user_id: userId, client_id: julienId,
      content: 'Plus de nouvelles depuis le 2e RDV. À relancer par message bienveillant. Très motivé au départ.',
    },
  ])

  if (notesErr) throw notesErr

  // ── 4. Relances ───────────────────────────────────────────────────────────
  // Only 'title' field — 'content' column may not exist in current DB schema
  const { error: fuErr } = await supabase.from('followups').insert([
    {
      user_id: userId, client_id: marcId,
      title: 'Confirmer RDV Marc + envoyer questionnaire bilan',
      due_date: dateOffset(1),
      done: false,
    },
    {
      user_id: userId, client_id: julienId,
      title: 'Relancer Julien — absent depuis 4 mois',
      due_date: dateOffset(-10),
      done: false,
    },
    {
      user_id: userId, client_id: sophieId,
      title: 'Envoyer programme nutrition mis à jour',
      due_date: dateOffset(5),
      done: false,
    },
  ])

  if (fuErr) throw fuErr
}

export async function deleteDemoData(userId: string): Promise<void> {
  const { data: demoClients, error: fetchErr } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', userId)
    .eq('source', 'demo')

  if (fetchErr) throw fetchErr
  if (!demoClients?.length) return

  const ids = demoClients.map(c => c.id)

  // Delete children first — don't add extra column filters (rely on RLS + client_id)
  // Errors suppressed: if a child table has no rows or different schema, continue anyway
  await supabase.from('recommendations').delete().in('client_id', ids)
  await supabase.from('followups').delete().in('client_id', ids)
  await supabase.from('notes').delete().in('client_id', ids)
  await supabase.from('appointments').delete().in('client_id', ids)

  // Throw only on the final client delete — if children weren't cleaned, this will fail
  const { error: clientErr } = await supabase
    .from('clients')
    .delete()
    .in('id', ids)

  if (clientErr) throw clientErr
}
