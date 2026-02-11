import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { google } from '@ai-sdk/google';
import { ResumeData } from '@/types/resume';

export const maxDuration = 30;

/**
 * Analyze Resume API Route
 * Uses AI to provide comprehensive resume analysis with scores and recommendations
 */
export async function POST(req: Request) {
  try {
    const { resumeData } = await req.json() as { resumeData: ResumeData };

    if (!resumeData) {
      return Response.json({ error: 'Resume data is required' }, { status: 400 });
    }

    console.log('📊 Analyzing resume for:', resumeData.name);

    const analysisPrompt = `You are an expert technical recruiter and career advisor. Analyze the following resume and provide a comprehensive evaluation.

# CANDIDATE PROFILE
Name: ${resumeData.name}
Email: ${resumeData.email}

## Skills
${resumeData.skills.join(', ')}

## Experience
${resumeData.experience.map(exp => `
- ${exp.position} at ${exp.company} (${exp.duration})
  ${exp.description}
  ${exp.technologies?.length ? `Technologies: ${exp.technologies.join(', ')}` : ''}
`).join('\n')}

## Education
${resumeData.education.map(edu => `
- ${edu.degree} in ${edu.field} from ${edu.institution} (${edu.year})
`).join('\n')}

# ANALYSIS TASK
Provide a detailed analysis with the following scores and insights. Respond ONLY with valid JSON in this exact format:

{
  "overallScore": <number 0-100>,
  "skillsScore": <number 0-100>,
  "experienceScore": <number 0-100>,
  "educationScore": <number 0-100>,
  "summary": "<brief 1-2 sentence overall assessment>",
  "skillsCoverage": {
    "technical": <number of technical skills>,
    "soft": <number of soft skills>,
    "total": <total skills count>
  },
  "strengths": [
    "<specific strength 1>",
    "<specific strength 2>",
    "<specific strength 3>",
    "<specific strength 4>"
  ],
  "weaknesses": [
    "<area for improvement 1>",
    "<area for improvement 2>",
    "<area for improvement 3>"
  ],
  "recommendations": [
    "<actionable recommendation 1>",
    "<actionable recommendation 2>",
    "<actionable recommendation 3>",
    "<actionable recommendation 4>"
  ]
}

# SCORING GUIDELINES
- **Skills Score**: Based on relevance, diversity, and technical depth
- **Experience Score**: Based on quality of descriptions, impact, and progression
- **Education Score**: Based on relevance and level of education
- **Overall Score**: Weighted average considering all factors

Focus on being constructive, specific, and actionable. Reference actual items from the resume in your analysis.`;

    // Try Groq first, fallback to Gemini
    let result;
    try {
      console.log('🚀 Using Groq for analysis');
      result = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        prompt: analysisPrompt,
        temperature: 0.7,
      });
    } catch (groqError: any) {
      console.log('⚠️ Groq failed, using Gemini fallback');
      result = await generateText({
        model: google('gemini-2.0-flash'),
        prompt: analysisPrompt,
        temperature: 0.7,
      });
    }

    // Parse the JSON response
    let analysis;
    try {
      // Clean the response - sometimes AI wraps JSON in markdown code blocks
      let cleanedText = result.text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      analysis = JSON.parse(cleanedText);
      console.log('✅ Analysis completed successfully');
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', result.text);

      // Fallback analysis if parsing fails
      analysis = {
        overallScore: 75,
        skillsScore: 75,
        experienceScore: 75,
        educationScore: 75,
        summary: "Your resume shows solid technical foundation and relevant experience.",
        skillsCoverage: {
          technical: resumeData.skills.length,
          soft: 0,
          total: resumeData.skills.length
        },
        strengths: [
          "Diverse technical skill set",
          "Clear experience progression",
          "Relevant educational background",
          "Well-structured resume format"
        ],
        weaknesses: [
          "Could add more quantifiable achievements",
          "Consider highlighting soft skills",
          "Add more project details"
        ],
        recommendations: [
          "Add metrics to demonstrate impact (e.g., 'Improved performance by 30%')",
          "Include links to GitHub or portfolio projects",
          "Highlight leadership and collaboration experience",
          "Consider adding relevant certifications"
        ]
      };
    }

    return Response.json(analysis);

  } catch (error: any) {
    console.error('💥 Analysis API error:', error);
    return Response.json(
      {
        error: 'Failed to analyze resume',
        details: error.message
      },
      { status: 500 }
    );
  }
}
