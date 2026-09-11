import json
import time
from pathlib import Path

from backend.services.job_search import search_jobs


PROFILE_PATH = (
    Path(__file__).parent.parent
    / "data"
    / "profile.json"
)


def load_profile():
    with open(
        PROFILE_PATH,
        "r",
        encoding="utf-8"
    ) as file:
        return json.load(file)


def run_scheduler():
    print("AI Job Agent scheduler started.")

    while True:
        try:
            profile = load_profile()

            frequency_hours = profile.get(
                "search_frequency_hours",
                6
            )

            print(
                f"Searching jobs now. "
                f"Next search in {frequency_hours} hours."
            )

            jobs = search_jobs()

            print(
                f"Search completed. "
                f"{len(jobs)} matching jobs found."
            )

            sleep_seconds = (
                frequency_hours * 60 * 60
            )

            time.sleep(
                sleep_seconds
            )

        except KeyboardInterrupt:
            print(
                "Scheduler stopped."
            )
            break

        except Exception as error:
            print(
                f"Scheduler error: {error}"
            )

            # Retry after 5 minutes if something fails
            time.sleep(
                300
            )


if __name__ == "__main__":
    run_scheduler()