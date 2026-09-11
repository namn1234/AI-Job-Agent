from pydantic import BaseModel


class Job(BaseModel):
    id: str
    title: str
    company: str
    location: str

    work_mode: str = "Unknown"
    experience: str = "Unknown"

    salary: float | None = None
    currency: str = "PKR"

    skills: list[str] = []
    description: str = ""

    url: str
    source: str