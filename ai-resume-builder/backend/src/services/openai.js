const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder'
});

async function generateCVContent(userProfile, jobDescription) {
  const { user, employmentHistory, education, certifications, skills, additionalInfo } = userProfile;

  const systemPrompt = `You are a professional resume/CV writer. Your task is to generate a tailored, ATS-friendly resume based on the candidate's profile and the job description provided.

IMPORTANT GUIDELINES:
1. Tailor the resume to match the job requirements
2. Use action verbs and quantifiable achievements
3. Keep it concise and professional
4. Highlight relevant skills and experiences
5. Use keywords from the job description naturally
6. Format experience descriptions with bullet points
7. Do NOT fabricate information - only use what's provided

OUTPUT FORMAT (JSON):
{
  "summary": "Professional summary tailored to the job (2-3 sentences)",
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "position": "Job Title",
      "company": "Company Name",
      "location": "City, State",
      "period": "Start - End",
      "achievements": ["Achievement 1 with metrics", "Achievement 2", ...]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "School Name",
      "graduation": "Year",
      "details": "Optional details"
    }
  ],
  "certifications": ["Cert 1", "Cert 2"],
  "additionalSections": [
    {
      "title": "Section Title",
      "content": "Content"
    }
  ]
}`;

  const userPrompt = `Generate a tailored resume for the following candidate applying to this job:

## CANDIDATE PROFILE

**Name:** ${user.full_name}
**Email:** ${user.email}
**Phone:** ${user.phone_number || 'N/A'}
**Location:** ${user.address || 'N/A'}
**LinkedIn:** ${user.linkedin_profile || 'N/A'}
**GitHub:** ${user.github_link || 'N/A'}
**Years of Experience:** ${user.experience_years || 0}

### Employment History
${employmentHistory.map(job => `
- **${job.position}** at **${job.company}**
  Location: ${job.location || 'N/A'}
  Period: ${job.start_date || ''} - ${job.end_date || 'Present'}
  ${job.description ? `Description: ${job.description}` : ''}
`).join('\n')}

### Education
${education.map(edu => `
- **${edu.degree}** - ${edu.institution}
  Location: ${edu.location || 'N/A'}
  Graduation: ${edu.graduation_date || 'N/A'}
  ${edu.gpa ? `GPA: ${edu.gpa}` : ''}
`).join('\n')}

### Certifications
${certifications.map(cert => `- ${cert.name}${cert.issuer ? ` (${cert.issuer})` : ''} - ${cert.date_obtained || 'N/A'}`).join('\n')}

### Skills
${skills.map(s => s.skill_name).join(', ')}

### Additional Information
${additionalInfo.map(info => `- ${info.category}: ${info.content}`).join('\n')}

---

## JOB DESCRIPTION

${jobDescription}

---

Generate a professional, tailored resume in the JSON format specified. Focus on making the candidate's experience relevant to this specific job.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2500,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate CV content');
  }
}

async function extractJobDetails(jdContent) {
  const systemPrompt = `Extract the job title and company name from the following job description. Return as JSON: {"jobTitle": "...", "companyName": "..."}. If not found, use "Not specified".`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: jdContent.substring(0, 2000) }
      ],
      temperature: 0,
      max_tokens: 100,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Job details extraction error:', error);
    return { jobTitle: 'Not specified', companyName: 'Not specified' };
  }
}

module.exports = { generateCVContent, extractJobDetails };
