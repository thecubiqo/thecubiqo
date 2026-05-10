import { cleanEnv } from './supabase-admin';

type TailoringInput = {
  jobTitle: string;
  jobCompany: string;
  jobDescription: string;
  profileRoles: string[];
  profileSkills: string[];
  profileExperience?: string;
  baseResume?: string;
};

type TailoringOutput = {
  score: number;
  scoreSummary: string;
  tailoredResumeSummary: string;
  coverLetter: string;
  tailoringSource: 'llm' | 'local';
};

function localFallback(input: TailoringInput): TailoringOutput {
  const matchedSkills = input.profileSkills.filter(s =>
    input.jobDescription.toLowerCase().includes(s.toLowerCase())
  );
  const score = Math.min(100, 40 + matchedSkills.length * 5);
  return {
    score,
    scoreSummary: `Matched ${matchedSkills.length} skills: ${matchedSkills.slice(0, 5).join(', ') || 'none detected'}.`,
    tailoredResumeSummary: [
      input.profileRoles.length ? `Experienced ${input.profileRoles[0]}` : 'Experienced professional',
      `with skills in ${input.profileSkills.slice(0, 4).join(', ')}.`,
      input.profileExperience ? input.profileExperience.slice(0, 200) : ''
    ].filter(Boolean).join(' '),
    coverLetter: [
      `Dear Hiring Team at ${input.jobCompany},`,
      '',
      `I am excited to apply for the ${input.jobTitle} role. My background in ${input.profileRoles.slice(0, 2).join(' and ')} aligns well with this opportunity.`,
      '',
      `My key skills include ${input.profileSkills.slice(0, 5).join(', ')}, which I believe directly support your team's needs.`,
      '',
      'I look forward to discussing how I can contribute.',
      '',
      'Best regards'
    ].join('\n'),
    tailoringSource: 'local'
  };
}

export async function tailorApplicationForJob(input: TailoringInput): Promise<TailoringOutput> {
  const openaiKey = cleanEnv(process.env.OPENAI_API_KEY);
  if (!openaiKey) return localFallback(input);

  const model = cleanEnv(process.env.OPENAI_MODEL) || 'gpt-4o-mini';

  const prompt = `You are an expert career coach. Given a job listing and a candidate profile, do three things:

1. Score the fit 0-100 and give a one-sentence summary of why.
2. Write a tailored resume summary (3-4 sentences) that highlights the most relevant experience and skills for THIS role.
3. Write a professional cover letter (4 short paragraphs) addressed to the company. Do not use placeholders.

Return valid JSON with keys: score (number), scoreSummary (string), tailoredResumeSummary (string), coverLetter (string).

Job:
- Title: ${input.jobTitle}
- Company: ${input.jobCompany}
- Description: ${input.jobDescription.slice(0, 1200)}

Candidate:
- Target roles: ${input.profileRoles.join(', ')}
- Skills: ${input.profileSkills.join(', ')}
- Experience summary: ${(input.profileExperience || 'Not provided').slice(0, 600)}
- Base resume excerpt: ${(input.baseResume || 'Not provided').slice(0, 800)}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    });

    if (!res.ok) return localFallback(input);
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    return {
      score: Math.max(0, Math.min(100, Number(parsed.score) || 50)),
      scoreSummary: String(parsed.scoreSummary || '').slice(0, 300),
      tailoredResumeSummary: String(parsed.tailoredResumeSummary || '').slice(0, 3000),
      coverLetter: String(parsed.coverLetter || '').slice(0, 6000),
      tailoringSource: 'llm'
    };
  } catch {
    return localFallback(input);
  }
}
