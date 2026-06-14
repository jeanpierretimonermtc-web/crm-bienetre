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

export async function getDemoClientsCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('source', 'demo')
  return count ?? 0
}

export async function loadDemoData(userId: string): Promise<void> {
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
        medical_notes: null,
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
        medical_notes: null,
        language: 'fr',
        welcome_email_sent: false,
      },
      {
        user_id: userId,
        first_name: 'Élise',
        full_name: 'Élise Bernard',
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
        medical_notes: 'Escitalopram 10mg (légère anxiété) — prescrit par médecin traitant',
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
        particularities: null,
        medical_treatment: false,
        medical_notes: null,
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
        medical_notes: null,
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
        particularities: null,
        medical_treatment: false,
        medical_notes: null,
        doterra_id: 'DT-293847',
        next_lrp_date: dateOffset(5),
        language: 'fr',
        welcome_email_sent: true,
      },
    ])
    .select('id, full_name')

  if (clientsErr || !insertedClients) throw clientsErr ?? new Error('clients insert failed')

  const byName = Object.fromEntries(insertedClients.map(c => [c.full_name, c.id]))
  const sophieId  = byName['Sophie Durand']
  const marcId    = byName['Marc Lambert']
  const eliseId   = byName['Élise Bernard']
  const claireId  = byName['Claire Lefebvre']
  const julienId  = byName['Julien Petit']

  // ── 2. Appointments ───────────────────────────────────────────────────────
  const { error: apptErr } = await supabase.from('appointments').insert([
    // Sophie — 2 passés, 1 à venir
    {
      user_id: userId, client_id: sophieId,
      appointment_number: 1,
      appointment_date: daysAgo(90, 10),
      themes_discussed: 'Bilan initial naturopathie\nHabitudes alimentaires et mode de vie',
      solutions_proposed: 'Programme nutrition anti-inflammatoire 4 semaines',
      recap_sent: true,
      next_appointment_date: daysAgo(60, 10),
    },
    {
      user_id: userId, client_id: sophieId,
      appointment_number: 2,
      appointment_date: daysAgo(45, 10),
      themes_discussed: 'Suivi programme nutrition\nAmélioration de l\'énergie constatée',
      solutions_proposed: 'Ajout compléments magnésium + vitamine D',
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
    // Marc — 1 à venir (première consultation)
    {
      user_id: userId, client_id: marcId,
      appointment_number: 1,
      appointment_date: daysFromNow(3, 14),
      themes_discussed: null,
      solutions_proposed: null,
      recap_sent: false,
      next_appointment_date: null,
    },
    // Élise — 3 passés, 1 à venir
    {
      user_id: userId, client_id: eliseId,
      appointment_number: 1,
      appointment_date: daysAgo(180, 16),
      themes_discussed: 'Bilan sophrologie\nAnxiété professionnelle et troubles du sommeil',
      solutions_proposed: 'Exercices de cohérence cardiaque quotidiens + relaxation du soir',
      recap_sent: true,
      next_appointment_date: daysAgo(120, 16),
    },
    {
      user_id: userId, client_id: eliseId,
      appointment_number: 2,
      appointment_date: daysAgo(90, 16),
      themes_discussed: 'Amélioration du sommeil (de 5h à 7h par nuit)\nGestion des horaires décalés',
      solutions_proposed: 'Protocole lumière bleue + routine matinale 10 min',
      recap_sent: true,
      next_appointment_date: daysAgo(30, 16),
    },
    {
      user_id: userId, client_id: eliseId,
      appointment_number: 3,
      appointment_date: daysAgo(30, 16),
      themes_discussed: 'Bilan 6 mois\nTrès bonne progression — stress diminué de 70%',
      solutions_proposed: 'Continuation + ajout méditation guidée 5 min/jour',
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
    // Claire — 1 passé
    {
      user_id: userId, client_id: claireId,
      appointment_number: 1,
      appointment_date: daysAgo(30, 11),
      themes_discussed: 'Introduction relaxation guidée\nGestion du stress au travail',
      solutions_proposed: 'Exercice de respiration 4-7-8 + scan corporel 10 min/soir',
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
    // Julien — 2 passés (inactif)
    {
      user_id: userId, client_id: julienId,
      appointment_number: 1,
      appointment_date: daysAgo(200, 9),
      themes_discussed: 'Bilan nutritionnel\nObjectif perte de poids 8kg',
      solutions_proposed: 'Plan alimentaire personnalisé + hydratation',
      recap_sent: true,
      next_appointment_date: daysAgo(140, 9),
    },
    {
      user_id: userId, client_id: julienId,
      appointment_number: 2,
      appointment_date: daysAgo(140, 9),
      themes_discussed: 'Suivi — 4kg perdus en 60 jours\nDifficulté à maintenir la régularité',
      solutions_proposed: 'Simplification du programme, repas types',
      recap_sent: true,
      next_appointment_date: null,
    },
  ])

  if (apptErr) throw apptErr

  // ── 3. Notes ──────────────────────────────────────────────────────────────
  const { error: notesErr } = await supabase.from('notes').insert([
    {
      user_id: userId, client_id: sophieId,
      content: 'Sensibilité au gluten confirmée lors de la consultation. A fait un test d\'éviction 3 semaines avec résultats très positifs (+40% énergie). À inclure dans toutes les recommandations alimentaires.',
      created_at: daysAgo(80),
    },
    {
      user_id: userId, client_id: eliseId,
      content: 'Grande amélioration du sommeil après 4 semaines de cohérence cardiaque. Continue les exercices 2× par jour. Très motivée et assidue. Partage son expérience avec ses collègues infirmières.',
      created_at: daysAgo(85),
    },
    {
      user_id: userId, client_id: eliseId,
      content: 'Médecin traitant informé du suivi sophrologie. Échange positif — médecin favorable à l\'approche complémentaire. Dosage escitalopram stable.',
      created_at: daysAgo(25),
    },
    {
      user_id: userId, client_id: julienId,
      content: 'Plus de nouvelles depuis le 2ème RDV. A décroché mes appels. À relancer par message écrit en restant bienveillant. Il était très motivé au départ — peut-être découragé par le plafond atteint à mi-parcours.',
      created_at: daysAgo(120),
    },
  ])

  if (notesErr) throw notesErr

  // ── 4. Relances ───────────────────────────────────────────────────────────
  const { error: fuErr } = await supabase.from('followups').insert([
    {
      user_id: userId, client_id: marcId,
      title: 'Confirmer la 1ère consultation',
      content: 'Rappeler Marc pour confirmer son RDV du ' + new Date(daysFromNow(3)).toLocaleDateString('fr-FR') + '. Lui envoyer le questionnaire bilan initial.',
      due_date: dateOffset(1),
      done: false,
    },
    {
      user_id: userId, client_id: julienId,
      title: 'Relancer Julien — reprendre le suivi',
      content: 'Julien n\'a plus donné signe de vie depuis 4 mois. Envoyer un message bienveillant pour prendre des nouvelles et proposer une séance bilan gratuite de 20 min.',
      due_date: dateOffset(-10),
      done: false,
    },
    {
      user_id: userId, client_id: sophieId,
      title: 'Envoyer le programme nutrition mis à jour',
      content: 'Sophie a demandé une version actualisée de son plan alimentaire avec les ajustements de la dernière séance. Inclure les recettes anti-inflammatoires.',
      due_date: dateOffset(5),
      done: false,
    },
  ])

  if (fuErr) throw fuErr
}

export async function deleteDemoData(userId: string): Promise<void> {
  // Get all demo client IDs for this user
  const { data: demoClients } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', userId)
    .eq('source', 'demo')

  if (!demoClients?.length) return

  const ids = demoClients.map(c => c.id)

  // Delete child records first (no CASCADE assumed)
  await supabase.from('recommendations').delete().in('client_id', ids)
  await supabase.from('followups').delete().in('client_id', ids)
  await supabase.from('notes').delete().in('client_id', ids)
  await supabase.from('appointments').delete().in('client_id', ids)
  await supabase.from('clients').delete().in('id', ids)
}
