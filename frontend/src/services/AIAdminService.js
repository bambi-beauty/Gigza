const AI_SERVICE_URL = 'https://ai-admin-2.onrender.com';

export const assessDJApplication = async (application) => {
    try {
        const response = await fetch(`${AI_SERVICE_URL}/assess-application`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                application_id: application.application_id,
                dj_name: application.dj_name,
                dj_experience: application.dj_experience || "",
                dj_skills: application.dj_skills,
                primary_genre: application.primary_genre || "",
                price_per_hour: application.price_per_hour,
                has_verified_email: true
            })
        });
        if (!response.ok) throw new Error(`AI service returned ${response.status}`);
        
        const assessment = await response.json();
        console.log(`🤖 AI Assessment: ${assessment.status} (Score: ${assessment.score})`);
        return assessment;
    } catch (error) {
        console.error("AI service error:", error.message);
        return null;
    }
};