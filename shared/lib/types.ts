export type ClientStatus = 'prospect' | 'active' | 'inactive' | 'vip' | 'advisor'
export type RecommendationStatus = 'advised' | 'purchased'
export type CatalogType = 'official' | 'custom'

export interface Catalog {
  id: string
  slug: string | null
  name: string
  brand: string | null
  type: CatalogType
  user_id: string | null
  color: string
  icon: string
  created_at: string
}

export interface CatalogProduct {
  id: string
  catalog_id: string
  sku: string | null
  name: string
  category: string | null
  created_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  locale: string | null
  timezone: string | null
  plan: string | null
  created_at: string
  updated_at: string | null
}

export interface Client {
  id: string
  user_id: string
  full_name: string
  first_name: string | null
  email: string | null
  phone: string | null
  status: ClientStatus
  source: string | null
  language: string | null
  birth_date: string | null
  inscription_date: string | null
  profession: string | null
  children: string | null
  interests: string[]
  client_type: string | null
  medical_treatment: boolean
  medical_notes: string | null
  particularities: string | null
  welcome_email_sent: boolean
  doterra_id: string | null
  next_lrp_date: string | null
  created_at: string
  updated_at: string | null
}

export interface Note {
  id: string
  client_id: string
  user_id: string
  content: string
  created_at: string
}

export interface Followup {
  id: string
  client_id: string
  user_id: string
  title: string | null
  content: string | null
  due_date: string
  done: boolean
  created_at: string
  updated_at: string | null
}

export interface Appointment {
  id: string
  client_id: string
  user_id: string
  appointment_number: number
  appointment_date: string
  themes_discussed: string | null
  solutions_proposed: string | null
  recap_sent: boolean
  next_appointment_date: string | null
  created_at: string
  updated_at: string | null
}

export interface Recommendation {
  id: string
  client_id: string
  user_id: string
  product_name: string
  reason: string | null
  status: RecommendationStatus
  catalog_id: string | null
  product_id: string | null
  catalog?: Pick<Catalog, 'name' | 'color' | 'icon'>
  created_at: string
  updated_at: string | null
}

// Joined types
export interface AppointmentWithClient extends Appointment {
  client: Pick<Client, 'id' | 'full_name' | 'status'>
}

export interface FollowupWithClient extends Followup {
  client: Pick<Client, 'id' | 'full_name'>
}
