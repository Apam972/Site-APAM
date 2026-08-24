from __future__ import annotations

import json
import os
import re
from pathlib import Path

import google.auth
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload


# ============================================================
# CONFIGURATION
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

OUTPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "actualites.json"
)

DRIVE_FOLDER_ID = os.environ.get(
    "DRIVE_FOLDER_ID"
)


ALLOWED_IMAGE_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
}


SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly"
]


# ============================================================
# AUTHENTIFICATION
# ============================================================

def get_drive_service():
    credentials, _ = google.auth.default(
        scopes=SCOPES
    )

    return build(
        "drive",
        "v3",
        credentials=credentials,
    )


# ============================================================
# OUTILS
# ============================================================

def normalize_name(name: str) -> str:
    """
    Transforme un nom en identifiant de dossier simple.
    """

    value = name.strip().lower()

    value = (
        value
        .replace("é", "e")
        .replace("è", "e")
        .replace("ê", "e")
        .replace("ë", "e")
        .replace("à", "a")
        .replace("â", "a")
        .replace("ä", "a")
        .replace("î", "i")
        .replace("ï", "i")
        .replace("ô", "o")
        .replace("ö", "o")
        .replace("ù", "u")
        .replace("û", "u")
        .replace("ü", "u")
        .replace("ç", "c")
    )

    value = re.sub(
        r"[^a-z0-9]+",
        "-",
        value
    )

    value = re.sub(
        r"-+",
        "-",
        value
    )

    return value.strip("-")


def save_json(data: list[dict]) -> None:

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    with OUTPUT_FILE.open(
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            data,
            file,
            ensure_ascii=False,
            indent=4
        )

        file.write("\n")


def read_text_file(
    service,
    file_id: str
) -> str:

    request = (
        service.files()
        .get_media(
            fileId=file_id
        )
    )

    temporary_file = (
        PROJECT_ROOT
        / ".article_tmp.md"
    )

    try:

        with temporary_file.open(
            "wb"
        ) as output:

            downloader = MediaIoBaseDownload(
                output,
                request
            )

            done = False

            while not done:

                _, done = (
                    downloader.next_chunk()
                )


        return temporary_file.read_text(
            encoding="utf-8"
        )

    finally:

        if temporary_file.exists():

            temporary_file.unlink()


def download_binary_file(
    service,
    file_id: str,
    destination: Path
) -> None:

    destination.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    request = (
        service.files()
        .get_media(
            fileId=file_id
        )
    )

    with destination.open(
        "wb"
    ) as output:

        downloader = MediaIoBaseDownload(
            output,
            request
        )

        done = False

        while not done:

            _, done = (
                downloader.next_chunk()
            )


# ============================================================
# DRIVE
# ============================================================

def list_children(
    service,
    folder_id: str
) -> list[dict]:

    query = (
        f"'{folder_id}' in parents "
        "and trashed = false"
    )

    files = []

    page_token = None

    while True:

        response = (
            service.files()
            .list(
                q=query,
                pageSize=100,
                pageToken=page_token,
                fields=(
                    "nextPageToken,"
                    "files("
                    "id,"
                    "name,"
                    "mimeType,"
                    "createdTime,"
                    "modifiedTime"
                    ")"
                ),
                supportsAllDrives=True,
                includeItemsFromAllDrives=True,
            )
            .execute()
        )

        files.extend(
            response.get(
                "files",
                []
            )
        )

        page_token = response.get(
            "nextPageToken"
        )

        if not page_token:
            break

    return files


# ============================================================
# ARTICLE
# ============================================================

def parse_article_markdown(
    content: str
) -> tuple[str, str]:

    lines = content.splitlines()

    title = ""

    body_lines = []

    for index, line in enumerate(lines):

        stripped = line.strip()

        if (
            not title
            and stripped.startswith("# ")
        ):

            title = stripped[2:].strip()

            continue

        body_lines.append(line)


    body = (
        "\n".join(
            body_lines
        )
        .strip()
    )

    return title, body


# ============================================================
# UNE ACTUALITÉ
# ============================================================

