import time
import json
import os

from dotenv import load_dotenv
from google import genai


# --------------------------------------------------
# Load environment variables
# --------------------------------------------------

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError(
        "GEMINI_API_KEY was not found in the .env file."
    )


# --------------------------------------------------
# Gemini client
# --------------------------------------------------

client = genai.Client(api_key=api_key)

MODEL_NAME = "gemini-3.6-flash"


# --------------------------------------------------
# Clean Gemini JSON response
# --------------------------------------------------

def clean_json_response(text: str) -> str:
    text = text.strip()

    if text.startswith("```json"):
        text = text[len("```json"):]

    elif text.startswith("```"):
        text = text[len("```"):]

    if text.endswith("```"):
        text = text[:-3]

    return text.strip()


# --------------------------------------------------
# Evaluate one job using Gemini
# --------------------------------------------------

def evaluate_job_with_llm(job, profile):

    prompt = f"""
You are an AI job matching assistant.

Your task is to evaluate whether the following job
is suitable for the candidate.

Use ONLY the information provided below.

Do not invent facts.


==============================
CANDIDATE PROFILE
==============================

Target roles:
{profile["target_roles"]}

Candidate skills:
{profile["skills"]}

Candidate experience levels:
{profile["experience_levels"]}

Preferred locations:
{profile["locations"]}

Allowed work modes:
{profile.get("work_modes", [])}

Minimum salary:
{profile["minimum_salary"]} {profile["currency"]}


==============================
JOB INFORMATION
==============================

Title:
{job.title}

Company:
{job.company}

Location:
{job.location}

Work mode:
{job.work_mode}

Experience:
{job.experience}

Salary:
{job.salary}

Currency:
{job.currency}

Explicit job skills:
{job.skills}

Job description:
{job.description}


==============================
RULES
==============================

1. Never invent candidate skills.

2. Never invent candidate experience.

3. Never invent job requirements.

4. "matching_skills" may contain ONLY skills that:
   - appear in the candidate profile
   AND
   - are explicitly present in the job's structured skills,
     title, or job description.

5. Do NOT assume technologies only because of the job title.

Examples:
- Do NOT assume Express just because the title says MERN.
- Do NOT assume MongoDB just because the title says Full Stack.
- Do NOT assume Machine Learning just because the title says AI Engineer.

6. "missing_skills" should contain skills or technologies that
   are explicitly required by the job but are not in the
   candidate's skill list.

7. Strongly penalize jobs that clearly require senior-level
   experience.

Examples:
- Senior
- Staff
- Principal
- Lead
- 5+ years
- 7+ years
- 10+ years

8. If salary is missing, do not automatically penalize the job.

9. Consider whether the location and work mode are suitable.

10. Consider whether the role matches one of the candidate's
    target roles.

11. Recommend exactly one of:

"Apply"
"Maybe"
"Skip"

Use:
- "Apply" for strong and realistic matches.
- "Maybe" for partial matches or unclear requirements.
- "Skip" for poor matches or clearly senior-level jobs.

12. match_score must be an integer between 0 and 100.

13. Base all reasoning only on the information supplied.


==============================
OUTPUT FORMAT
==============================

Return ONLY valid JSON.

Do not include markdown.
Do not include ```json.
Do not include any explanation outside the JSON.

Use exactly this structure:

{{
    "match_score": 0,
    "recommendation": "Apply",
    "why_match": [],
    "matching_skills": [],
    "missing_skills": [],
    "experience_warning": ""
}}
"""

    try:
        response = None
        last_error = None

        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model=MODEL_NAME,
                    contents=prompt
                )
                break

            except Exception as error:
                last_error = error

                print(
                    f"Gemini attempt {attempt + 1} failed "
                    f"for {job.title}: {error}"
                )

                if attempt < 2:
                    time.sleep(10)

        if response is None:
            if last_error is not None:
                raise last_error
            raise RuntimeError("Gemini did not return a response.")

        if not response.text:
            raise ValueError(
                "Gemini returned an empty response."
            )

        cleaned_text = clean_json_response(
            response.text
        )

        result = json.loads(cleaned_text)

        return validate_llm_result(result)

    except json.JSONDecodeError as error:
        print(
            f"Gemini JSON error for {job.title}: {error}"
        )

        return fallback_result(
            "Gemini returned invalid JSON."
        )

    except Exception as error:
        print(
            f"Gemini evaluation error for "
            f"{job.title}: {error}"
        )

        return {
            "match_score": 0,
            "recommendation": "Maybe",
            "why_match": [],
            "matching_skills": [],
            "missing_skills": [],
            "experience_warning": f"Gemini error: {str(error)}"
        }


# --------------------------------------------------
# Validate Gemini output
# --------------------------------------------------

def validate_llm_result(result):

    valid_recommendations = {
        "Apply",
        "Maybe",
        "Skip"
    }

    match_score = result.get(
        "match_score",
        0
    )

    try:
        match_score = int(match_score)

    except (TypeError, ValueError):
        match_score = 0

    match_score = max(
        0,
        min(100, match_score)
    )

    recommendation = result.get(
        "recommendation",
        "Maybe"
    )

    if recommendation not in valid_recommendations:
        recommendation = "Maybe"

    why_match = result.get(
        "why_match",
        []
    )

    matching_skills = result.get(
        "matching_skills",
        []
    )

    missing_skills = result.get(
        "missing_skills",
        []
    )

    experience_warning = result.get(
        "experience_warning",
        ""
    )

    if not isinstance(why_match, list):
        why_match = []

    if not isinstance(matching_skills, list):
        matching_skills = []

    if not isinstance(missing_skills, list):
        missing_skills = []

    if not isinstance(experience_warning, str):
        experience_warning = str(
            experience_warning
        )

    return {
        "match_score": match_score,
        "recommendation": recommendation,
        "why_match": why_match,
        "matching_skills": matching_skills,
        "missing_skills": missing_skills,
        "experience_warning": experience_warning
    }


# --------------------------------------------------
# Fallback result
# --------------------------------------------------

def fallback_result(message):

    return {
        "match_score": 0,
        "recommendation": "Maybe",
        "why_match": [],
        "matching_skills": [],
        "missing_skills": [],
        "experience_warning": message
    }


# --------------------------------------------------
# Local test
# --------------------------------------------------

if __name__ == "__main__":

    from .job_sources.pakistan_source import (
        PakistanSampleSource
    )

    profile = {
        "target_roles": [
            "MERN Stack Developer",
            "Full Stack Developer",
            "Junior AI Engineer"
        ],

        "skills": [
            "JavaScript",
            "React",
            "Node.js",
            "Express",
            "MongoDB",
            "Python",
            "Flask",
            "AI",
            "LLM"
        ],

        "experience_levels": [
            "Internship",
            "Fresh Graduate",
            "Junior"
        ],

        "locations": [
            "Pakistan",
            "Islamabad",
            "Rawalpindi",
            "Lahore",
            "Karachi",
            "Peshawar"
        ],

        "work_modes": [
            "On-site",
            "Remote",
            "Hybrid"
        ],

        "minimum_salary": 60000,

        "currency": "PKR"
    }

    source = PakistanSampleSource()

    jobs = source.search("MERN")

    if not jobs:
        print("No test jobs found.")

    else:
        result = evaluate_job_with_llm(
            jobs[0],
            profile
        )

        print(
            json.dumps(
                result,
                indent=2
            )
        )