from __future__ import annotations

import io
import json
import os
import re
import shutil
from pathlib import Path

import google.auth
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload


# ============================================================
# CONFIGURATION
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

DRIVE_FOLDER_ID = os.environ.get(
    "DRIVE_FOLDER_ID"
)

ACTU_LOCAL_DIR = (
    PROJECT_ROOT
    / "assets"
    / "actu"
)

OUTPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "actualites.json"
)

SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly"
]

IMAGE_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
}


# ============================================================
# AUTHENTIFICATION GOOGLE
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
# GOOGLE DRIVE
# ============================================================

def list_children(
    service,
    folder_id: str,
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
# NORMALISATION DES NOMS
# ============================================================

def normalize_slug(
    value: str,
) -> str:
    value = value.strip().lower()

    value = (
        value
        .replace("œ", "oe")
        .replace("æ", "ae")
    )

    value = (
        value
        .encode(
            "ascii",
            "ignore",
        )
        .decode("ascii")
    )

    value = re.sub(
        r"[^a-z0-9]+",
        "-",
        value,
    )

    value = re.sub(
        r"-+",
        "-",
        value,
    )

    return value.strip("-")


# ============================================================
# TÉLÉCHARGEMENT D'UN FICHIER TEXTE
# ============================================================

def download_text_file(
    service,
    file_id: str,
) -> str:
    request = (
        service.files()
        .get_media(
            fileId=file_id,
        )
    )

    buffer = io.BytesIO()

    downloader = MediaIoBaseDownload(
        buffer,
        request,
    )

    done = False

    while not done:
        _, done = downloader.next_chunk()

    return buffer.getvalue().decode(
        "utf-8"
    )


# ============================================================
# TÉLÉCHARGEMENT D'UN FICHIER BINAIRE
# ============================================================

def download_file(
    service,
    file_id: str,
    destination: Path,
) -> None:
    destination.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    request = (
        service.files()
        .get_media(
            fileId=file_id,
        )
    )

    with destination.open(
        "wb"
    ) as output:
        downloader = MediaIoBaseDownload(
            output,
            request,
        )

        done = False

        while not done:
            _, done = downloader.next_chunk()


# ============================================================
# PARSING DE ARTICLE.MD
# ============================================================

def parse_article(
    markdown: str,
    folder_name: str,
) -> dict:
    lines = markdown.splitlines()

    title = ""
    date = ""
    body_lines = []

    title_found = False

    for line in lines:
        stripped = line.strip()

        # ----------------------------------------------------
        # TITRE
        # ----------------------------------------------------

        if (
            not title_found
            and stripped.startswith("# ")
        ):
            title = stripped[2:].strip()
            title_found = True
            continue

        # ----------------------------------------------------
        # DATE
        # ----------------------------------------------------

        if stripped.lower().startswith(
            "date :"
        ):
            date = (
                stripped
                .split(":", 1)[1]
                .strip()
            )
            continue

        body_lines.append(line)

    if not title:
        title = folder_name

    content = (
        "\n".join(body_lines)
        .strip()
    )

    return {
        "title": title,
        "date": date,
        "content": content,
    }


# ============================================================
# RECHERCHE DU DOSSIER IMAGE
# ============================================================

def get_image_folder(
    service,
    actu_folder_id: str,
) -> dict | None:
    children = list_children(
        service,
        actu_folder_id,
    )

    for item in children:
        if (
            item["mimeType"]
            == "application/vnd.google-apps.folder"
            and item["name"].lower()
            == "image"
        ):
            return item

    return None


# ============================================================
# SYNCHRONISATION D'UNE ACTUALITÉ
# ============================================================

def sync_actualite(
    service,
    folder: dict,
) -> dict:
    folder_id = folder["id"]
    folder_name = folder["name"]

    slug = normalize_slug(
        folder_name
    )

    if not slug:
        raise RuntimeError(
            f"Nom de dossier invalide : "
            f"{folder_name}"
        )

    print()
    print(
        f"--- Actualité : {folder_name} ---"
    )

    children = list_children(
        service,
        folder_id,
    )

    # --------------------------------------------------------
    # ARTICLE.MD
    # --------------------------------------------------------

    article_file = None

    for item in children:
        if (
            item["mimeType"]
            != "application/vnd.google-apps.folder"
            and item["name"].lower()
            == "article.md"
        ):
            article_file = item
            break

    if not article_file:
        raise RuntimeError(
            f"article.md manquant dans "
            f"{folder_name}"
        )

    article_raw = download_text_file(
        service,
        article_file["id"],
    )

    article = parse_article(
        article_raw,
        folder_name,
    )

    # --------------------------------------------------------
    # DOSSIER IMAGE
    # --------------------------------------------------------

    image_folder = get_image_folder(
        service,
        folder_id,
    )

    if not image_folder:
        raise RuntimeError(
            f"Dossier image manquant dans "
            f"{folder_name}"
        )

    image_files = list_children(
        service,
        image_folder["id"],
    )

    local_image_dir = (
        ACTU_LOCAL_DIR
        / slug
        / "image"
    )

    local_image_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    cover_path = None
    gallery_paths = []

    # --------------------------------------------------------
    # IMAGES
    # --------------------------------------------------------

    for image in image_files:
        if (
            image["mimeType"]
            not in IMAGE_MIME_TYPES
        ):
            continue

        file_name = image["name"]

        local_file = (
            local_image_dir
            / file_name
        )

        print(
            f"Image : {file_name}"
        )

        download_file(
            service,
            image["id"],
            local_file,
        )

        relative_path = (
            f"assets/actu/"
            f"{slug}/image/"
            f"{file_name}"
        )

        # ----------------------------------------------------
        # IMAGE PRINCIPALE
        # ----------------------------------------------------

        if file_name.lower().startswith(
            "cover."
        ):
            cover_path = relative_path

        else:
            gallery_paths.append(
                relative_path
            )

    if not cover_path:
        raise RuntimeError(
            f"Aucune image cover.* "
            f"dans {folder_name}"
        )

    # --------------------------------------------------------
    # OBJET FINAL
    # --------------------------------------------------------

    result = {
        "id": slug,
        "slug": slug,
        "title": article["title"],
        "date": article["date"],
        "content": article["content"],
        "cover": cover_path,
        "images": sorted(
            gallery_paths
        ),
    }

    print(
        f"OK : {article['title']}"
    )

    return result


# ============================================================
# NETTOYAGE DU MIROIR LOCAL
# ============================================================

def clean_local_actu_directory():
    ACTU_LOCAL_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    for item in ACTU_LOCAL_DIR.iterdir():
        if item.is_dir():
            shutil.rmtree(
                item
            )
        else:
            item.unlink()


# ============================================================
# SAUVEGARDE DU JSON
# ============================================================

def save_json(
    actualites: list[dict],
) -> None:
    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with OUTPUT_FILE.open(
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            actualites,
            file,
            ensure_ascii=False,
            indent=4,
        )

        file.write("\n")


# ============================================================
# PROGRAMME PRINCIPAL
# ============================================================

def main() -> int:
    print(
        "=== Synchronisation des actualités APAM ==="
    )

    # --------------------------------------------------------
    # VÉRIFICATION DE LA CONFIGURATION
    # --------------------------------------------------------

    if not DRIVE_FOLDER_ID:
        print(
            "ERREUR : DRIVE_FOLDER_ID est absent."
        )

        return 1

    # --------------------------------------------------------
    # AUTHENTIFICATION
    # --------------------------------------------------------

    print(
        "Authentification Google Cloud..."
    )

    service = get_drive_service()

    # --------------------------------------------------------
    # LECTURE DU DOSSIER ACTU
    # --------------------------------------------------------

    print(
        "Lecture du dossier Drive..."
    )

    root_children = list_children(
        service,
        DRIVE_FOLDER_ID,
    )

    actu_folders = [
        item
        for item in root_children
        if (
            item["mimeType"]
            == "application/vnd.google-apps.folder"
        )
    ]

    print(
        f"{len(actu_folders)} "
        f"dossier(s) d'actualité trouvé(s)."
    )

    # --------------------------------------------------------
    # NETTOYAGE DU MIROIR LOCAL
    # --------------------------------------------------------

    clean_local_actu_directory()

    actualites = []

    # --------------------------------------------------------
    # SYNCHRONISATION
    # --------------------------------------------------------

    for folder in actu_folders:
        try:
            actualite = sync_actualite(
                service,
                folder,
            )

            actualites.append(
                actualite
            )

        except Exception as error:
            print()
            print(
                f"ERREUR pour "
                f"{folder['name']} : "
                f"{error}"
            )

            return 1

    # --------------------------------------------------------
    # TRI PAR DATE
    # --------------------------------------------------------

    actualites.sort(
        key=lambda item: (
            item.get(
                "date",
                "",
            )
        ),
        reverse=True,
    )

    # --------------------------------------------------------
    # GÉNÉRATION DU JSON
    # --------------------------------------------------------

    save_json(
        actualites
    )

    # --------------------------------------------------------
    # RÉSULTAT
    # --------------------------------------------------------

    print()
    print(
        "=== Synchronisation terminée ==="
    )

    print(
        f"Actualités synchronisées : "
        f"{len(actualites)}"
    )

    print(
        f"JSON : "
        f"{OUTPUT_FILE}"
    )

    return 0


# ============================================================
# POINT D'ENTRÉE
# ============================================================

if __name__ == "__main__":
    raise SystemExit(
        main()
    )