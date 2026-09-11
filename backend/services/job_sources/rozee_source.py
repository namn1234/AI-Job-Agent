import requests


def fetch_rozee_page(query):
    url = "https://www.rozee.pk/job/jsearch/q/" + query

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 "
            "(KHTML, like Gecko) "
            "Chrome/140.0.0.0 Safari/537.36"
        )
    }

    response = requests.get(
        url,
        headers=headers,
        timeout=20
    )

    response.raise_for_status()

    return response.text


if __name__ == "__main__":
    html = fetch_rozee_page("MERN")

    print("Page downloaded successfully")
    print("Characters:", len(html))
    print(html[:500])