def build_actualite(
    service,
    news_folder: dict
) -> dict | None:

    news_folder_id = (
        news_folder["id"]
    )

    news_folder_name = (
        news_folder["name"]
    )


    print()
    print(
        f"Actualité : {news_folder_name}"
    )


    children = list_children(
        service,
        news_folder_id
    )


    image_folder = None
    article_file = None


    for item in children:

        if (
            item["mimeType"]
            == "application/vnd.google-apps.folder"
            and item["name"].lower()
            == "image"
        ):

            image_folder = item


        elif (
            item["name"].lower()
            == "article.md"
        ):

            article_file = item


    if not image_folder:

        print(
            "  ⚠ dossier image absent."
        )

        return None


    if not article_file:

        print(
            "  ⚠ article.md absent."
        )

        return None


    # --------------------------------------------------------
    # ARTICLE
    # --------------------------------------------------------

    article_raw = read_text_file(
        service,
        article_file["id"]
    )


    article_title, content = (
        parse_article_markdown(
            article_raw
        )
    )


    title = (
        article_title
        or news_folder_name
    )


    # --------------------------------------------------------
    # IMAGE PRINCIPALE + PHOTOS
    # --------------------------------------------------------

    image_files = list_children(
        service,
        image_folder["id"]
    )


    images = []

    cover = None


    for image in image_files:

        if (
            image["mimeType"]
            not in ALLOWED_IMAGE_MIME_TYPES
        ):
            continue


        relative_path = (
            f"assets/actu/"
            f"{news_folder_name}/"
            f"image/"
            f"{image['name']}"
        )


        # cover.jpg est réservée
        # à l'image principale.
        if (
            image["name"].lower()
            == "cover.jpg"
        ):

            cover = relative_path

            destination = (
                PROJECT_ROOT
                / "assets"
                / "actu"
                / news_folder_name
                / "image"
                / image["name"]
            )


            print(
                f"  Cover : "
                f"{image['name']}"
            )


            try:

                download_binary_file(
                    service,
                    image["id"],
                    destination
                )

            except Exception as exc:

                print(
                    "  ERREUR cover : "
                    f"{exc}"
                )

                return None


        else:

            images.append(
                relative_path
            )


            destination = (
                PROJECT_ROOT
                / "assets"
                / "actu"
                / news_folder_name
                / "image"
                / image["name"]
            )


            print(
                f"  Photo : "
                f"{image['name']}"
            )


            try:

                download_binary_file(
                    service,
                    image["id"],
                    destination
                )

            except Exception as exc:

                print(
                    "  ERREUR photo : "
                    f"{exc}"
                )

                return None


    if not cover:

        print(
            "  ⚠ cover.jpg absente."
        )

        return None


    # --------------------------------------------------------
    # DATE
    # --------------------------------------------------------

    date = (
        news_folder.get(
            "modifiedTime",
            ""
        )[:10]
    )


    # --------------------------------------------------------
    # OBJET FINAL
    # --------------------------------------------------------

    return {
        "id": normalize_name(
            news_folder_name
        ),

        "title": title,

        "date": date,

        "content": content,

        "cover": cover,

        "images": sorted(
            images
        )
    }


# ============================================================
# MAIN
# ============================================================

def main() -> int:

    print(
        "=== Publication des actualités APAM ==="
    )


    if not DRIVE_FOLDER_ID:

        print(
            "ERREUR : DRIVE_FOLDER_ID "
            "est manquant."
        )

        return 1


    PROJECT_ROOT.joinpath(
        "assets",
        "actu"
    ).mkdir(
        parents=True,
        exist_ok=True
    )


    service = get_drive_service()


    print(
        "Lecture du dossier Drive..."
    )


    folders = list_children(
        service,
        DRIVE_FOLDER_ID
    )


    news_folders = [
        item
        for item in folders
        if (
            item["mimeType"]
            == "application/vnd.google-apps.folder"
        )
    ]


    print(
        f"{len(news_folders)} "
        "dossier(s) d'actualité trouvé(s)."
    )


    actualites = []


    for folder in news_folders:

        actualite = build_actualite(
            service,
            folder
        )


        if actualite:

            actualites.append(
                actualite
            )


    actualites.sort(
        key=lambda item: item.get(
            "date",
            ""
        ),
        reverse=True
    )


    save_json(
        actualites
    )


    print()
    print(
        f"{len(actualites)} "
        "actualité(s) publiée(s)."
    )


    print(
        f"JSON généré : "
        f"{OUTPUT_FILE}"
    )


    return 0


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    raise SystemExit(
        main()
    )