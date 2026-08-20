from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import google.auth
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload


PROJECT_ROOT = Path(__file__).resolve().parent.parent

IMAGE_DIR = PROJECT_ROOT / "assets" / "image-apam"
JSON_FILE = PROJECT_ROOT / "data" / "images.json"

DRIVE_FOLDER_ID = os.environ.get("DRIVE_FOLDER_ID")

SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly"
]

ALLOWED_MIME_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


def load_catalog() -> list[dict]:
    """Charge le catalogue JSON existant."""
    if not JSON_FILE.exists():
        return []

    try:
        with JSON_FILE.open("r", encoding="utf-8") as file:
            data = json.load(file)

        if not isinstance(data, list):
            print("ERREUR : images.json doit contenir une liste.")
            return []

        return data

    except json.JSONDecodeError as exc:
        print(f"ERREUR : images.json est invalide : {exc}")
        sys.exit(1)


def save_catalog(catalog: list[dict]) -> None:
    """Sauvegarde le catalogue JSON."""
    JSON_FILE.parent.mkdir(parents=True, exist_ok=True)

    with JSON_FILE.open("w", encoding="utf-8") as file:
        json.dump(catalog, file, ensure_ascii=False, indent=4)
        file.write("\n")


def get_drive_files(service) -> list[dict]:
    """Récupère les fichiers images présents dans le dossier Drive."""
    if not DRIVE_FOLDER_ID:
        print("ERREUR : DRIVE_FOLDER_ID n'est pas défini.")
        sys.exit(1)

    query = (
        f"'{DRIVE_FOLDER_ID}' in parents "
        "and trashed = false"
    )

    files: list[dict] = []
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
                    "files(id,name,mimeType,size,createdTime,modifiedTime)"
                ),
                orderBy="createdTime desc",
            )
            .execute()
        )

        for file in response.get("files", []):
            if file.get("mimeType") in ALLOWED_MIME_TYPES:
                files.append(file)

        page_token = response.get("nextPageToken")

        if not page_token:
            break

    return files


def download_file(service, file: dict, destination: Path) -> None:
    """Télécharge un fichier Drive vers le dépôt local."""
    request = service.files().get_media(fileId=file["id"])

    with destination.open("wb") as output:
        downloader = MediaIoBaseDownload(output, request)

        done = False

        while not done:
            _, done = downloader.next_chunk()


def build_entry(file: dict, local_name: str) -> dict:
    """Construit une entrée JSON pour une image."""
    return {
        "file": local_name,
        "title": Path(local_name).stem,
        "description": "",
        "date": file.get("createdTime", "")[:10],
        "drive_id": file["id"],
        "modified_time": file.get("modifiedTime", ""),
        "synced_at": datetime.now(timezone.utc).isoformat(),
    }


def main() -> int:
    print("=== Synchronisation des images APAM ===")

    IMAGE_DIR.mkdir(parents=True, exist_ok=True)

    print("Authentification Google Cloud...")

    credentials, _ = google.auth.default(
        scopes=SCOPES
    )

    service = build(
        "drive",
        "v3",
        credentials=credentials,
    )

    print("Lecture du dossier Google Drive...")

    drive_files = get_drive_files(service)

    print(f"{len(drive_files)} image(s) trouvée(s) dans Drive.")

    catalog = load_catalog()

    known_files = {
        entry.get("drive_id"): entry
        for entry in catalog
        if entry.get("drive_id")
    }

    added_count = 0

    for file in drive_files:
        drive_id = file["id"]

        if drive_id in known_files:
            continue

        extension = ALLOWED_MIME_TYPES[file["mimeType"]]
        local_name = f"{drive_id}{extension}"
        destination = IMAGE_DIR / local_name

        print(f"Nouvelle image : {file['name']}")

        try:
            download_file(
                service,
                file,
                destination,
            )

            entry = build_entry(
                file,
                local_name,
            )

            catalog.append(entry)
            added_count += 1

            print(f"  -> téléchargée sous {local_name}")

        except Exception as exc:
            print(f"  ERREUR lors du téléchargement : {exc}")

    catalog.sort(
        key=lambda item: item.get("date", ""),
        reverse=True,
    )

    save_catalog(catalog)

    print()
    print(f"Images ajoutées : {added_count}")
    print(f"Images dans le catalogue : {len(catalog)}")
    print("Synchronisation terminée.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())