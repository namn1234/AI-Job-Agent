import json
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.services.job_search import search_jobs
from backend.services.resume_generator import generate_tailored_resume
from fastapi.responses import StreamingResponse

from backend.services.resume_exporter import (
    generate_resume_pdf,
    generate_resume_docx,
)
from backend.services.database import (
    get_job_by_url,
    get_saved_jobs,
    get_notifications,
    get_unread_notification_count,
    mark_notification_read,
    mark_all_notifications_read,
    mark_job_applied,
    mark_job_rejected,
    save_resume,
    get_resume_by_job_url,
    get_all_resumes,
)

# --------------------------------------------------
# FastAPI app
# --------------------------------------------------

app = FastAPI(
    title="AI Job Agent",
    description="AI-powered job search and resume assistant",
    version="1.0.0",
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Paths
# --------------------------------------------------

PROFILE_PATH = (
    Path(__file__).parent
    / "data"
    / "profile.json"
)


# --------------------------------------------------
# Pydantic models
# --------------------------------------------------

class Profile(BaseModel):
    target_roles: list[str]
    locations: list[str]
    work_modes: list[str]
    experience_levels: list[str]
    skills: list[str]
    minimum_salary: int
    currency: str
    exclude_unpaid: bool
    search_frequency_hours: int
    minimum_match_score: int = 70


class ResumeSaveRequest(BaseModel):
    job_url: str
    resume: dict


# --------------------------------------------------
# Profile helper functions
# --------------------------------------------------

def load_profile():
    with open(
        PROFILE_PATH,
        "r",
        encoding="utf-8"
    ) as file:
        return json.load(file)


def save_profile(profile):
    with open(
        PROFILE_PATH,
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            profile,
            file,
            indent=2
        )


# --------------------------------------------------
# Home
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "AI Job Agent API is running"
    }


# --------------------------------------------------
# Health
# --------------------------------------------------

@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


# --------------------------------------------------
# Profile
# --------------------------------------------------

@app.get("/profile")
def get_profile():
    return load_profile()


@app.put("/profile")
def update_profile(
    profile: Profile
):
    profile_data = profile.model_dump()

    save_profile(
        profile_data
    )

    return {
        "message": "Profile updated successfully",
        "profile": profile_data
    }


# --------------------------------------------------
# Search jobs
# --------------------------------------------------

@app.get("/jobs")
def get_jobs():
    try:
        jobs = search_jobs()

        return {
            "total_jobs": len(jobs),
            "jobs": jobs
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Job search failed: {str(error)}"
        )


# --------------------------------------------------
# Saved jobs
# --------------------------------------------------

@app.get("/saved-jobs")
def saved_jobs():
    jobs = get_saved_jobs()

    return {
        "total_jobs": len(jobs),
        "jobs": jobs
    }


# --------------------------------------------------
# Individual job details
# --------------------------------------------------

@app.get("/job-details")
def job_details(
    url: str = Query(...)
):
    job = get_job_by_url(
        url
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    return job


# --------------------------------------------------
# Mark job applied
# --------------------------------------------------

@app.put("/jobs/mark-applied")
def mark_applied(
    url: str
):
    mark_job_applied(
        url
    )

    return {
        "message": "Job marked as applied"
    }


# --------------------------------------------------
# Reject job
# --------------------------------------------------

@app.put("/jobs/reject")
def reject_job(
    url: str
):
    mark_job_rejected(
        url
    )

    return {
        "message": "Job marked as rejected"
    }


# --------------------------------------------------
# Notifications
# --------------------------------------------------

@app.get("/notifications")
def notifications():
    data = get_notifications()

    return {
        "total": len(data),
        "unread":
            get_unread_notification_count(),
        "notifications": data
    }


@app.get(
    "/notifications/unread-count"
)
def unread_notification_count():
    return {
        "unread":
            get_unread_notification_count()
    }


@app.put(
    "/notifications/{notification_id}/read"
)
def read_notification(
    notification_id: str
):
    try:
        updated = mark_notification_read(
            notification_id
        )

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid notification ID"
        )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail=(
                "Notification not found "
                "or already read"
            )
        )

    return {
        "message":
            "Notification marked as read"
    }


@app.put(
    "/notifications/read-all"
)
def read_all_notifications():
    updated_count = (
        mark_all_notifications_read()
    )

    return {
        "message":
            "Notifications marked as read",
        "updated":
            updated_count
    }


# --------------------------------------------------
# Generate tailored resume
# --------------------------------------------------

@app.post(
    "/jobs/generate-resume"
)
def generate_resume(
    url: str
):
    job = get_job_by_url(
        url
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    try:
        resume = generate_tailored_resume(
            job
        )

        return {
            "message":
                "Resume generated successfully",
            "resume":
                resume
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Resume generation failed: "
                f"{str(error)}"
            )
        )


# --------------------------------------------------
# Save tailored resume
# --------------------------------------------------

@app.post("/resumes/save")
def save_resume_endpoint(
    data: ResumeSaveRequest
):
    try:
        save_resume(
            data.job_url,
            data.resume
        )

        return {
            "message":
                "Resume saved successfully"
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Resume save failed: "
                f"{str(error)}"
            )
        )


# --------------------------------------------------
# Get saved tailored resume
# --------------------------------------------------

@app.get("/resumes")
def get_resume(
    job_url: str
):
    resume = (
        get_resume_by_job_url(
            job_url
        )
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    return resume

@app.get("/resumes/download/pdf")
def download_resume_pdf(job_url: str):
    saved = get_resume_by_job_url(job_url)

    if not saved:
        raise HTTPException(
            status_code=404,
            detail="Saved resume not found"
        )

    resume = saved["resume"]

    pdf_buffer = generate_resume_pdf(
        resume
    )

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                'attachment; filename="tailored_resume.pdf"'
        }
    )


@app.get("/resumes/download/docx")
def download_resume_docx(job_url: str):
    saved = get_resume_by_job_url(job_url)

    if not saved:
        raise HTTPException(
            status_code=404,
            detail="Saved resume not found"
        )

    resume = saved["resume"]

    docx_buffer = generate_resume_docx(
        resume
    )

    return StreamingResponse(
        docx_buffer,
        media_type=(
            "application/"
            "vnd.openxmlformats-officedocument."
            "wordprocessingml.document"
        ),
        headers={
            "Content-Disposition":
                'attachment; filename="tailored_resume.docx"'
        }
    )
@app.get("/resumes/all")
def get_all_saved_resumes():
    resumes = get_all_resumes()

    return {
        "total_resumes": len(resumes),
        "resumes": resumes
    }