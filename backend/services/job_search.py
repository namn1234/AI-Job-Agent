import json
from pathlib import Path
import re

from importlib import import_module
from .job_sources.jooble_source import JoobleSource
from .job_sources.himalayas_source import HimalayasSource
from .llm_matcher import evaluate_job_with_llm
from .database import (
    get_job_by_url,
    save_job,
    create_notification
)

PROFILE_PATH = Path(__file__).parent.parent / "data" / "profile.json"


def _create_jsearch_source():
    """Create the optional JSearch source when it is installed."""
    try:
        module = import_module(
            f"{__package__}.job_sources.jsearch_source"
        )
        return module.JSearchSource()
    except (ImportError, AttributeError):
        return None


# --------------------------------------------------
# Load profile
# --------------------------------------------------

def load_profile():
    with open(PROFILE_PATH, "r", encoding="utf-8") as file:
        return json.load(file)


# --------------------------------------------------
# Role matching
# --------------------------------------------------

def normalize_text(text):
    text = text.lower()

    # Convert -, _, / etc. into spaces
    text = re.sub(r"[^a-z0-9+#.]+", " ", text)

    # Remove extra spaces
    text = " ".join(text.split())

    return text


def matches_role(job, target_roles):
    title = normalize_text(job.title)

    role_keywords = {
        "mern stack developer": [
            "mern",
            "mern stack",
            "react developer",
            "node developer",
            "full stack",
            "fullstack",
        ],

        "full stack developer": [
            "full stack",
            "fullstack",
            "full stack developer",
            "full stack engineer",
            "mern",
        ],

        "junior ai engineer": [
            "ai engineer",
            "ai developer",
            "artificial intelligence",
            "machine learning engineer",
            "ml engineer",
            "machine learning developer",
            "llm",
            "generative ai",
            "gen ai",
        ],
    }

    for role in target_roles:
        normalized_role = normalize_text(role)

        # Direct normalized match
        if normalized_role in title:
            return True

        keywords = role_keywords.get(
            normalized_role,
            []
        )

        for keyword in keywords:
            normalized_keyword = normalize_text(
                keyword
            )

            if normalized_keyword in title:
                return True

    return False


# --------------------------------------------------
# Location matching
# --------------------------------------------------

def matches_location(job, locations):
    job_location = job.location.lower()
    job_work_mode = job.work_mode.lower()

    # Remote jobs are acceptable
    if (
        job_work_mode == "remote"
        or "remote" in job_location
    ):
        return True

    for location in locations:
        if location.lower() in job_location:
            return True

    return False


# --------------------------------------------------
# Experience matching
# --------------------------------------------------

def matches_experience(job, experience_levels):
    job_experience = (job.experience or "").lower()

    job_text = (
        f"{job.title} "
        f"{job.description}"
    ).lower()

    # --------------------------------------------------
    # Reject senior / lead titles first
    # --------------------------------------------------

    senior_title_keywords = [
        "senior",
        "sr ",
        "sr.",
        "staff",
        "principal",
        "lead",
        "founding engineer",
        "architect",
        "manager",
        "head of",
        "director",
    ]

    title_lower = job.title.lower()

    for keyword in senior_title_keywords:
        if keyword in title_lower:
            return False


    # --------------------------------------------------
    # Reject jobs requiring too many years
    # --------------------------------------------------

    year_patterns = [
        r"(\d+)\+\s*years",
        r"(\d+)\s+years",
        r"minimum\s+of\s+(\d+)\s+years",
        r"at\s+least\s+(\d+)\s+years",
    ]

    for pattern in year_patterns:
        matches = re.findall(
            pattern,
            job_text
        )

        for match in matches:
            try:
                years = int(match)

                # For your current junior/fresh profile,
                # reject jobs asking for 3+ years.
                if years >= 3:
                    return False

            except ValueError:
                pass


    # --------------------------------------------------
    # Accept explicit profile experience matches
    # --------------------------------------------------

    for level in experience_levels:
        if level.lower() in job_experience:
            return True


    # --------------------------------------------------
    # Detect junior-friendly wording
    # --------------------------------------------------

    junior_keywords = [
        "intern",
        "internship",
        "fresh graduate",
        "fresh graduates",
        "entry level",
        "entry-level",
        "junior",
        "graduate",
        "new graduate",
        "trainee",
        "0-1 years",
        "0–1 years",
        "0 to 1 year",
        "1 year experience",
        "1+ year",
        "1+ years",
        "2 years experience",
        "2+ years",
    ]

    for keyword in junior_keywords:
        if keyword in job_text:
            return True


    # --------------------------------------------------
    # Unknown experience
    # --------------------------------------------------

    if job_experience in [
        "",
        "unknown",
        "not specified",
        "not provided",
    ]:
        return True

    return False

