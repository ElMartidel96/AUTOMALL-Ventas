/**
 * AI Refinement Service
 *
 * Uses GPT to analyze and refine task proposals
 * Suggests categories, rewards, complexity, and improved descriptions
 */

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ProposalRefinement {
  refinedTitle: string
  refinedDescription: string
  suggestedDomain: string
  suggestedCategory: string
  suggestedReward: number
  suggestedComplexity: number
  estimatedDays: number
  skills: string[]
  deliverables: string[]
  acceptanceCriteria: string[]
  confidence: number
}

interface RefinementError {
  error: string
  details?: string
}

/**
 * Categories and their characteristics
 */
const CATEGORIES = {
  development: {
    name: 'Desarrollo',
    keywords: ['código', 'programar', 'api', 'frontend', 'backend', 'smart contract', 'bug', 'feature'],
    baseReward: 300,
    complexityMultiplier: 1.2,
  },
  design: {
    name: 'Diseño',
    keywords: ['diseño', 'ui', 'ux', 'logo', 'gráfico', 'figma', 'mockup', 'visual'],
    baseReward: 200,
    complexityMultiplier: 1.0,
  },
  content: {
    name: 'Contenido',
    keywords: ['escribir', 'artículo', 'blog', 'documentación', 'tutorial', 'guía', 'copy'],
    baseReward: 150,
    complexityMultiplier: 0.8,
  },
  marketing: {
    name: 'Marketing',
    keywords: ['marketing', 'redes sociales', 'campaña', 'promoción', 'ads', 'twitter', 'discord'],
    baseReward: 200,
    complexityMultiplier: 0.9,
  },
  community: {
    name: 'Comunidad',
    keywords: ['comunidad', 'moderar', 'evento', 'ama', 'onboarding', 'support'],
    baseReward: 100,
    complexityMultiplier: 0.7,
  },
  research: {
    name: 'Investigación',
    keywords: ['investigar', 'análisis', 'estudio', 'competencia', 'mercado', 'reporte'],
    baseReward: 250,
    complexityMultiplier: 1.0,
  },
}

/**
 * Refine a proposal using AI
 */
