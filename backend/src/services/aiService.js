const https = require('https');
const { CATEGORY_DEPARTMENT_MAP } = require('../models/Grievance');

const ALLOWED_CATEGORIES = [
  'Roads',
  'Waste Management',
  'Water Supply',
  'Electricity',
  'Public Safety',
  'Environment',
  'Street Lighting',
  'Drainage',
  'Other',
];

const ALLOWED_DEPARTMENTS = [
  'Public Works & Roads',
  'Waste Management',
  'Water Supply & Sanitation',
  'Electricity & Power',
  'Health & Environment',
  'Traffic & Transport',
  'General Administration',
];

const ALLOWED_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

/**
 * Clean & extract JSON from LLM text response
 */
const extractJSON = (text) => {
  if (!text) return null;
  try {
    // Direct parse
    return JSON.parse(text);
  } catch (e) {
    // Strip markdown code fences if present (```json ... ```)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (err) {
        return null;
      }
    }
    return null;
  }
};

/**
 * Strict validator and sanitizer for AI output
 */
const validateAIResponse = (parsed, fallback = {}) => {
  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  // 1. Validate Category
  let category = parsed.category;
  if (!ALLOWED_CATEGORIES.includes(category)) {
    // Check case-insensitive match or fallback
    const matched = ALLOWED_CATEGORIES.find(
      (c) => c.toLowerCase() === (category || '').toLowerCase()
    );
    category = matched || fallback.category || 'Other';
  }

  // 2. Validate Department
  let department = parsed.department;
  if (!ALLOWED_DEPARTMENTS.includes(department)) {
    department =
      CATEGORY_DEPARTMENT_MAP[category] ||
      fallback.department ||
      'General Administration';
  }

  // 3. Validate Priority
  let priority = parsed.priority;
  if (!ALLOWED_PRIORITIES.includes(priority)) {
    const matchedP = ALLOWED_PRIORITIES.find(
      (p) => p.toLowerCase() === (priority || '').toLowerCase()
    );
    priority = matchedP || fallback.priority || 'Medium';
  }

  // 4. Validate Summary
  let summary =
    typeof parsed.summary === 'string' && parsed.summary.trim().length > 0
      ? parsed.summary.trim()
      : `Citizen reported: ${fallback.title || 'Civic issue'}. Requires administrative review and site inspection.`;

  // 5. Validate Suggested Action
  let suggestedAction =
    typeof parsed.suggestedAction === 'string' &&
    parsed.suggestedAction.trim().length > 0
      ? parsed.suggestedAction.trim()
      : `Dispatch field inspection team from ${department} to verify site condition and initiate repairs.`;

  return {
    category,
    department,
    priority,
    summary,
    suggestedAction,
    status: 'completed',
    confidenceScore:
      typeof parsed.confidenceScore === 'number'
        ? Math.min(Math.max(parsed.confidenceScore, 0.5), 1.0)
        : 0.92,
    analyzedAt: new Date(),
  };
};

/**
 * Fallback Rule-Based NLP Classifier (Zero external dependency resilience)
 */
const ruleBasedAnalysis = (title = '', description = '', fallback = {}) => {
  const content = `${title} ${description}`.toLowerCase();

  // Category detection heuristics
  let category = fallback.category || 'Other';
  if (/pothole|road|asphalt|tar|crater|pavement|footpath|divider/i.test(content)) {
    category = 'Roads';
  } else if (/garbage|waste|trash|dump|dustbin|litter|sanitary|debris/i.test(content)) {
    category = 'Waste Management';
  } else if (/water|pipeline|leak|burst|drinking water|supply|tank|tap/i.test(content)) {
    category = 'Water Supply';
  } else if (/light|street light|darkness|pole|lamp|bulb|illumination/i.test(content)) {
    category = 'Street Lighting';
  } else if (/electric|power|wire|transformer|spark|shock|blackout|voltage/i.test(content)) {
    category = 'Electricity';
  } else if (/drain|drainage|gutter|sewage|waterlogging|flood|clogged/i.test(content)) {
    category = 'Drainage';
  } else if (/pollution|smoke|chemical|tree|park|greenery|environment/i.test(content)) {
    category = 'Environment';
  } else if (/safety|encroachment|crime|hazard|stray animal|threat/i.test(content)) {
    category = 'Public Safety';
  }

  const department = CATEGORY_DEPARTMENT_MAP[category] || 'General Administration';

  // Priority detection heuristics
  let priority = fallback.priority || 'Medium';
  if (/emergency|urgent|danger|hazard|burst|flooding|spark|shock|live wire|collapse|fatal|critical/i.test(content)) {
    priority = 'Critical';
  } else if (/severe|blocked|overflowing|accident|broken|major|unusable|darkness/i.test(content)) {
    priority = 'High';
  } else if (/minor|slow|cosmetic|request|routine/i.test(content)) {
    priority = 'Low';
  }

  // Summary generation
  const summary = `Report indicates ${category.toLowerCase()} issue affecting local area. ${
    priority === 'Critical' || priority === 'High'
      ? 'High priority intervention needed to prevent public risk.'
      : 'Standard inspection and maintenance scheduled.'
  }`;

  // Suggested Action generation
  const actionTemplates = {
    Roads: 'Deploy road maintenance team with cold-mix asphalt patch unit for site restoration.',
    'Waste Management': 'Dispatch municipal compactor truck and sanitation team for immediate waste clearance.',
    'Water Supply': 'Deploy water works emergency repair crew to isolate valve and repair pipeline rupture.',
    Electricity: 'Alert electricity division line inspector to secure damaged wiring and restore line safety.',
    'Street Lighting': 'Dispatch electrical repair lift vehicle to replace faulty LED fixture/photocell.',
    Drainage: 'Deploy desilting suction machine and clearance team to unclog blocked storm drain.',
    Environment: 'Conduct environmental health inspection and issue municipal compliance notice.',
    'Public Safety': 'Notify local enforcement and zonal administration officer for on-site assessment.',
    Other: `Forward report to ${department} supervisor for preliminary verification and resolution.`,
  };

  const suggestedAction =
    actionTemplates[category] || `Assign field officer from ${department} for on-site inspection.`;

  return {
    category,
    department,
    priority,
    summary,
    suggestedAction,
    status: 'completed',
    confidenceScore: 0.88,
    analyzedAt: new Date(),
  };
};

