'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type CaseRow = {
  id: string
  title: string
  specialty: string
  difficulty: number
  publish_date: string
  status: string
}

const emptyForm = {
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
  approach1_title: '',
  approach1_detail: '',
  approach2_title: '',
  approach2_detail: '',
  approach3_title: '',
  approach3_detail: '',
  approach4_title: '',
  approach4_detail: '',
  approach5_title: '',
  approach5_detail: '',
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [tab, setTab] = useState<'create' | 'edit' | 'view'>('create')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [cases, setCases] = useState<CaseRow[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [idExists, setIdExists] = useState(false)
  const [checkingId, setCheckingId] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const update = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const checkId = async (id: string) => {
    if (!id.trim()) { setIdExists(false); return }
    setCheckingId(true)
    const { data } = await supabase.from('cases').select('id').eq('id', id).maybeSingle()
    setIdExists(!!data)
    setCheckingId(false)
  }

  const loadCases = async () => {
    const { data } = await supabase
      .from('cases')
      .select('id, title, specialty, difficulty, publish_date, status')
      .order('publish_date', { ascending: false })
    if (data) setCases(data)
  }

  const loadCase = async (id: string) => {
    const { data } = await supabase.from('cases').select('*').eq('id', id).single()
    if (!data) return

    const getClue = (n: number) => data.clues?.[n - 1]?.text || ''
    const getAlias = (n: number) => data.diagnosis_aliases?.[n - 1] || ''
    const getFlag = (n: number) => data.red_flags?.[n - 1] || ''
    const getMgmt = (n: number) => data.management?.[n - 1] || ''
    const getMistake = (n: number) => data.common_mistakes?.[n - 1] || ''
    const getDiff = (n: number, field: string) => data.differentials?.[n - 1]?.[field] || (field === 'proximity' ? 'proche' : '')
    const getApproach = (n: number, field: string) => data.diagnostic_approach?.[n - 1]?.[field] || ''

    setForm({
      id: data.id,
      title: data.title || '',
      specialty: data.specialty || '',
      difficulty: data.difficulty || 2,
      publish_date: data.publish_date || '',
      age: data.age?.toString() || '',
      age_unit: data.age_unit || 'ans',
      sex: data.sex || 'F',
      setting: data.setting || 'Urgences',
      chief_complaint: data.chief_complaint || '',
      context: data.context || '',
      bp: data.bp || '',
      hr: data.hr?.toString() || '',
      temp: data.temp?.toString() || '',
      spo2: data.spo2?.toString() || '',
      clue1: getClue(1), clue2: getClue(2), clue3: getClue(3),
      clue4: getClue(4), clue5: getClue(5), clue6: getClue(6),
      diagnosis_exact: data.diagnosis_exact || '',
      alias1: getAlias(1), alias2: getAlias(2), alias3: getAlias(3),
      diagnosis_category: data.diagnosis_category || '',
      diagnosis_urgency: data.diagnosis_urgency || '',
      wrong_answer_hint: data.wrong_answer_hint || '',
      explanation: data.explanation || '',
      pearl: data.pearl || '',
      red_flag1: getFlag(1), red_flag2: getFlag(2), red_flag3: getFlag(3),
      management1: getMgmt(1), management2: getMgmt(2),
      management3: getMgmt(3), management4: getMgmt(4),
      mistake1: getMistake(1), mistake2: getMistake(2),
      diff1_diagnosis: getDiff(1, 'diagnosis'),
      diff1_proximity: getDiff(1, 'proximity') || 'proche',
      diff1_distinction: getDiff(1, 'distinction'),
      diff2_diagnosis: getDiff(2, 'diagnosis'),
      diff2_proximity: getDiff(2, 'proximity') || 'faux',
      diff2_distinction: getDiff(2, 'distinction'),
      diff3_diagnosis: getDiff(3, 'diagnosis'),
      diff3_proximity: getDiff(3, 'proximity') || 'proche',
      diff3_distinction: getDiff(3, 'distinction'),
      approach1_title: getApproach(1, 'title'),
      approach1_detail: getApproach(1, 'detail'),
      approach2_title: getApproach(2, 'title'),
      approach2_detail: getApproach(2, 'detail'),
      approach3_title: getApproach(3, 'title'),
      approach3_detail: getApproach(3, 'detail'),
      approach4_title: getApproach(4, 'title'),
      approach4_detail: getApproach(4, 'detail'),
      approach5_title: getApproach(5, 'title'),
      approach5_detail: getApproach(5, 'detail'),
    })
    setEditingId(id)
    setConfirmDelete(false)
  }

  useEffect(() => {
    if (authenticated && (tab === 'edit' || tab === 'view')) {
      loadCases()
    }
  }, [authenticated, tab])

  const buildPayload = () => {
    const clues = [
      { id: 1, text: form.clue1, auto_reveal: true },
      { id: 2, text: form.clue2, auto_reveal: false },
      { id: 3, text: form.clue3, auto_reveal: false },
      { id: 4, text: form.clue4, auto_reveal: false },
      { id: 5, text: form.clue5, auto_reveal: false },
      { id: 6, text: form.clue6, auto_reveal: false },
    ].filter(c => c.text.trim() !== '')

    return {
      title: form.title,
      specialty: form.specialty,
      difficulty: form.difficulty,
      publish_date: form.publish_date,
      status: 'published',
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
      diagnosis_aliases: [form.alias1, form.alias2, form.alias3].filter(a => a.trim() !== ''),
      diagnosis_category: form.diagnosis_category,
      diagnosis_urgency: form.diagnosis_urgency,
      wrong_answer_hint: form.wrong_answer_hint,
      explanation: form.explanation,
      pearl: form.pearl,
      red_flags: [form.red_flag1, form.red_flag2, form.red_flag3].filter(r => r.trim() !== ''),
      management: [form.management1, form.management2, form.management3, form.management4].filter(m => m.trim() !== ''),
      common_mistakes: [form.mistake1, form.mistake2].filter(m => m.trim() !== ''),
      differentials: [
        { diagnosis: form.diff1_diagnosis, proximity: form.diff1_proximity, distinction: form.diff1_distinction },
        { diagnosis: form.diff2_diagnosis, proximity: form.diff2_proximity, distinction: form.diff2_distinction },
        { diagnosis: form.diff3_diagnosis, proximity: form.diff3_proximity, distinction: form.diff3_distinction },
      ].filter(d => d.diagnosis.trim() !== ''),
      diagnostic_approach: [1,2,3,4,5]
        .map(n => ({
          step: n,
          title: form[`approach${n}_title` as keyof typeof form] as string,
          detail: form[`approach${n}_detail` as keyof typeof form] as string,
        }))
        .filter(a => a.title.trim() !== ''),
    }
  }

  const handleCreate = async () => {
    if (idExists) { setMessage('Erreur: cet ID existe déjà'); return }
    setLoading(true)
    setMessage('')
    const { error } = await supabase.from('cases').insert({ id: form.id, ...buildPayload() })
    if (error) { setMessage('Erreur: ' + error.message) }
    else { setMessage('Cas publié avec succès!'); setForm(emptyForm); setIdExists(false) }
    setLoading(false)
  }

  const handleUpdate = async () => {
    if (!editingId) return
    setLoading(true)
    setMessage('')
    const { error } = await supabase.from('cases').update(buildPayload()).eq('id', editingId)
    if (error) { setMessage('Erreur: ' + error.message) }
    else { setMessage('Cas mis à jour avec succès!'); loadCases() }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!editingId) return
    setLoading(true)
    const { error } = await supabase.from('cases').delete().eq('id', editingId)
    if (error) { setMessage('Erreur: ' + error.message) }
    else {
      setMessage('Cas supprimé.')
      setEditingId(null)
      setForm(emptyForm)
      setConfirmDelete(false)
      loadCases()
    }
    setLoading(false)
  }

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-300 bg-white"
  const labelClass = "block text-xs text-gray-400 mb-1"
  const sectionClass = "bg-white rounded-2xl border border-gray-100 p-5 mb-4"
  const sectionTitle = "text-sm font-medium text-gray-900 mb-4"

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 w-full max-w-sm">
          <div className="mb-6">
            <span className="text-xl font-semibold text-gray-900">Clin</span>
            <span className="text-xl font-semibold text-blue-600">IQ</span>
            <p className="text-sm text-gray-400 mt-1">Accès réservé</p>
          </div>
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

  const CaseForm = ({ isEdit }: { isEdit: boolean }) => (
    <div>
      <div className={sectionClass}>
        <p className={sectionTitle}>Identité du cas</p>
        {!isEdit && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={labelClass}>ID unique</label>
              <input
                className={`${inputClass} ${idExists ? 'border-red-300' : ''}`}
                placeholder="ex: pneumo-001"
                value={form.id}
                onChange={e => { update('id', e.target.value); checkId(e.target.value) }}
              />
              {checkingId && <p className="text-xs text-gray-300 mt-1">Vérification...</p>}
              {idExists && <p className="text-xs text-red-500 mt-1">ID déjà utilisé</p>}
            </div>
            <div>
              <label className={labelClass}>Date de publication</label>
              <input className={inputClass} type="date" value={form.publish_date} onChange={e => update('publish_date', e.target.value)} />
            </div>
          </div>
        )}
        {isEdit && (
          <div className="mb-3">
            <label className={labelClass}>Date de publication</label>
            <input className={inputClass} type="date" value={form.publish_date} onChange={e => update('publish_date', e.target.value)} />
          </div>
        )}
        <div className="mb-3">
          <label className={labelClass}>Titre interne</label>
          <input className={inputClass} placeholder="ex: Pneumothorax spontané" value={form.title} onChange={e => update('title', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Spécialité</label>
            <select className={inputClass} value={form.specialty} onChange={e => update('specialty', e.target.value)}>
              <option value="">Choisir...</option>
              {['Cardiologie','Neurologie','Pneumologie','Gastroentérologie','Infectiologie','Néphrologie','Endocrinologie','Rhumatologie','Hématologie','Urgences','Réanimation','Chirurgie','Pédiatrie','Gynécologie','Dermatologie','Orthopédie','Psychiatrie','Ophtalmologie','ORL'].map(s => <option key={s}>{s}</option>)}
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
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div className="col-span-2">
            <label className={labelClass}>Âge</label>
            <div className="flex gap-2">
              <input className={inputClass} type="number" placeholder="34" value={form.age} onChange={e => update('age', e.target.value)} />
              <select className={inputClass} value={form.age_unit} onChange={e => update('age_unit', e.target.value)} style={{ maxWidth: '100px' }}>
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
          <textarea className={inputClass} rows={2} value={form.chief_complaint} onChange={e => update('chief_complaint', e.target.value)} />
        </div>
        <div className="mb-3">
          <label className={labelClass}>Contexte et antécédents</label>
          <textarea className={inputClass} rows={2} value={form.context} onChange={e => update('context', e.target.value)} />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[['TA','bp','120/80'],['FC','hr','80'],['Temp °C','temp','37.5'],['SpO2 %','spo2','98']].map(([label, field, ph]) => (
            <div key={field}>
              <label className={labelClass}>{label}</label>
              <input className={inputClass} placeholder={ph} value={form[field as keyof typeof form] as string} onChange={e => update(field, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div className={sectionClass}>
        <p className={sectionTitle}>Indices</p>
        <p className="text-xs text-gray-400 mb-3">L'indice 1 est révélé automatiquement.</p>
        {[1,2,3,4,5,6].map(n => (
          <div key={n} className="mb-2">
            <label className={labelClass}>Indice {n} {n === 1 ? '(auto-révélé)' : ''}</label>
            <input className={inputClass} value={form[`clue${n}` as keyof typeof form] as string} onChange={e => update(`clue${n}`, e.target.value)} />
          </div>
        ))}
      </div>

      <div className={sectionClass}>
        <p className={sectionTitle}>Diagnostic</p>
        <div className="mb-3">
          <label className={labelClass}>Diagnostic exact</label>
          <input className={inputClass} value={form.diagnosis_exact} onChange={e => update('diagnosis_exact', e.target.value)} />
        </div>
        <div className="mb-3">
          <label className={labelClass}>Alias acceptés</label>
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3].map(n => (
              <input key={n} className={inputClass} placeholder={`Alias ${n}`} value={form[`alias${n}` as keyof typeof form] as string} onChange={e => update(`alias${n}`, e.target.value)} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className={labelClass}>Catégorie</label>
            <select className={inputClass} value={form.diagnosis_category} onChange={e => update('diagnosis_category', e.target.value)}>
              <option value="">Choisir...</option>
              {['Cardiologie','Neurologie','Pneumologie','Gastroentérologie','Infectiologie','Néphrologie','Endocrinologie','Rhumatologie','Hématologie','Urgences','Réanimation','Chirurgie','Pédiatrie','Gynécologie','Dermatologie','Orthopédie','Psychiatrie'].map(s => <option key={s}>{s}</option>)}
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
          <input className={inputClass} value={form.wrong_answer_hint} onChange={e => update('wrong_answer_hint', e.target.value)} />
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
        <div className="mb-3">
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
        <div>
          <label className={labelClass}>Approche diagnostique</label>
          <p className="text-xs text-gray-300 mb-3">Comment raisonner face à ce cas, étape par étape</p>
          {[1,2,3,4,5].map(n => (
            <div key={n} className="mb-3 p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-400 mb-2">Étape {n}</p>
              <input className={inputClass + ' mb-2'} placeholder={`Titre de l'étape ${n}...`} value={form[`approach${n}_title` as keyof typeof form] as string} onChange={e => update(`approach${n}_title`, e.target.value)} />
              <textarea className={inputClass} rows={2} placeholder="Détail clinique..." value={form[`approach${n}_detail` as keyof typeof form] as string} onChange={e => update(`approach${n}_detail`, e.target.value)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className="text-xl font-semibold text-gray-900">Clin</span>
            <span className="text-xl font-semibold text-blue-600">IQ</span>
            <p className="text-sm text-gray-400 mt-0.5">Admin</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {(['create', 'edit', 'view'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setMessage(''); setEditingId(null); setForm(emptyForm) }}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${tab === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'}`}
            >
              {t === 'create' ? 'Créer' : t === 'edit' ? 'Modifier' : 'Voir tout'}
            </button>
          ))}
        </div>

        {/* CREATE TAB */}
        {tab === 'create' && (
          <div>
            <CaseForm isEdit={false} />
            {message && (
              <div className={`p-4 rounded-xl mb-4 text-sm font-medium ${message.includes('Erreur') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {message}
              </div>
            )}
            <button onClick={handleCreate} disabled={loading} className="w-full bg-blue-600 text-white py-3.5 rounded-xl text-sm font-medium disabled:opacity-50 mb-8">
              {loading ? 'Publication en cours...' : 'Publier le cas'}
            </button>
          </div>
        )}

        {/* EDIT TAB */}
        {tab === 'edit' && (
          <div>
            {!editingId ? (
              <div className="flex flex-col gap-3">
                {cases.map(c => (
                  <button key={c.id} onClick={() => loadCase(c.id)} className="bg-white rounded-2xl border border-gray-100 p-4 text-left hover:border-blue-200 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{c.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{c.specialty} · {c.publish_date}</p>
                      </div>
                      <span className="text-xs text-blue-600 font-medium">Modifier</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <button onClick={() => { setEditingId(null); setForm(emptyForm); setConfirmDelete(false) }} className="text-sm text-gray-400 mb-4 flex items-center gap-1">
                  ← Retour à la liste
                </button>
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4">
                  <p className="text-xs text-blue-600">Modification de : <strong>{editingId}</strong></p>
                </div>
                <CaseForm isEdit={true} />
                {message && (
                  <div className={`p-4 rounded-xl mb-4 text-sm font-medium ${message.includes('Erreur') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {message}
                  </div>
                )}
                <button onClick={handleUpdate} disabled={loading} className="w-full bg-blue-600 text-white py-3.5 rounded-xl text-sm font-medium disabled:opacity-50 mb-3">
                  {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
                {!confirmDelete ? (
                  <button onClick={() => setConfirmDelete(true)} className="w-full bg-white text-red-500 border border-red-200 py-3 rounded-xl text-sm font-medium mb-8">
                    Supprimer ce cas
                  </button>
                ) : (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-8">
                    <p className="text-sm text-red-700 font-medium mb-3">Confirmer la suppression de "{editingId}" ?</p>
                    <div className="flex gap-2">
                      <button onClick={handleDelete} disabled={loading} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium">
                        Oui, supprimer
                      </button>
                      <button onClick={() => setConfirmDelete(false)} className="flex-1 bg-white text-gray-600 border border-gray-200 py-2.5 rounded-xl text-sm font-medium">
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW TAB */}
        {tab === 'view' && (
          <div className="flex flex-col gap-3">
            {cases.map(c => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.id} · {c.specialty}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${c.difficulty === 1 ? 'bg-green-50 text-green-700 border-green-200' : c.difficulty === 2 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {c.difficulty === 1 ? 'Facile' : c.difficulty === 2 ? 'Moyen' : 'Difficile'}
                    </span>
                    <span className="text-xs text-gray-300">{c.publish_date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}