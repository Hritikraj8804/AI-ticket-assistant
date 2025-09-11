const analyzeTicket = async (ticket) => {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze this support ticket and return ONLY valid JSON:

Title: "${ticket.title}"
Description: "${ticket.description}"

Return JSON format:
{
  "summary": "brief summary",
  "priority": "low|medium|high",
  "helpfulNotes": "solution guidance",
  "relatedSkills": ["skill1", "skill2"]
}

Rules:
- If it's a critical system issue, database problem, or security issue: priority = "high"
- If it's a bug or feature request: priority = "medium" 
- If it's a question or minor issue: priority = "low"
- Skills should match: React, Node.js, JavaScript, Python, MongoDB, PostgreSQL, AWS, Docker, UI/UX, Mobile, DevOps, Security, Java, PHP, Vue.js, Angular, TypeScript, Redis, Kubernetes

Return ONLY the JSON object, no other text:`
          }]
        }]
      })
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    console.log('🤖 Raw AI Response:', text);
    
    // Extract JSON from response
    let jsonString = text.trim();
    const jsonStart = jsonString.indexOf('{');
    const jsonEnd = jsonString.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
    }
    
    const parsed = JSON.parse(jsonString);
    console.log('✅ Parsed AI Analysis:', parsed);
    return parsed;
    
  } catch (error) {
    console.log('❌ AI Analysis failed:', error.message);
    
    // Simple rule-based fallback
    const title = ticket.title.toLowerCase();
    const desc = ticket.description.toLowerCase();
    
    let priority = "medium";
    let skills = ["General"];
    
    // Priority rules
    if (title.includes('critical') || title.includes('down') || title.includes('crash') || 
        desc.includes('timeout') || desc.includes('error') || desc.includes('fail')) {
      priority = "high";
    } else if (title.includes('question') || title.includes('how to')) {
      priority = "low";
    }
    
    // Skill detection
    if (title.includes('react') || desc.includes('react')) skills = ["React", "JavaScript"];
    else if (title.includes('database') || desc.includes('mongodb') || desc.includes('sql')) skills = ["MongoDB", "PostgreSQL"];
    else if (title.includes('node') || desc.includes('node')) skills = ["Node.js", "JavaScript"];
    else if (title.includes('mobile') || desc.includes('ios') || desc.includes('android')) skills = ["Mobile"];
    
    return {
      summary: `Issue with ${ticket.title}`,
      priority,
      helpfulNotes: "Please review the ticket details and investigate the reported issue.",
      relatedSkills: skills
    };
  }
};

export default analyzeTicket;