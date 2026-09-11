from .base_source import JobSource
from .job_model import Job


class PakistanSampleSource(JobSource):

    def search(self, query: str) -> list[Job]:

        jobs = [
            Job(
                id="pk-001",
                title="MERN Stack Developer",
                company="Tech Pakistan",
                location="Islamabad",
                work_mode="On-site",
                experience="Junior",
                salary=70000,
                skills=[
                    "JavaScript",
                    "React",
                    "Node.js",
                    "MongoDB"
                ],
                description="Junior MERN Stack Developer position.",
                url="https://example.com/job/pk-001",
                source="Pakistan Sample"
            ),

            Job(
                id="pk-002",
                title="Full Stack Developer",
                company="Software House",
                location="Rawalpindi",
                work_mode="Hybrid",
                experience="Fresh Graduate",
                salary=65000,
                skills=[
                    "JavaScript",
                    "React",
                    "Node.js"
                ],
                description="Full Stack Developer position for a fresh graduate.",
                url="https://example.com/job/pk-002",
                source="Pakistan Sample"
            ),

            Job(
                id="pk-003",
                title="Junior AI Engineer",
                company="AI Technologies",
                location="Lahore",
                work_mode="On-site",
                experience="Junior",
                salary=80000,
                skills=[
                    "Python",
                    "AI",
                    "Machine Learning",
                    "LLM"
                ],
                description="Junior AI Engineer working with Python and LLM applications.",
                url="https://example.com/job/pk-003",
                source="Pakistan Sample"
            )
        ]

        query = query.lower()

        return [
            job
            for job in jobs
            if query in job.title.lower()
        ]


# Test the source
if __name__ == "__main__":
    source = PakistanSampleSource()

    jobs = source.search("MERN")

    print(f"Found {len(jobs)} jobs")

    for job in jobs:
        print(job.model_dump())