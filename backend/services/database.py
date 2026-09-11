import os

from datetime import datetime, timezone
from bson import ObjectId
from dotenv import load_dotenv
from pymongo import MongoClient


load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    raise ValueError(
        "MONGODB_URI was not found in .env"
    )


client = MongoClient(MONGODB_URI)

database = client["ai_job_agent"]

jobs_collection = database["jobs"]
notifications_collection = database["notifications"]
resumes_collection = database["resumes"]


# --------------------------------------------------
# Job functions
# --------------------------------------------------
def get_all_resumes():
    resumes = list(
        resumes_collection.find(
            {},
            {"_id": 0}
        )
    )

    return resumes

def get_job_by_url(url):
    return jobs_collection.find_one(
        {"url": url},
        {"_id": 0}
    )


def job_exists(url):
    return get_job_by_url(url) is not None


def save_job(job):
    if job_exists(job["url"]):
        return False

    job["notified"] = False
    job["applied"] = False
    job["rejected"] = False

    jobs_collection.insert_one(job)

    return True


def get_saved_jobs():
    return list(
        jobs_collection.find(
            {},
            {"_id": 0}
        )
    )


def mark_job_notified(job_url):
    jobs_collection.update_one(
        {"url": job_url},
        {
            "$set": {
                "notified": True
            }
        }
    )


def mark_job_applied(job_url):
    jobs_collection.update_one(
        {"url": job_url},
        {
            "$set": {
                "applied": True,
                "rejected": False
            }
        }
    )


def mark_job_rejected(job_url):
    jobs_collection.update_one(
        {"url": job_url},
        {
            "$set": {
                "rejected": True,
                "applied": False
            }
        }
    )


# --------------------------------------------------
# Notification functions
# --------------------------------------------------

def create_notification(job):
    notification = {
        "job_url": job["url"],
        "job_id": job["id"],
        "title": job["title"],
        "company": job["company"],
        "location": job["location"],
        "work_mode": job["work_mode"],
        "match_score": job.get(
            "ai_match_score",
            job.get("rule_match_score", 0)
        ),
        "recommendation": job.get(
            "ai_recommendation",
            "Maybe"
        ),
        "message": (
            f"New job match: {job['title']} "
            f"at {job['company']}"
        ),
        "read": False,
        "created_at": datetime.now(timezone.utc)
    }

    notifications_collection.insert_one(
        notification
    )

    return True


def get_notifications():
    notifications = list(
        notifications_collection.find()
        .sort("created_at", -1)
    )

    for notification in notifications:
        notification["_id"] = str(
            notification["_id"]
        )

    return notifications


def get_unread_notification_count():
    return notifications_collection.count_documents(
        {
            "read": False
        }
    )


def mark_notification_read(notification_id):
    result = notifications_collection.update_one(
        {
            "_id": ObjectId(notification_id)
        },
        {
            "$set": {
                "read": True
            }
        }
    )

    return result.modified_count > 0


def mark_all_notifications_read():
    result = notifications_collection.update_many(
        {
            "read": False
        },
        {
            "$set": {
                "read": True
            }
        }
    )

    return result.modified_count


# --------------------------------------------------
# Resume functions
# --------------------------------------------------

def save_resume(job_url, resume):
    document = {
        "job_url": job_url,
        "resume": resume,
        "updated_at": datetime.now(timezone.utc)
    }

    resumes_collection.update_one(
        {
            "job_url": job_url
        },
        {
            "$set": document
        },
        upsert=True
    )

    return True


def get_resume_by_job_url(job_url):
    return resumes_collection.find_one(
        {
            "job_url": job_url
        },
        {
            "_id": 0
        }
    )


# --------------------------------------------------
# Connection test
# --------------------------------------------------

if __name__ == "__main__":
    try:
        print(
            client.list_database_names()
        )

        print(
            "MongoDB connected successfully."
        )

    except Exception as error:
        print(
            "MongoDB connection failed:"
        )

        print(error)