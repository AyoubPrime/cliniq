'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Case = {
  id: string
  title: string
  specialty: string
  difficulty: number
  publish_date: string
  status: 'published' | 'draft'
  age: number
  age_unit: string
  sex: string
  setting: string
  chief_complaint: string
  context: string
  bp: string
  hr: number
  temp: number
  spo2: number
  clues: { id: number; text: string; auto_reveal: boolean }[]
  diagnosis_exact: string
  diagnosis_aliases: string[]
  diagnosis_category: string
  diagnosis_urgency: string
  wrong_answer_hint: string
  explanation: string
  pearl: string
  red_flags: string[]
  differentials: { diagnosis: string; proximity: string; distinction: string }[]
  management: string[]
  common_mistakes: string[]
}

type FormData = {
  id: string
  title: string
  specialty: string
  difficulty: number
  publish_date: string
  age: string
  age_unit: string
  sex: string
  setting: string
  chief_complaint: string
  context: string
  bp: string
  hr: string
  temp: string
  spo2: string
  clue1: string
  clue2: string
  clue3: string
  clue4: string
  clue5: string
  clue6: string
  diagnosis_exact: string
  alias1: string
  alias2: string
  alias3: string
  diagnosis_category: string
  diagnosis_urgency: string
  wrong_answer_hint: string
  explanation: string
  pearl: string
  red_flag1: string
  red_flag2: string
  red_flag3: string
  management1: string
  management2: string
  management3: string
  management4: string
  mistake1: string
  mistake2: string
  diff1_diagnosis: string
  diff1_proximity: string
  diff1_distinction: string
  diff2_diagnosis: string
  diff2_proximity: string
  diff2_distinction: string
  diff3_diagnosis: string
  diff3_proximity: string
  diff3_distinction: string
}

