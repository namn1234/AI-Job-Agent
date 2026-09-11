from abc import ABC, abstractmethod
from .job_model import Job


class JobSource(ABC):

    @abstractmethod
    def search(self, query: str) -> list[Job]:
        pass