/**
 * Call Gemini / OpenAI / LLM API with secure prompt and fallback
 */
const callLLMAPI = async (promptText) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // No API key configured -> smoothly use built-in smart NLP engine
    return null;
  }

  // If Gemini API Key
  if (process.env.GEMINI_API_KEY) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const payload = JSON.stringify({
      contents: [
        {
          parts: [{ text: promptText }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 500,
        responseMimeType: 'application/json',
      },
    });

    return new Promise((resolve) => {
      const req = https.request(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
          timeout: 7000,
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            try {
              const data = JSON.parse(body);
              const textContent =
                data.candidates?.[0]?.content?.parts?.[0]?.text;
              resolve(textContent || null);
            } catch (err) {
              resolve(null);
            }
          });
        }
      );

      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
      req.write(payload);
      req.end();
    });
  }

  // If OpenAI API Key
  if (process.env.OPENAI_API_KEY) {
    const url = 'https://api.openai.com/v1/chat/completions';
    const payload = JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: promptText }],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    return new Promise((resolve) => {
      const req = https.request(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Length': Buffer.byteLength(payload),
          },
          timeout: 7000,
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            try {
              const data = JSON.parse(body);
              const textContent = data.choices?.[0]?.message?.content;
              resolve(textContent || null);
            } catch (err) {
              resolve(null);
            }
          });
        }
      );

      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
      req.write(payload);
      req.end();
    });
  }

  return null;
};

/**
 * Main AI Grievance Analyzer
 */
const analyzeGrievance = async ({
  title = '',
  description = '',
  category = 'Other',
  priority = 'Medium',
  location = {},
}) => {
  try {
    const prompt = `
You are CivicAI, an intelligent public grievance analysis system for municipal governance.
Analyze the following citizen grievance and classify it accurately:

Title: "${title}"
Description: "${description}"
Incident Location: "${location?.address || 'City Ward'}"
Citizen Selected Category: "${category}"
Citizen Selected Priority: "${priority}"

Allowed Categories (choose ONLY from this list):
- Roads
- Waste Management
- Water Supply
- Electricity
- Street Lighting
- Drainage
- Public Safety
- Environment
- Other

Allowed Departments (choose ONLY from this list):
- Public Works & Roads
- Waste Management
- Water Supply & Sanitation
- Electricity & Power
- Health & Environment
- Traffic & Transport
- General Administration

Allowed Priorities (choose ONLY from this list):
- Low
- Medium
- High
- Critical

Return a valid JSON object matching this schema exactly:
{
  "category": "One from Allowed Categories",
  "department": "One from Allowed Departments",
  "priority": "Low | Medium | High | Critical",
  "summary": "Concise 1-2 sentence executive summary of the issue",
  "suggestedAction": "Clear recommended immediate resolution step for field officers",
  "confidenceScore": 0.95
}
`;

    // 1. Try calling external LLM API
    let rawText = null;
    try {
      rawText = await callLLMAPI(prompt);
    } catch (llmErr) {
      console.warn('[CivicAI Service] External LLM API unreachable, using resilient local analyzer.');
    }

    // 2. Parse JSON
    if (rawText) {
      const parsed = extractJSON(rawText);
      if (parsed) {
        const validated = validateAIResponse(parsed, {
          title,
          category,
          priority,
          department: CATEGORY_DEPARTMENT_MAP[category],
        });
        if (validated) {
          console.log(`[CivicAI Service] LLM analysis completed successfully for "${title.slice(0, 30)}..."`);
          return validated;
        }
      }
    }

    // 3. Fallback to resilient smart NLP rule engine
    console.log(`[CivicAI Service] Applying smart fallback analyzer for "${title.slice(0, 30)}..."`);
    const fallbackResult = ruleBasedAnalysis(title, description, {
      category,
      priority,
      department: CATEGORY_DEPARTMENT_MAP[category],
    });

    return fallbackResult;
  } catch (error) {
    console.error('[CivicAI Service Error]: Failed to analyze grievance:', error.message);
    // Return failed status with safe fallbacks
    return {
      category: category || 'Other',
      department: CATEGORY_DEPARTMENT_MAP[category] || 'General Administration',
      priority: priority || 'Medium',
      summary: `Citizen complaint filed: ${title}. Awaiting manual administrative review.`,
      suggestedAction: `Assign to ${CATEGORY_DEPARTMENT_MAP[category] || 'General Administration'} for manual assessment.`,
      status: 'failed',
      confidenceScore: 0.5,
      analyzedAt: new Date(),
    };
  }
};

module.exports = {
  analyzeGrievance,
  validateAIResponse,
  ruleBasedAnalysis,
  ALLOWED_CATEGORIES,
  ALLOWED_DEPARTMENTS,
  ALLOWED_PRIORITIES,
};
