import json
from pathlib import Path

from google import genai
import os

from dotenv import load_dotenv
import time
import random


load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError(
        "GEMINI_API_KEY was not found in .env"
    )


client = genai.Client(
    api_key=GEMINI_API_KEY
)

MODEL_NAME = "gemini-3.6-flash"


RESUME_PROFILE_PATH = (
    Path(__file__).parent.parent
    / "data"
    / "resume_profile.json"
)


def load_resume_profile():
    with open(
        RESUME_PROFILE_PATH,
        "r",
        encoding="utf-8"
    ) as file:
        return json.load(file)


def clean_json_response(text):
    text = text.strip()

    if text.startswith("```json"):
        text = text[len("```json"):]

    elif text.startswith("```"):
        text = text[len("```"):]

    if text.endswith("```"):
        text = text[:-3]

    return text.strip()


def generate_tailored_resume(job):

    profile = load_resume_profile()

    prompt = f"""
You are an ATS resume tailoring assistant.

Your task is to tailor the candidate's resume
for the provided job.

IMPORTANT RULES:

1. Never invent experience.
2. Never invent skills.
3. Never invent projects.
4. Never add technologies the candidate has not used.
5. Only emphasize relevant information.
6. Improve wording using job-description terminology
   when truthful.
7. Keep the resume suitable for a fresh graduate
   or junior-level candidate.
8. Do not claim years of experience unless explicitly
   provided.
9. Keep project descriptions concise and ATS-friendly.


==============================
CANDIDATE PROFILE
==============================

{json.dumps(profile, indent=2)}


==============================
JOB
==============================

Title:
{job["title"]}

Company:
{job["company"]}

Location:
{job["location"]}

Description:
{job["description"]}

Required skills:
{job.get("skills", [])}


==============================
OUTPUT
==============================

Return ONLY valid JSON.

Use this exact structure:

{{
  "target_job_title": "",
  "professional_summary": "",
  "skills": [],
  "projects": [
    {{
      "name": "",
      "technologies": [],
      "bullet_points": []
    }}
  ],
  "education": [],
  "certifications": [],
  "ats_keywords": []
}}
"""

    response = None
    last_error = None

    for attempt in range(4):
        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt
            )

            break

        except Exception as error:
            last_error = error

            error_text = str(error)

            # Retry only temporary errors
            if (
                "503" not in error_text
                and "UNAVAILABLE" not in error_text
                and "429" not in error_text
            ):
                raise

            # 2s, 4s, 8s...
            wait_time = (
                2 ** (attempt + 1)
            ) + random.uniform(0, 1)

            print(
                f"Gemini resume attempt "
                f"{attempt + 1} failed: {error}"
            )

            if attempt < 3:
                time.sleep(wait_time)

    if response is None:
        if last_error is not None:
            raise last_error
        raise RuntimeError("Gemini did not return a response.")

    if not response.text:
        raise ValueError(
            "Gemini returned an empty response."
        )

    cleaned = clean_json_response(
        response.text
    )

    return json.loads(cleaned)