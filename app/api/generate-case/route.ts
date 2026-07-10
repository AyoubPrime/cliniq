import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

// Use ADMIN_PASSWORD (server-only) for validation — more secure than NEXT_PUBLIC_
// Add this to .env.local: ADMIN_PASSWORD=cliniqisfordoctors

const SYSTEM_PROMPT = `Tu es un professeur de médecine expert qui crée des cas cliniques pour des étudiants francophones en médecine.

Tu dois générer un cas clinique complet et réaliste, en français, strictement au format JSON suivant. Ne génère RIEN d'autre que le JSON brut, sans markdown, sans balises, sans explications.

Format JSON attendu:
{
  "title": "Titre interne court du cas (ex: Pneumothorax spontané)",
  "specialty": "La spécialité médicale (ex: Pneumologie)",
  "difficulty": 2,
  "age": 28,
  "age_unit": "ans",
  "sex": "M",
  "setting": "Urgences",
  "chief_complaint": "Douleur thoracique brutale",
  "context": "Phrase ou deux décrivant le contexte clinique du patient",
  "bp": "120/80",
  "hr": 95,
  "temp": 37.2,
  "spo2": 94,
  "clue1": "Premier indice révélé automatiquement — signe ou symptôme clé très évocateur mais non pathognomonique",
  "clue2": "Deuxième indice — résultat d'examen clinique",
  "clue3": "Troisième indice — donnée paraclinique ou anamnestique",
  "clue4": "Quatrième indice — facteur de risque ou contexte",
  "clue5": "Cinquième indice — signe différentiel ou de gravité",
  "clue6": "Sixième indice — élément confirmateur",
  "diagnosis_exact": "Nom exact du diagnostic (ex: Pneumothorax spontané primaire)",
  "alias1": "Synonyme ou abréviation acceptée 1",
  "alias2": "Synonyme 2 (optionnel, laisser vide si aucun)",
  "alias3": "Synonyme 3 (optionnel, laisser vide si aucun)",
  "diagnosis_category": "Catégorie (ex: Respiratory, Cardiac, Infectious, etc.)",
  "diagnosis_urgency": "Urgence vitale",
  "wrong_answer_hint": "Indice à donner si la réponse est incorrecte (1 phrase, sans révéler le diagnostic)",
  "explanation": "Explication pédagogique complète du diagnostic en 3-4 phrases. Mécanisme, présentation typique, pourquoi les indices pointent vers ce diagnostic.",
  "pearl": "Une perle clinique mémorable et pratique en 1-2 phrases.",
  "red_flag1": "Premier signe d'alarme à surveiller absolument",
  "red_flag2": "Deuxième signe d'alarme",
  "red_flag3": "Troisième signe d'alarme (optionnel)",
  "management1": "Première étape de prise en charge immédiate",
  "management2": "Deuxième étape",
  "management3": "Troisième étape",
  "management4": "Quatrième étape (optionnel)",
  "mistake1": "Erreur classique que font les étudiants sur ce cas",
  "mistake2": "Deuxième erreur classique (optionnel)",
  "diff1_diagnosis": "Premier diagnostic différentiel important",
  "diff1_proximity": "proche",
  "diff1_distinction": "Pourquoi ce différentiel est écarté dans ce cas précis",
  "diff2_diagnosis": "Deuxième diagnostic différentiel",
  "diff2_proximity": "faux",
  "diff2_distinction": "Pourquoi écarté",
  "diff3_diagnosis": "Troisième diagnostic différentiel",
  "diff3_proximity": "proche",
  "diff3_distinction": "Pourquoi écarté",
  "approach1_title": "Étape 1 du raisonnement clinique",
  "approach1_detail": "Explication détaillée de cette étape",
  "approach2_title": "Étape 2",
  "approach2_detail": "Explication",
  "approach3_title": "Étape 3",
  "approach3_detail": "Explication",
  "approach4_title": "Étape 4",
  "approach4_detail": "Explication",
  "approach5_title": "Étape 5 (optionnel)",
  "approach5_detail": "Explication (optionnel)"
}

Règles importantes:
- Tous les textes sont en français médical correct
- Le cas doit être réaliste et éducativement précis
- Les 6 indices doivent être progressifs : du plus évocateur au plus confirmateur
- Les valeurs numériques (age, hr, temp, spo2, difficulty) sont des nombres, pas des strings
- "sex" est soit "M" soit "F"
- "diagnosis_urgency" est l'une de: "Urgence vitale", "Urgence différée", "Semi-urgent", "Non urgent"
- "diff1_proximity" et "diff3_proximity" sont "proche", "diff2_proximity" est "faux"
- Ne génère QUE le JSON brut, sans aucun texte avant ou après`

export async function POST(request: Request) {
  try {
    // Validate admin password
    const body = await request.json()
    const { disease, password } = body

    if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD && password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    if (!disease?.trim()) {
      return NextResponse.json({ error: 'Maladie manquante' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API Gemini manquante' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

    const prompt = `${SYSTEM_PROMPT}\n\nGénère un cas clinique complet sur : ${disease}`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()

    // Strip any accidental markdown fences
    const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()

    const parsed = JSON.parse(clean)

    return NextResponse.json({ case: parsed })
  } catch (error: any) {
    console.error('AI generation error:', error)
    return NextResponse.json(
      { error: 'Erreur de génération: ' + (error?.message || 'inconnue') },
      { status: 500 }
    )
  }
}
