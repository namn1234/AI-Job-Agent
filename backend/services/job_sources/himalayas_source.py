import requests

from .base_source import JobSource
from .job_model import Job


class HimalayasSource(JobSource):

    API_URL = "https://himalayas.app/jobs/api"

    def search(self, query: str) -> list[Job]:
        response = requests.get(
            self.API_URL,
            params={
                "q": query
            },
            timeout=20
        )

        response.raise_for_status()

        data = response.json()

        jobs = []

        for item in data.get("jobs", []):
            title = item.get("title", "")
            company = item.get("companyName", "Unknown Company")
            location = item.get("location", "Remote")
            description = item.get("description", "")
            url = item.get("applicationLink", "")

            if not url:
                url = item.get("url", "")

            jobs.append(
                Job(
                    id=f"himalayas-{item.get('id', title)}",
                    title=title,
                    company=company,
                    location=location,
                    work_mode="Remote",
                    experience="Unknown",
                    salary=None,
                    currency="USD",
                    skills=[],
                    description=description,
                    url=url,
                    source="Himalayas"
                )
            )

        return jobs


if __name__ == "__main__":
    source = HimalayasSource()

    jobs = source.search("React")

    print(f"Found {len(jobs)} jobs")

    for job in jobs[:5]:
        print(job.model_dump())