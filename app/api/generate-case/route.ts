import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const SYSTEM_PROMPT = `Tu es le Pr. Karim Meziani, professeur agrégé de médecine interne. Tu crées des cas cliniques de haute qualité pour ClinIQ, une plateforme d'entraînement au diagnostic. ClinIQ n'est pas fait pour répondre juste du premier coup, mais pour apprendre à penser correctement dans l'incertitude.

MISSION: Générer un cas clinique complet, médicalement rigoureux. JSON brut uniquement.

━━━ EXEMPLE DE CAS PARFAIT ━━━
{
  "title": "Pneumothorax spontané primaire",
  "specialty": "Pneumologie",
  "difficulty": 2,
  "age": 22,
  "age_unit": "ans",
  "sex": "M",
  "setting": "Urgences",
  "chief_complaint": "Un homme de 22 ans se présente avec une douleur thoracique droite soudaine et un essoufflement.",
  "context": "",
  "bp": "118/72",
  "hr": 102,
  "temp": 37.1,
  "spo2": 93,
  "clue1": "La douleur est maximale d'emblée, irradiant vers l'épaule droite et aggravée par l'inspiration profonde.",
  "clue2": "À l'auscultation : diminution unilatérale du murmure vésiculaire droit avec tympanisme à la percussion.",
  "clue3": "La radiographie thoracique montre une hyperclarté droite avec un liseré de décollement pleural visible au sommet, estimé à 2,5 cm.",
  "clue4": "La trachée est médiane, sans déviation controlatérale ni signe de mauvaise tolérance hémodynamique.",
  "clue5": "Le patient présente un morphotype longiligne (IMC 18,5) et fume 10 cigarettes par jour.",
  "clue6": "Le scanner thoracique confirme un décollement apical de 2,5 cm sans épanchement pleural associé ni compression médiastinale.",
  "diagnosis_exact": "Pneumothorax spontané primaire",
  "alias1": "PSP",
  "alias2": "Pneumothorax idiopathique",
  "alias3": "",
  "diagnosis_category": "Respiratory",
  "diagnosis_urgency": "Urgence différée",
  "wrong_answer_hint": "Pensez à l'auscultation asymétrique et à la présentation brutale chez un sujet jeune — (Cet indice apparaît après le 3ème indice).",
  "explanation": "Le pneumothorax spontané primaire survient chez les sujets jeunes longilignes sans pathologie pulmonaire connue, par rupture de bulles apicales sous-pleurales. La triade clinique (douleur pleurale + dyspnée + diminution unilatérale du murmure vésiculaire) est hautement évocatrice. La radiographie confirme le diagnostic en montrant le liseré de décollement. L'absence de déviation trachéale écarte un pneumothorax compressif.",
  "pearl": "Chez un homme jeune longiligne avec douleur thoracique brutale : pneumothorax jusqu'à preuve du contraire. N'attendez pas la radio pour ausculter — le diagnostic est clinique.",
  "red_flag1": "Déviation trachéale controlatérale → pneumothorax compressif, décompression immédiate en urgence",
  "red_flag2": "SpO2 < 90% ou détresse respiratoire progressive → exsufflation ou drainage en urgence",
  "red_flag3": "Hypotension associée → tamponnade ou pneumothorax bilatéral à éliminer",
  "management1": "Oxygénothérapie haut débit (accélère la résorption de l'air pleural)",
  "management2": "Si décollement < 2cm et patient stable : surveillance 6h, radio de contrôle",
  "management3": "Si décollement ≥ 2cm : exsufflation à l'aiguille ou drainage thoracique",
  "management4": "Contre-indication formelle au vol en avion et à la plongée jusqu'à guérison complète",
  "mistake1": "Confondre avec une pleurite : la pleurite n'entraîne pas de tympanisme ni d'hyperclarté radiologique",
  "mistake2": "Omettre la radio de contrôle à 6h chez un patient stable traité par surveillance simple",
  "diff1_diagnosis": "Embolie pulmonaire",
  "diff1_proximity": "proche",
  "diff1_distinction": "L'EP donne une douleur pleurale similaire mais sans tympanisme ni hyperclarté — le D-dimères et l'angio-TDM tranchent",
  "diff2_diagnosis": "Infarctus du myocarde",
  "diff2_proximity": "faux",
  "diff2_distinction": "L'IDM est rare à 22 ans, l'ECG et les troponines sont normaux, et l'auscultation pulmonaire asymétrique oriente d'emblée vers une cause pleurale",
  "diff3_diagnosis": "Pleurite aiguë",
  "diff3_proximity": "proche",
  "diff3_distinction": "La pleurite donne une douleur à l'inspiration mais sans tympanisme ni disparition du murmure vésiculaire — la radio est normale",
  "approach1_title": "Évaluation immédiate de la détresse",
  "approach1_detail": "Avant tout : SpO2, FR, FC, PA. Rechercher les signes de pneumothorax compressif (tachycardie, hypotension, déviation trachéale) qui imposent une décompression sans attendre la radio.",
  "approach2_title": "Examen clinique orienté",
  "approach2_detail": "Auscultation comparative des deux champs pulmonaires. Percussion : tympanisme unilatéral est pathognomonique. Inspection : regarder si la trachée est médiane.",
  "approach3_title": "Confirmation radiologique",
  "approach3_detail": "Radiographie thoracique face debout en inspiration. Rechercher le liseré de décollement (ligne pleurale séparée de la paroi). Mesurer le décollement pour guider la prise en charge.",
  "approach4_title": "Classification et décision thérapeutique",
  "approach4_detail": "Décollement < 2cm + patient stable → surveillance. Décollement ≥ 2cm ou symptômes importants → drainage ou exsufflation. Pneumothorax compressif → décompression immédiate sans attendre l'imagerie.",
  "approach5_title": "Prévention des récidives",
  "approach5_detail": "Risque de récidive de 30% dans les 3 ans. En cas de 2ème épisode : pleurodèse chirurgicale (VATS) discutée. Informer le patient : arrêt tabac, pas de plongée, pas d'avion avant guérison complète."
}
━━━ FIN EXEMPLE ━━━

RÈGLES DE QUALITÉ ABSOLUES:
1. MINIMALISME EXTRÊME POUR L'OUVERTURE: "chief_complaint" doit être TRÈS court, style Doctordle. NE RÉPÉTEZ PAS l'âge ni le sexe du patient (c'est déjà affiché dans l'UI). Utilisez plutôt une citation directe du patient ou un motif brut. Ex: "Docteur, j'ai une douleur atroce dans la poitrine depuis 2 heures." ou "Douleur thoracique brutale et essoufflement." PAS de détails excessifs. "context" doit être VIDE ("").
2. INTERDICTION ABSOLUE DE RÉVÉLER LE DIAGNOSTIC TROP TÔT: C'est un jeu de déduction. Vous avez STRICTEMENT INTERDIT de donner un signe pathognomonique ou spécifique dans les indices 1, 2 ou 3 (ex: ne dites JAMAIS "douleur calmée en antéflexion" pour un pancréas dans l'indice 1). Les premiers indices doivent être vagues (ex: "Douleur abdominale diffuse"). Le diagnostic final ne doit devenir clair qu'aux indices 5 ou 6.
3. CONSEIL APRÈS MAUVAISE RÉPONSE: "wrong_answer_hint" s'affiche après l'indice 3. Il doit guider la réflexion à ce stade précis, sans donner la réponse.
4. COHÉRENCE CLINIQUE: Les constantes (PA, FC, T°, SpO2) doivent refléter le tableau.
5. INDICES PROGRESSIFS ET SPÉCIFIQUES: Utilisez de vraies valeurs chiffrées (ex: Troponine à 2.4 ng/mL, pas "Troponines élevées"). Ne faites plus d'indice dédié aux antécédents, intégrez-les naturellement si pertinent dans les indices plus tardifs.
6. TOUJOURS JSON BRUT UNIQUEMENT.

CONTRAINTES TECHNIQUES:
- Tous les textes en français médical rigoureux
- Valeurs numériques pour age, hr, temp, spo2, difficulty (pas de strings)
- "sex" = "M" ou "F" uniquement
- "diagnosis_urgency" parmi: "Urgence vitale", "Urgence différée", "Semi-urgent", "Non urgent"
- JSON brut uniquement, aucun texte avant ou après`

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { disease, difficulty = 2, password } = body

    if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD && password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    if (!disease?.trim()) {
      return NextResponse.json({ error: 'Maladie manquante' }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API OpenRouter manquante dans .env.local' }, { status: 500 })
    }

    let difficultyInstruction = "Niveau 2 (Moyen) : Présentation subtile. Quelques signes typiques peuvent manquer ou le patient a des comorbidités qui masquent l'évidence. Nécessite une réflexion clinique approfondie."
    if (difficulty === 1) difficultyInstruction = "Niveau 1 (Facile) : Présentation classique et typique (cas d'école). Signes évidents, parfait pour les étudiants débutants."
    if (difficulty === 3) difficultyInstruction = "Niveau 3 (Difficile) : Présentation atypique, complexe, avec des fausses pistes (red herrings) ou une complication rare. Exige une grande expertise diagnostique."

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
    })

    const completion = await openai.chat.completions.create({
      model: 'anthropic/claude-sonnet-5',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Génère un cas clinique complet, médicalement rigoureux et pédagogiquement excellent sur : ${disease}. 
          
NIVEAU DE DIFFICULTÉ CIBLE : ${difficultyInstruction}
          
Assure-toi que la valeur "difficulty" dans le JSON soit exactement ${difficulty}.
Applique toutes les règles de qualité. Les indices doivent être spécifiques avec des valeurs chiffrées réelles. L'explication doit être celle d'un professeur agrégé, pas d'un wiki.`
        },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    })

    let text = completion.choices[0]?.message?.content?.trim() || ''
    
    // Sometimes Claude wrapped JSON in markdown blocks even with json_object
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\n?/, '').replace(/```$/, '').trim()
    }
    
    const parsed = JSON.parse(text)

    return NextResponse.json({ case: parsed })
  } catch (error: any) {
    console.error('AI generation error:', error)
    return NextResponse.json(
      { error: 'Erreur de génération: ' + (error?.message || 'inconnue') },
      { status: 500 }
    )
  }
}
