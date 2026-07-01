'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [idExists, setIdExists] = useState(false)
  const [checkingId, setCheckingId] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [form, setForm] = useState({
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
  })

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

  const handleSubmit = async () => {
    if (idExists) {
      setMessage('Erreur: cet ID existe déjà, changez-le avant de publier')
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

    const { error } = await supabase.from('cases').insert({
      id: form.id,
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
    })

    if (error) {
      setMessage('Erreur: ' + error.message)
    } else {
      setMessage('Cas publié avec succès!')
      setForm({
        id: '', title: '', specialty: '', difficulty: 2, publish_date: '',
        age: '', age_unit: 'ans', sex: 'F', setting: 'Urgences', chief_complaint: '', context: '',
        bp: '', hr: '', temp: '', spo2: '',
        clue1: '', clue2: '', clue3: '', clue4: '', clue5: '', clue6: '',
        diagnosis_exact: '', alias1: '', alias2: '', alias3: '',
        diagnosis_category: '', diagnosis_urgency: '', wrong_answer_hint: '',
        explanation: '', pearl: '',
        red_flag1: '', red_flag2: '', red_flag3: '',
        management1: '', management2: '', management3: '', management4: '',
        mistake1: '', mistake2: '',
        diff1_diagnosis: '', diff1_proximity: 'proche', diff1_distinction: '',
        diff2_diagnosis: '', diff2_proximity: 'faux', diff2_distinction: '',
        diff3_diagnosis: '', diff3_proximity: 'proche', diff3_distinction: '',
      })
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
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">ClinIQ</h1>
            <p className="text-sm text-gray-400">Nouveau cas</p>
          </div>
        </div>

        <div className={sectionClass}>
          <p className={sectionTitle}>Identité du cas</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={labelClass}>ID unique</label>
              <input
                className={`${inputClass} ${idExists ? 'border-red-300' : ''}`}
                placeholder="ex: pneumo-001"
                value={form.id}
                onChange={e => {
                  update('id', e.target.value)
                  checkId(e.target.value)
                }}
              />
              {checkingId && <p className="text-xs text-gray-300 mt-1">Vérification...</p>}
              {idExists && <p className="text-xs text-red-500 mt-1">Cet ID existe déjà, choisissez-en un autre</p>}
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
          {loading ? 'Publication en cours...' : 'Publier le cas'}
        </button>
      </div>
    </main>
  )
}