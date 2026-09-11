import os
import requests

from dotenv import load_dotenv

from .base_source import JobSource
from .job_model import Job


load_dotenv()

JOOBLE_API_KEY = os.getenv("JOOBLE_API_KEY")


class JoobleSource(JobSource):

    def __init__(self):
        if not JOOBLE_API_KEY:
            raise ValueError(
                "JOOBLE_API_KEY was not found in .env"
            )

        self.api_url = (
            f"https://pk.jooble.org/api/"
            f"{JOOBLE_API_KEY}"
        )


    def search(self, query: str) -> list[Job]:

        payload = {
            "keywords": query,
            "location": "Pakistan",
            "page": 1,
            "ResultOnPage": 20,
            "companysearch": False
        }

        response = requests.post(
            self.api_url,
            json=payload,
            timeout=20
        )

        response.raise_for_status()

        data = response.json()

        jobs = []

        for item in data.get("jobs", []):

            jobs.append(
                Job(
                    id=f"jooble-{item.get('id')}",

                    title=item.get(
                        "title",
                        ""
                    ),

                    company=item.get(
                        "company",
                        "Unknown Company"
                    ),

                    location=item.get(
                        "location",
                        "Pakistan"
                    ),

                    work_mode=self.detect_work_mode(
                        item
                    ),

                    experience="Unknown",

                    salary=None,

                    currency="PKR",

                    skills=[],

                    description=item.get(
                        "snippet",
                        ""
                    ),

                    url=item.get(
                        "link",
                        ""
                    ),

                    source="Jooble"
                )
            )

        return jobs


    def detect_work_mode(self, item):

        text = (
            f"{item.get('title', '')} "
            f"{item.get('snippet', '')} "
            f"{item.get('location', '')}"
        ).lower()

        if "remote" in text:
            return "Remote"

        if "hybrid" in text:
            return "Hybrid"

        return "On-site"


# --------------------------------------------------
# Test
# --------------------------------------------------

if __name__ == "__main__":

    source = JoobleSource()

    jobs = source.search(
        "Software Developer"
    )

    print(
        f"Found {len(jobs)} jobs"
    )

    for job in jobs[:10]:

        print(
            "\n-------------------------"
        )

        print(
            "Title:",
            job.title
        )

        print(
            "Company:",
            job.company
        )

        print(
            "Location:",
            job.location
        )

        print(
            "Work mode:",
            job.work_mode
        )

        print(
            "URL:",
            job.url
        )