export async function refineProposal(
  title: string,
  description: string
): Promise<ProposalRefinement | RefinementError> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      error: 'OpenAI API key not configured',
      details: 'Set OPENAI_API_KEY in environment variables',
    }
  }

  try {
    const prompt = `Eres un experto en gestión de proyectos para una DAO de crypto. Analiza la siguiente propuesta de tarea y proporciona un refinamiento estructurado.

PROPUESTA ORIGINAL:
Título: ${title}
Descripción: ${description}

CATEGORÍAS DISPONIBLES:
- development: Desarrollo de software, smart contracts, APIs
- design: Diseño UI/UX, gráficos, branding
- content: Escritura, documentación, tutoriales
- marketing: Campañas, redes sociales, promoción
- community: Gestión de comunidad, eventos, soporte
- research: Investigación, análisis, reportes

RESPONDE EN JSON CON EXACTAMENTE ESTA ESTRUCTURA:
{
  "refinedTitle": "Título mejorado, claro y accionable (máx 100 chars)",
  "refinedDescription": "Descripción mejorada con contexto, objetivos claros y entregables esperados (máx 500 chars)",
  "suggestedDomain": "El dominio principal (development/design/content/marketing/community/research)",
  "suggestedCategory": "Subcategoría específica en español",
  "suggestedReward": número entre 50 y 5000 basado en complejidad y valor,
  "suggestedComplexity": número del 1 al 10,
  "estimatedDays": número de días estimados para completar,
  "skills": ["lista", "de", "habilidades", "necesarias"],
  "deliverables": ["lista", "de", "entregables", "concretos"],
  "acceptanceCriteria": ["criterio 1", "criterio 2", "criterio 3"],
  "confidence": número del 0 al 1 indicando confianza en el análisis
}

CRITERIOS PARA RECOMPENSA:
- Tareas simples (1-3 complejidad): 50-200 CGC
- Tareas medianas (4-6 complejidad): 200-500 CGC
- Tareas complejas (7-8 complejidad): 500-1500 CGC
- Tareas muy complejas (9-10): 1500-5000 CGC

Solo responde con el JSON, sin explicaciones adicionales.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto en gestión de proyectos DAO. Responde solo con JSON válido.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      return {
        error: 'No response from AI',
        details: 'The AI did not return a response',
      }
    }

    const parsed = JSON.parse(content)

    // Validate and sanitize the response
    const refinement: ProposalRefinement = {
      refinedTitle: String(parsed.refinedTitle || title).slice(0, 100),
      refinedDescription: String(parsed.refinedDescription || description).slice(0, 1000),
      suggestedDomain: validateDomain(parsed.suggestedDomain),
      suggestedCategory: String(parsed.suggestedCategory || 'General'),
      suggestedReward: clamp(Number(parsed.suggestedReward) || 100, 50, 5000),
      suggestedComplexity: clamp(Number(parsed.suggestedComplexity) || 3, 1, 10),
      estimatedDays: clamp(Number(parsed.estimatedDays) || 2, 1, 30),
      skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 5) : [],
      deliverables: Array.isArray(parsed.deliverables) ? parsed.deliverables.slice(0, 5) : [],
      acceptanceCriteria: Array.isArray(parsed.acceptanceCriteria) ? parsed.acceptanceCriteria.slice(0, 5) : [],
      confidence: clamp(Number(parsed.confidence) || 0.8, 0, 1),
    }

    console.log(`[AI Refinement] Processed proposal: "${title}" → Category: ${refinement.suggestedDomain}, Reward: ${refinement.suggestedReward} CGC`)

    return refinement
  } catch (error) {
    console.error('[AI Refinement] Error:', error)

    if (error instanceof SyntaxError) {
      return {
        error: 'Failed to parse AI response',
        details: 'The AI response was not valid JSON',
      }
    }

    return {
      error: 'AI refinement failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Quick category detection without full AI call
 */
export function detectCategory(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase()

  for (const [key, category] of Object.entries(CATEGORIES)) {
    for (const keyword of category.keywords) {
      if (text.includes(keyword)) {
        return key
      }
    }
  }

  return 'community' // Default category
}

/**
 * Quick complexity estimation based on text length and keywords
 */
export function estimateComplexity(description: string): number {
  const wordCount = description.split(/\s+/).length

  // Base complexity from length
  let complexity = Math.min(Math.ceil(wordCount / 50), 5)

  // Adjust based on keywords
  const complexKeywords = ['integración', 'smart contract', 'api', 'sistema', 'complejo', 'full']
  const simpleKeywords = ['simple', 'básico', 'actualizar', 'editar', 'pequeño']

  const lowerDesc = description.toLowerCase()

  for (const keyword of complexKeywords) {
    if (lowerDesc.includes(keyword)) {
      complexity += 1
    }
  }

  for (const keyword of simpleKeywords) {
    if (lowerDesc.includes(keyword)) {
      complexity -= 1
    }
  }

  return clamp(complexity, 1, 10)
}

/**
 * Estimate reward based on category and complexity
 */
export function estimateReward(category: string, complexity: number): number {
  const categoryInfo = CATEGORIES[category as keyof typeof CATEGORIES] || CATEGORIES.community
  const baseReward = categoryInfo.baseReward
  const multiplier = categoryInfo.complexityMultiplier

  const reward = baseReward * (1 + (complexity - 1) * 0.3) * multiplier

  return Math.round(reward / 50) * 50 // Round to nearest 50
}

/**
 * Validate domain value
 */
function validateDomain(domain: string): string {
  const validDomains = ['development', 'design', 'content', 'marketing', 'community', 'research']
  return validDomains.includes(domain) ? domain : 'community'
}

/**
 * Clamp a number between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Check if refinement is an error
 */
export function isRefinementError(
  result: ProposalRefinement | RefinementError
): result is RefinementError {
  return 'error' in result
}