const emptyForm: FormData = {
  id: '',
  title: '',
  specialty: '',
  difficulty: 2,
  publish_date: '',
  age: '',
  age_unit: 'ans',
  sex: 'F',
  setting: 'Urgences',
  chief_complaint: '',
  context: '',
  bp: '',
  hr: '',
  temp: '',
  spo2: '',
  clue1: '',
  clue2: '',
  clue3: '',
  clue4: '',
  clue5: '',
  clue6: '',
  diagnosis_exact: '',
  alias1: '',
  alias2: '',
  alias3: '',
  diagnosis_category: '',
  diagnosis_urgency: '',
  wrong_answer_hint: '',
  explanation: '',
  pearl: '',
  red_flag1: '',
  red_flag2: '',
  red_flag3: '',
  management1: '',
  management2: '',
  management3: '',
  management4: '',
  mistake1: '',
  mistake2: '',
  diff1_diagnosis: '',
  diff1_proximity: 'proche',
  diff1_distinction: '',
  diff2_diagnosis: '',
  diff2_proximity: 'faux',
  diff2_distinction: '',
  diff3_diagnosis: '',
  diff3_proximity: 'proche',
  diff3_distinction: '',
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [tab, setTab] = useState<'create' | 'edit' | 'view'>('create')
  
  const [form, setForm] = useState<FormData>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [idExists, setIdExists] = useState(false)
  const [checkingId, setCheckingId] = useState(false)
  
  const [cases, setCases] = useState<Case[]>([])
  const [loadingCases, setLoadingCases] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const update = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const checkId = async (id: string) => {
    if (!id.trim()) {
      setIdExists(false)
      return
    }
    setCheckingId(true)
    const { data } = await supabase
      .from('cases')
      .select('id')
      .eq('id', id)
      .maybeSingle()
    setIdExists(!!data)
    setCheckingId(false)
  }

  const loadCases = async () => {
    setLoadingCases(true)
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .order('publish_date', { ascending: false })
    
    if (!error && data) {
      setCases(data)
    }
    setLoadingCases(false)
  }

  useEffect(() => {
    if (tab === 'edit' || tab === 'view') {
      loadCases()
    }
  }, [tab])

  const handleSubmit = async () => {
    if (!form.id.trim()) {
      setMessage('Erreur: l\'ID est requis')
      return
    }

    if (editingId && idExists && editingId !== form.id) {
      setMessage('Erreur: cet ID existe déjà, changez-le')
      return
    }

    if (!editingId && idExists) {
      setMessage('Erreur: cet ID existe déjà, changez-le')
      return
    }

    setLoading(true)
    setMessage('')

    const clues = [
      { id: 1, text: form.clue1, auto_reveal: true },
      { id: 2, text: form.clue2, auto_reveal: false },
      { id: 3, text: form.clue3, auto_reveal: false },
      { id: 4, text: form.clue4, auto_reveal: false },
      { id: 5, text: form.clue5, auto_reveal: false },
      { id: 6, text: form.clue6, auto_reveal: false },
    ].filter(c => c.text.trim() !== '')

    const aliases = [form.alias1, form.alias2, form.alias3]
      .filter(a => a.trim() !== '')

    const red_flags = [form.red_flag1, form.red_flag2, form.red_flag3]
      .filter(r => r.trim() !== '')

    const management = [form.management1, form.management2, form.management3, form.management4]
      .filter(m => m.trim() !== '')

    const common_mistakes = [form.mistake1, form.mistake2]
      .filter(m => m.trim() !== '')

    const differentials = [
      { diagnosis: form.diff1_diagnosis, proximity: form.diff1_proximity, distinction: form.diff1_distinction },
      { diagnosis: form.diff2_diagnosis, proximity: form.diff2_proximity, distinction: form.diff2_distinction },
      { diagnosis: form.diff3_diagnosis, proximity: form.diff3_proximity, distinction: form.diff3_distinction },
    ].filter(d => d.diagnosis.trim() !== '')

    const caseData = {
      id: form.id,
      title: form.title,
      specialty: form.specialty,
      difficulty: form.difficulty,
      publish_date: form.publish_date,
      status: 'published' as const,
      reviewed: true,
      age: parseInt(form.age),
      age_unit: form.age_unit,
      sex: form.sex,
      setting: form.setting,
      chief_complaint: form.chief_complaint,
      context: form.context,
      bp: form.bp,
      hr: parseInt(form.hr),
      temp: parseFloat(form.temp),
      spo2: parseInt(form.spo2),
      clues,
      diagnosis_exact: form.diagnosis_exact,
      diagnosis_aliases: aliases,
      diagnosis_category: form.diagnosis_category,
      diagnosis_urgency: form.diagnosis_urgency,
      wrong_answer_hint: form.wrong_answer_hint,
      explanation: form.explanation,
      pearl: form.pearl,
      red_flags,
      management,
      common_mistakes,
      differentials,
      schema: { nodes: [], edges: [] },
    }

    if (editingId) {
      // Update existing case
      const { error } = await supabase
        .from('cases')
        .update(caseData)
        .eq('id', editingId)

      if (error) {
        setMessage('Erreur: ' + error.message)
      } else {
        setMessage('Cas mis à jour avec succès!')
        setEditingId(null)
        setForm(emptyForm)
        loadCases()
      }
    } else {
      // Create new case
      const { error } = await supabase
        .from('cases')
        .insert(caseData)

      if (error) {
        setMessage('Erreur: ' + error.message)
      } else {
        setMessage('Cas publié avec succès!')
        setForm(emptyForm)
        loadCases()
      }
    }

    setLoading(false)
  }

  const handleDelete = async (caseId: string) => {
  if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce cas ?')) return

  setDeletingId(caseId)
  const { error } = await supabase
    .from('cases')
    .delete()
    .eq('id', caseId)

  if (error) {
    console.error('Delete error:', error)
    setMessage('Erreur: ' + error.message)
  } else {
    setMessage('Cas supprimé!')
    await loadCases()
  }
  setDeletingId(null)
}

  const handleEditClick = (cas: Case) => {
    setEditingId(cas.id)
    setForm({
      id: cas.id,
      title: cas.title,
      specialty: cas.specialty,
      difficulty: cas.difficulty,
      publish_date: cas.publish_date,
      age: cas.age.toString(),
      age_unit: cas.age_unit,
      sex: cas.sex,
      setting: cas.setting,
      chief_complaint: cas.chief_complaint,
      context: cas.context,
      bp: cas.bp,
      hr: cas.hr.toString(),
      temp: cas.temp.toString(),
      spo2: cas.spo2.toString(),
      clue1: cas.clues[0]?.text || '',
      clue2: cas.clues[1]?.text || '',
      clue3: cas.clues[2]?.text || '',
      clue4: cas.clues[3]?.text || '',
      clue5: cas.clues[4]?.text || '',
      clue6: cas.clues[5]?.text || '',
      diagnosis_exact: cas.diagnosis_exact,
      alias1: cas.diagnosis_aliases[0] || '',
      alias2: cas.diagnosis_aliases[1] || '',
      alias3: cas.diagnosis_aliases[2] || '',
      diagnosis_category: cas.diagnosis_category,
      diagnosis_urgency: cas.diagnosis_urgency,
      wrong_answer_hint: cas.wrong_answer_hint,
      explanation: cas.explanation,
      pearl: cas.pearl,
      red_flag1: cas.red_flags[0] || '',
      red_flag2: cas.red_flags[1] || '',
      red_flag3: cas.red_flags[2] || '',
      management1: cas.management[0] || '',
      management2: cas.management[1] || '',
      management3: cas.management[2] || '',
      management4: cas.management[3] || '',
      mistake1: cas.common_mistakes[0] || '',
      mistake2: cas.common_mistakes[1] || '',
      diff1_diagnosis: cas.differentials[0]?.diagnosis || '',
      diff1_proximity: cas.differentials[0]?.proximity || 'proche',
      diff1_distinction: cas.differentials[0]?.distinction || '',
      diff2_diagnosis: cas.differentials[1]?.diagnosis || '',
      diff2_proximity: cas.differentials[1]?.proximity || 'faux',
      diff2_distinction: cas.differentials[1]?.distinction || '',
      diff3_diagnosis: cas.differentials[2]?.diagnosis || '',
      diff3_proximity: cas.differentials[2]?.proximity || 'proche',
      diff3_distinction: cas.differentials[2]?.distinction || '',
    })
    setTab('create')
  }

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-300 bg-white"
  const labelClass = "block text-xs text-gray-400 mb-1"
  const sectionClass = "bg-white rounded-2xl border border-gray-100 p-5 mb-4"
  const sectionTitle = "text-sm font-medium text-gray-900 mb-4"
  const tabClass = (active: boolean) => `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 w-full max-w-sm">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">ClinIQ Admin</h1>
          <p className="text-sm text-gray-400 mb-6">Accès réservé</p>
          <input
            type="password"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-300 mb-3"
            placeholder="Mot de passe..."
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setAuthenticated(password === 'cliniq2026')}
          />
          <button
            onClick={() => setAuthenticated(password === 'cliniq2026')}
            className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium"
          >
            Entrer
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">ClinIQ Admin</h1>
          <p className="text-sm text-gray-400">Gérer les cas</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('create')} className={tabClass(tab === 'create')}>
            + Créer un cas
          </button>
          <button onClick={() => setTab('edit')} className={tabClass(tab === 'edit')}>
            ✎ Modifier
          </button>
          <button onClick={() => setTab('view')} className={tabClass(tab === 'view')}>
            👁 Tous les cas
          </button>
        </div>

        {/* CREATE TAB */}
        {tab === 'create' && (
          <div>
            {editingId && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex justify-between items-center">
                <p className="text-sm text-blue-700">Modification du cas: <strong>{editingId}</strong></p>
                <button
                  onClick={() => {
                    setEditingId(null)
                    setForm(emptyForm)
                  }}
                  className="text-sm text-blue-600 underline"
                >
                  Annuler
                </button>
              </div>
            )}

            <div className={sectionClass}>
              <p className={sectionTitle}>Identité du cas</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={labelClass}>ID unique</label>
                  <input
                    className={`${inputClass} ${idExists && !editingId ? 'border-red-300' : ''}`}
                    placeholder="ex: pneumo-001"
                    value={form.id}
                    onChange={e => {
                      update('id', e.target.value)
                      if (!editingId) checkId(e.target.value)
                    }}
                  />
                  {checkingId && <p className="text-xs text-gray-300 mt-1">Vérification...</p>}
                  {idExists && !editingId && <p className="text-xs text-red-500 mt-1">Cet ID existe déjà</p>}
                </div>
                <div>
                  <label className={labelClass}>Date de publication</label>
                  <input className={inputClass} type="date" value={form.publish_date} onChange={e => update('publish_date', e.target.value)} />
                </div>
              </div>
              <div className="mb-3">
                <label className={labelClass}>Titre interne</label>
                <input className={inputClass} placeholder="ex: Pneumothorax spontané" value={form.title} onChange={e => update('title', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Spécialité</label>
                  <select className={inputClass} value={form.specialty} onChange={e => update('specialty', e.target.value)}>
                    <option value="">Choisir...</option>
                    <option>Cardiologie</option>
                    <option>Neurologie</option>
                    <option>Pneumologie</option>
                    <option>Gastroentérologie</option>
                    <option>Psychiatrie</option>
                    <option>Infectiologie</option>
                    <option>Néphrologie</option>
                    <option>Endocrinologie</option>
                    <option>Rhumatologie</option>
                    <option>Hématologie</option>
                    <option>Urgences</option>
                    <option>Réanimation</option>
                    <option>Chirurgie</option>
                    <option>Pédiatrie</option>
                    <option>Gynécologie</option>
                    <option>Dermatologie</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Difficulté</label>
                  <select className={inputClass} value={form.difficulty} onChange={e => update('difficulty', parseInt(e.target.value))}>
                    <option value={1}>1 — Facile</option>
                    <option value={2}>2 — Moyen</option>
                    <option value={3}>3 — Difficile</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={sectionClass}>
              <p className={sectionTitle}>Patient</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="col-span-2">
                  <label className={labelClass}>Âge</label>
                  <div className="flex gap-2">
                    <input className={inputClass} type="number" placeholder="34" value={form.age} onChange={e => update('age', e.target.value)} />
                    <select className={inputClass} value={form.age_unit} onChange={e => update('age_unit', e.target.value)} style={{ maxWidth: '110px' }}>
                      <option value="ans">ans</option>
                      <option value="mois">mois</option>
                      <option value="jours">jours</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Sexe</label>
                  <select className={inputClass} value={form.sex} onChange={e => update('sex', e.target.value)}>
                    <option value="F">Femme</option>
                    <option value="M">Homme</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Cadre</label>
                  <select className={inputClass} value={form.setting} onChange={e => update('setting', e.target.value)}>
                    <option>Urgences</option>
                    <option>Cabinet</option>
                    <option>Hospitalisation</option>
                    <option>Réanimation</option>
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label className={labelClass}>Motif de consultation</label>
                <textarea className={inputClass} rows={2} placeholder="Douleur thoracique brutale..." value={form.chief_complaint} onChange={e => update('chief_complaint', e.target.value)} />
              </div>
              <div className="mb-3">
                <label className={labelClass}>Contexte et antécédents</label>
                <textarea className={inputClass} rows={2} placeholder="Apparition il y a 2 heures..." value={form.context} onChange={e => update('context', e.target.value)} />
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className={labelClass}>TA</label>
                  <input className={inputClass} placeholder="120/80" value={form.bp} onChange={e => update('bp', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>FC</label>
                  <input className={inputClass} type="number" placeholder="80" value={form.hr} onChange={e => update('hr', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Temp °C</label>
                  <input className={inputClass} type="number" placeholder="37.5" value={form.temp} onChange={e => update('temp', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>SpO2 %</label>
                  <input className={inputClass} type="number" placeholder="98" value={form.spo2} onChange={e => update('spo2', e.target.value)} />
                </div>
              </div>
            </div>

            <div className={sectionClass}>
              <p className={sectionTitle}>Indices</p>
              <p className="text-xs text-gray-400 mb-3">L'indice 1 est révélé automatiquement. Les autres se débloquent après chaque tentative.</p>
              {[1,2,3,4,5,6].map(n => (
                <div key={n} className="mb-2">
                  <label className={labelClass}>Indice {n} {n === 1 ? '(auto-révélé)' : ''}</label>
                  <input className={inputClass} placeholder={`Indice ${n}...`} value={form[`clue${n}` as keyof typeof form] as string} onChange={e => update(`clue${n}`, e.target.value)} />
                </div>
              ))}
            </div>

            <div className={sectionClass}>
              <p className={sectionTitle}>Diagnostic</p>
              <div className="mb-3">
                <label className={labelClass}>Diagnostic exact</label>
                <input className={inputClass} placeholder="Hémorragie sous-arachnoïdienne" value={form.diagnosis_exact} onChange={e => update('diagnosis_exact', e.target.value)} />
              </div>
              <div className="mb-3">
                <label className={labelClass}>Alias acceptés</label>
                <div className="grid grid-cols-3 gap-2">
                  <input className={inputClass} placeholder="HSA" value={form.alias1} onChange={e => update('alias1', e.target.value)} />
                  <input className={inputClass} placeholder="Alias 2" value={form.alias2} onChange={e => update('alias2', e.target.value)} />
                  <input className={inputClass} placeholder="Alias 3" value={form.alias3} onChange={e => update('alias3', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={labelClass}>Catégorie</label>
                  <select className={inputClass} value={form.diagnosis_category} onChange={e => update('diagnosis_category', e.target.value)}>
                    <option value="">Choisir...</option>
                    <option>Cardiologie</option>
                    <option>Neurologie</option>
                    <option>Pneumologie</option>
                    <option>Gastroentérologie</option>
                    <option>Psychiatrie</option>
                    <option>Infectiologie</option>
                    <option>Néphrologie</option>
                    <option>Endocrinologie</option>
                    <option>Gynécologie</option>
                    <option>Rhumatologie</option>
                    <option>Orthopédie - Traumatologie</option>
                    <option>Hématologie</option>
                    <option>Urgences</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Niveau d'urgence</label>
                  <select className={inputClass} value={form.diagnosis_urgency} onChange={e => update('diagnosis_urgency', e.target.value)}>
                    <option value="">Choisir...</option>
                    <option>Urgence vitale</option>
                    <option>Urgence différée</option>
                    <option>Semi-urgent</option>
                    <option>Non urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Conseil après mauvaise réponse</label>
                <input className={inputClass} placeholder="Pensez à l'installation temporelle..." value={form.wrong_answer_hint} onChange={e => update('wrong_answer_hint', e.target.value)} />
              </div>
            </div>

            <div className={sectionClass}>
              <p className={sectionTitle}>Résumé éducatif</p>
              <div className="mb-3">
                <label className={labelClass}>Explication</label>
                <textarea className={inputClass} rows={3} value={form.explanation} onChange={e => update('explanation', e.target.value)} />
              </div>
              <div className="mb-3">
                <label className={labelClass}>Perle clinique</label>
                <textarea className={inputClass} rows={2} value={form.pearl} onChange={e => update('pearl', e.target.value)} />
              </div>
              <div className="mb-3">
                <label className={labelClass}>Signes d'alarme</label>
                {[1,2,3].map(n => (
                  <input key={n} className={inputClass + ' mb-2'} placeholder={`Signe d'alarme ${n}...`} value={form[`red_flag${n}` as keyof typeof form] as string} onChange={e => update(`red_flag${n}`, e.target.value)} />
                ))}
              </div>
              <div className="mb-3">
                <label className={labelClass}>Prise en charge initiale</label>
                {[1,2,3,4].map(n => (
                  <input key={n} className={inputClass + ' mb-2'} placeholder={`Étape ${n}...`} value={form[`management${n}` as keyof typeof form] as string} onChange={e => update(`management${n}`, e.target.value)} />
                ))}
              </div>
              <div className="mb-3">
                <label className={labelClass}>Erreurs classiques</label>
                {[1,2].map(n => (
                  <input key={n} className={inputClass + ' mb-2'} placeholder={`Erreur ${n}...`} value={form[`mistake${n}` as keyof typeof form] as string} onChange={e => update(`mistake${n}`, e.target.value)} />
                ))}
              </div>
              <div>
                <label className={labelClass}>Diagnostics différentiels</label>
                {[1,2,3].map(n => (
                  <div key={n} className="mb-3 p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-400 mb-2">Différentiel {n}</p>
                    <input className={inputClass + ' mb-2'} placeholder="Diagnostic..." value={form[`diff${n}_diagnosis` as keyof typeof form] as string} onChange={e => update(`diff${n}_diagnosis`, e.target.value)} />
                    <select className={inputClass + ' mb-2'} value={form[`diff${n}_proximity` as keyof typeof form] as string} onChange={e => update(`diff${n}_proximity`, e.target.value)}>
                      <option value="proche">Proche</option>
                      <option value="faux">Faux</option>
                    </select>
                    <input className={inputClass} placeholder="Pourquoi écarté..." value={form[`diff${n}_distinction` as keyof typeof form] as string} onChange={e => update(`diff${n}_distinction`, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-xl mb-4 text-sm font-medium ${message.includes('Erreur') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {message}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3.5 rounded-xl text-sm font-medium disabled:opacity-50 mb-8"
            >
              {loading ? 'En cours...' : editingId ? 'Mettre à jour le cas' : 'Publier le cas'}
            </button>
          </div>
        )}

        {/* EDIT TAB */}
        {tab === 'edit' && (
          <div>
            {loadingCases ? (
              <p className="text-center text-gray-400">Chargement...</p>
            ) : cases.length === 0 ? (
              <p className="text-center text-gray-400">Aucun cas trouvé</p>
            ) : (
              <div className="space-y-2">
                {cases.map(cas => (
                  <div key={cas.id} className="bg-white rounded-xl border border-gray-200 p-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{cas.title}</p>
                      <p className="text-xs text-gray-400">{cas.specialty} • {cas.publish_date}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(cas)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(cas.id)}
                        disabled={deletingId === cas.id}
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 disabled:opacity-50"
                      >
                        {deletingId === cas.id ? 'Suppression...' : 'Supprimer'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW TAB */}
        {tab === 'view' && (
          <div>
            {loadingCases ? (
              <p className="text-center text-gray-400">Chargement...</p>
            ) : cases.length === 0 ? (
              <p className="text-center text-gray-400">Aucun cas trouvé</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-4">Total: <strong>{cases.length}</strong> cas publiés</p>
                {cases.map(cas => (
                  <div key={cas.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{cas.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{cas.specialty}</p>
                        <p className="text-xs text-gray-500 mt-2">{cas.chief_complaint}</p>
                      </div>
                      <div className="ml-4 text-right">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          cas.difficulty === 1 ? 'bg-green-50 text-green-700' :
                          cas.difficulty === 2 ? 'bg-yellow-50 text-yellow-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {cas.difficulty === 1 ? 'Facile' : cas.difficulty === 2 ? 'Moyen' : 'Difficile'}
                        </span>
                        <p className="text-xs text-gray-300 mt-2">{cas.publish_date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}