# --------------------------------------------------
# Salary matching
# --------------------------------------------------

def matches_salary(
    job,
    minimum_salary
):
    if job.salary is None:
        return True

    if job.currency.upper() == "PKR":
        return job.salary >= minimum_salary

    # Different currencies are accepted for now
    return True


# --------------------------------------------------
# Rule-based match score
# --------------------------------------------------

def calculate_match_score(
    job,
    profile
):
    user_skills = {
        skill.lower()
        for skill in profile["skills"]
    }

    job_skills = {
        skill.lower()
        for skill in job.skills
    }

    # Some APIs do not provide structured skills
    if not job_skills:
        job_text = (
            f"{job.title} "
            f"{job.description}"
        ).lower()

        detected_skills = set()

        for skill in profile["skills"]:
            skill_lower = skill.lower()

            if skill_lower in job_text:
                detected_skills.add(
                    skill_lower
                )

        job_skills = detected_skills

    matching_skills = (
        user_skills.intersection(
            job_skills
        )
    )

    missing_skills = (
        job_skills - user_skills
    )

    if not job_skills:
        skill_score = 0

    else:
        skill_score = (
            len(matching_skills)
            / len(job_skills)
        ) * 100

    role_score = (
        100
        if matches_role(
            job,
            profile["target_roles"]
        )
        else 0
    )

    location_score = (
        100
        if matches_location(
            job,
            profile["locations"]
        )
        else 0
    )

    experience_score = (
        100
        if matches_experience(
            job,
            profile["experience_levels"]
        )
        else 0
    )

    final_score = (
        skill_score * 0.50
        + role_score * 0.25
        + experience_score * 0.15
        + location_score * 0.10
    )

    return {
        "match_score": round(
            final_score
        ),

        "matching_skills": sorted(
            matching_skills
        ),

        "missing_skills": sorted(
            missing_skills
        )
    }


# --------------------------------------------------
# Remove duplicates
# --------------------------------------------------

def remove_duplicates(jobs):
    unique_jobs = []
    seen = set()

    for job in jobs:
        url = (
            job.get("url", "")
            .lower()
            .strip()
        )

        title = (
            job.get("title", "")
            .lower()
            .strip()
        )

        company = (
            job.get("company", "")
            .lower()
            .strip()
        )

        # Prefer URL when available
        if url:
            job_key = url
        else:
            # Fallback if source gives no URL
            job_key = f"{title}|{company}"

        if job_key not in seen:
            seen.add(job_key)
            unique_jobs.append(job)

    return unique_jobs

# --------------------------------------------------
# Add fallback AI values
# --------------------------------------------------

def add_ai_fallback(
    job_data,
    rule_match
):
    job_data["ai_match_score"] = (
        rule_match["match_score"]
    )

    job_data["ai_recommendation"] = (
        "Maybe"
    )

    job_data["ai_reasons"] = [
        "AI evaluation was unavailable. "
        "Rule-based score was used."
    ]

    job_data["ai_matching_skills"] = (
        rule_match["matching_skills"]
    )

    job_data["ai_missing_skills"] = (
        rule_match["missing_skills"]
    )

    job_data["experience_warning"] = (
        "AI evaluation unavailable."
    )


# --------------------------------------------------
# Main job search
# --------------------------------------------------

