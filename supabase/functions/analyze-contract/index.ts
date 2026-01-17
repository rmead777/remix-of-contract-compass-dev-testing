import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    employeeName: {
      type: "object",
      properties: {
        value: { type: "string", description: "Full name of the employee" },
        excerpt: { type: "string", description: "Exact quote from contract mentioning the name" },
        confidence: { type: "number", description: "Confidence score 0-1" }
      },
      required: ["value", "excerpt", "confidence"]
    },
    position: {
      type: "object",
      properties: {
        value: { type: "string", description: "Job title or position" },
        excerpt: { type: "string", description: "Exact quote from contract" },
        confidence: { type: "number" }
      },
      required: ["value", "excerpt", "confidence"]
    },
    startDate: {
      type: "object",
      properties: {
        value: { type: "string", description: "Employment start date" },
        excerpt: { type: "string" },
        confidence: { type: "number" }
      },
      required: ["value", "excerpt", "confidence"]
    },
    employmentType: {
      type: "object",
      properties: {
        value: { type: "string", description: "Full-time, Part-time, Contractor, etc." },
        excerpt: { type: "string" },
        confidence: { type: "number" }
      },
      required: ["value", "excerpt", "confidence"]
    },
    salary: {
      type: "object",
      properties: {
        value: { type: "string", description: "Base salary/compensation amount" },
        excerpt: { type: "string" },
        confidence: { type: "number" }
      },
      required: ["value", "excerpt", "confidence"]
    },
    paymentFrequency: {
      type: "object",
      properties: {
        value: { type: "string", description: "How often payment is made (weekly, bi-weekly, monthly)" },
        excerpt: { type: "string" },
        confidence: { type: "number" }
      },
      required: ["value", "excerpt", "confidence"]
    },
    benefits: {
      type: "object",
      properties: {
        value: { type: "string", description: "List of benefits (health insurance, 401k, etc.)" },
        excerpt: { type: "string" },
        confidence: { type: "number" }
      },
      required: ["value", "excerpt", "confidence"]
    },
    ptoDays: {
      type: "object",
      properties: {
        value: { type: "string", description: "Number of PTO/vacation days" },
        excerpt: { type: "string" },
        confidence: { type: "number" }
      },
      required: ["value", "excerpt", "confidence"]
    },
    noticePeriod: {
      type: "object",
      properties: {
        value: { type: "string", description: "Required notice period for resignation/termination" },
        excerpt: { type: "string" },
        confidence: { type: "number" }
      },
      required: ["value", "excerpt", "confidence"]
    },
    nonCompete: {
      type: "object",
      properties: {
        value: { type: "string", description: "Non-compete clause duration and terms, or null if none" },
        excerpt: { type: "string" },
        confidence: { type: "number" }
      },
      required: ["value", "excerpt", "confidence"]
    },
    confidentiality: {
      type: "object",
      properties: {
        value: { type: "string", description: "Whether confidentiality/NDA clause exists and key terms" },
        excerpt: { type: "string" },
        confidence: { type: "number" }
      },
      required: ["value", "excerpt", "confidence"]
    },
    workLocation: {
      type: "object",
      properties: {
        value: { type: "string", description: "Remote, Hybrid, On-site, or specific location" },
        excerpt: { type: "string" },
        confidence: { type: "number" }
      },
      required: ["value", "excerpt", "confidence"]
    },
    reportingTo: {
      type: "object",
      properties: {
        value: { type: "string", description: "Who the employee reports to" },
        excerpt: { type: "string" },
        confidence: { type: "number" }
      },
      required: ["value", "excerpt", "confidence"]
    },
    terminationProvisions: {
      type: "object",
      properties: {
        value: { type: "string", description: "Summary of termination provisions and procedures" },
        excerpt: { type: "string", description: "Key termination clause text" },
        confidence: { type: "number" }
      },
      required: ["value", "excerpt", "confidence"]
    },
    terminationForCause: {
      type: "object",
      properties: {
        value: { type: "string", description: "What qualifies as termination for cause (gross misconduct, breach, etc.)" },
        excerpt: { type: "string", description: "Exact clause defining cause for termination" },
        confidence: { type: "number" }
      },
      required: ["value", "excerpt", "confidence"]
    },
    terminationWithoutCause: {
      type: "object",
      properties: {
        value: { type: "string", description: "Terms for termination without cause (severance, notice, etc.)" },
        excerpt: { type: "string" },
        confidence: { type: "number" }
      },
      required: ["value", "excerpt", "confidence"]
    },
    severancePay: {
      type: "object",
      properties: {
        value: { type: "string", description: "Severance package details if applicable" },
        excerpt: { type: "string" },
        confidence: { type: "number" }
      },
      required: ["value", "excerpt", "confidence"]
    },
    suggestedNewTerms: {
      type: "array",
      description: "Any significant terms found that are not in the standard list",
      items: {
        type: "object",
        properties: {
          termId: { type: "string", description: "camelCase identifier for the term" },
          termLabel: { type: "string", description: "Human-readable label" },
          description: { type: "string", description: "What this term represents" },
          sampleValue: { type: "string", description: "The value found in this contract" },
          excerpt: { type: "string", description: "Relevant contract text" }
        },
        required: ["termId", "termLabel", "description", "sampleValue", "excerpt"]
      }
    }
  },
  required: ["employeeName", "position", "startDate", "employmentType", "salary", "terminationProvisions", "terminationForCause"]
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contractText, fileName, existingColumns } = await req.json();

    if (!contractText) {
      return new Response(
        JSON.stringify({ success: false, error: 'Contract text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing contract: ${fileName}, text length: ${contractText.length}`);

    const systemPrompt = `You are an expert employment contract analyst. Your task is to extract key terms from employment contracts with high accuracy.

For each term you extract:
1. Provide the actual value found in the contract
2. Include the exact excerpt/clause from the contract that contains this information
3. Rate your confidence (0-1) based on how clearly the term is stated

Pay special attention to:
- TERMINATION PROVISIONS: Identify all termination-related clauses
- TERMINATION FOR CAUSE: Look for definitions of "cause" including misconduct, breach of duty, criminal acts, policy violations, etc.
- TERMINATION WITHOUT CAUSE: At-will provisions, notice requirements, severance
- SEVERANCE: Any severance packages, continuation of benefits, garden leave

If a term is not found or not applicable, return null for the value but still provide confidence of 0.

Also identify any significant terms NOT in the standard list that should be tracked (e.g., signing bonus, equity grants, relocation assistance, probation period).`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Please analyze this employment contract and extract all key terms:\n\n---\n${contractText}\n---\n\nExisting columns being tracked: ${existingColumns?.join(', ') || 'standard terms'}` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_contract_terms',
              description: 'Extract structured employment contract terms with excerpts and confidence scores',
              parameters: EXTRACTION_SCHEMA
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_contract_terms' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI usage limit reached. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to analyze contract' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    console.log('AI response received');

    // Extract the function call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'extract_contract_terms') {
      console.error('Unexpected AI response format:', JSON.stringify(aiResponse));
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to parse contract analysis' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const extractedTerms = JSON.parse(toolCall.function.arguments);
    console.log('Successfully extracted terms:', Object.keys(extractedTerms));

    return new Response(
      JSON.stringify({ 
        success: true, 
        terms: extractedTerms,
        suggestedNewTerms: extractedTerms.suggestedNewTerms || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing contract:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