def search_jobs():
    profile = load_profile()
    MIN_MATCH_SCORE = profile.get(
    "minimum_match_score",
    70
)

    pakistan_source = JoobleSource()

    himalayas_source = (
        HimalayasSource()
    )

    all_jobs = []

    # --------------------------------------------------
    # Search each target role
    # --------------------------------------------------

    for role in profile["target_roles"]:

        # Pakistan source
        if pakistan_source is not None:
            try:
                pakistan_jobs = (
                    pakistan_source.search(
                        role
                    )
                )

                all_jobs.extend(
                    pakistan_jobs
                )

            except Exception as error:
                print(
                    f"Pakistan source error "
                    f"for '{role}': "
                    f"{error}"
                )

        # Himalayas source
        try:
            himalayas_jobs = (
                himalayas_source.search(
                    role
                )
            )

            all_jobs.extend(
                himalayas_jobs
            )

        except Exception as error:
            print(
                f"Himalayas source error "
                f"for '{role}': "
                f"{error}"
            )

    matching_jobs = []

    # --------------------------------------------------
    # Filter jobs
    # --------------------------------------------------

    for job in all_jobs:

        if not matches_role(
            job,
            profile["target_roles"]
        ):
            continue

        if not matches_location(
            job,
            profile["locations"]
        ):
            continue

        if not matches_experience(
            job,
            profile[
                "experience_levels"
            ]
        ):
            continue

        if not matches_salary(
            job,
            profile[
                "minimum_salary"
            ]
        ):
            continue

        # --------------------------------------------------
        # Check MongoDB first
        # --------------------------------------------------

        existing_job = get_job_by_url(
            job.url
        )

        if existing_job:
            matching_jobs.append(
                existing_job
            )

            continue

        # --------------------------------------------------
        # Rule-based evaluation
        # --------------------------------------------------

        rule_match = (
            calculate_match_score(
                job,
                profile
            )
        )

        job_data = job.model_dump()

        job_data[
            "rule_match_score"
        ] = rule_match[
            "match_score"
        ]

        job_data[
            "rule_matching_skills"
        ] = rule_match[
            "matching_skills"
        ]

        job_data[
            "rule_missing_skills"
        ] = rule_match[
            "missing_skills"
        ]

        # --------------------------------------------------
        # Gemini evaluation
        # --------------------------------------------------

        try:
            ai_match = (
                evaluate_job_with_llm(
                    job,
                    profile
                )
            )

            ai_score = ai_match.get(
                "match_score",
                0
            )

            # If Gemini failed/quota exhausted,
            # use rule-based fallback.
            if ai_score == 0:
                add_ai_fallback(
                    job_data,
                    rule_match
                )

            else:
                job_data[
                    "ai_match_score"
                ] = ai_score

                job_data[
                    "ai_recommendation"
                ] = ai_match.get(
                    "recommendation",
                    "Maybe"
                )

                job_data[
                    "ai_reasons"
                ] = ai_match.get(
                    "why_match",
                    []
                )

                job_data[
                    "ai_matching_skills"
                ] = ai_match.get(
                    "matching_skills",
                    []
                )

                job_data[
                    "ai_missing_skills"
                ] = ai_match.get(
                    "missing_skills",
                    []
                )

                job_data[
                    "experience_warning"
                ] = ai_match.get(
                    "experience_warning",
                    ""
                )

        except Exception as error:
            print(
                f"Gemini failed for "
                f"{job.title}: "
                f"{error}"
            )

            add_ai_fallback(
                job_data,
                rule_match
            )

        # --------------------------------------------------
        # Save new job in MongoDB
        # --------------------------------------------------

        try:
            saved = save_job(job_data)

            if saved:
                create_notification(job_data)
                print(
                    f"Saved new job and created notification: "
                    f"{job.title}"
                )

        except Exception as error:
            print(
                f"Database save failed "
                f"for {job.title}: "
                f"{error}"
            )

        matching_jobs.append(
            job_data
        )

    # --------------------------------------------------
    # Remove duplicates
    # --------------------------------------------------

        MIN_MATCH_SCORE = profile.get(
    "minimum_match_score",
    70
)
    unique_jobs = remove_duplicates(
        matching_jobs
    )

    filtered_by_score = []

    for job in unique_jobs:
        final_score = (
            job.get("ai_match_score")
            if job.get("ai_match_score") is not None
            else job.get("rule_match_score", 0)
        )

        if final_score >= MIN_MATCH_SCORE:
            filtered_by_score.append(job)

    filtered_by_score.sort(
        key=lambda job: (
            job.get("ai_match_score")
            if job.get("ai_match_score") is not None
            else job.get("rule_match_score", 0)
        ),
        reverse=True
    )

    return filtered_by_score