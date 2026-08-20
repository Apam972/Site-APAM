from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import google.auth
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload


# ============================================================
# CONFIGURATION
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

IMAGE_DIR = PROJECT_ROOT / "assets" / "image-apam"
JSON_FILE = PROJECT_ROOT / "data" / "images.json"

DRIVE_FOLDER_ID = os.environ.get("DRIVE_FOLDER_ID")
ARCHIVE_FOLDER_ID = os.environ.get("ARCHIVE_FOLDER_ID")

SCOPES = [
    "https://www.googleapis.com/auth/drive"
]


# ============================================================
# TYPES DE MÉDIAS ACCEPTÉS
# ============================================================

ALLOWED_MIME_TYPES = {
    # Images
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/bmp": ".bmp",
    "image/svg+xml": ".svg",

    # Vidéos
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
    "video/x-msvideo": ".avi",
    "video/x-matroska": ".mkv",

    # Audio
    "audio/mpeg": ".mp3",
    "audio/wav": ".wav",
    "audio/ogg": ".ogg",

    # Documents
    "application/pdf": ".pdf",
}


# À partir de 10 suppressions :
# mode sécurité + archive.
SECURITY_DELETE_THRESHOLD = 10


# ============================================================
# CATALOGUE JSON
# ============================================================

def load_catalog() -> list[dict]:
    """Charge le catalogue JSON existant."""

    if not JSON_FILE.exists():
        return []

    try:
        with JSON_FILE.open("r", encoding="utf-8") as file:
            content = file.read().strip()

        if not content:
            return []

        data = json.loads(content)

        if not isinstance(data, list):
            print("ERREUR : images.json doit contenir une liste.")
            return []

        return data

    except json.JSONDecodeError as exc:
        print(f"ERREUR : images.json est invalide : {exc}")
        sys.exit(1)


def save_catalog(catalog: list[dict]) -> None:
    """Sauvegarde le catalogue JSON."""

    JSON_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with JSON_FILE.open("w", encoding="utf-8") as file:
        json.dump(
            catalog,
            file,
            ensure_ascii=False,
            indent=4,
        )
        file.write("\n")


# ============================================================
# TYPE DE MÉDIA
# ============================================================

def get_media_type(mime_type: str) -> str:
    """Détermine le type de média à partir du MIME type."""

    if mime_type.startswith("image/"):
        return "image"

    if mime_type.startswith("video/"):
        return "video"

    if mime_type.startswith("audio/"):
        return "audio"

    if mime_type == "application/pdf":
        return "pdf"

    return "file"


# ============================================================
# GOOGLE DRIVE - LECTURE
# ============================================================

def get_drive_files(service) -> list[dict]:
    """Récupère les médias présents dans le dossier source."""

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
                    "files("
                    "id,"
                    "name,"
                    "mimeType,"
                    "size,"
                    "md5Checksum,"
                    "createdTime,"
                    "modifiedTime"
                    ")"
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


# ============================================================
# GOOGLE DRIVE - TÉLÉCHARGEMENT
# ============================================================

def download_file(
    service,
    file: dict,
    destination: Path,
) -> None:
    """Télécharge un média depuis Google Drive."""

    request = service.files().get_media(
        fileId=file["id"]
    )

    with destination.open("wb") as output:

        downloader = MediaIoBaseDownload(
            output,
            request,
        )

        done = False

        while not done:

            _, done = downloader.next_chunk()


# ============================================================
# GOOGLE DRIVE - ARCHIVE
# ============================================================

def create_archive_folder(
    service,
    incident_name: str,
) -> str:
    """Crée le dossier correspondant à l'incident."""

    if not ARCHIVE_FOLDER_ID:
        raise RuntimeError(
            "ARCHIVE_FOLDER_ID n'est pas défini."
        )

    metadata = {
        "name": incident_name,
        "mimeType": "application/vnd.google-apps.folder",
        "parents": [ARCHIVE_FOLDER_ID],
    }

    result = (
        service.files()
        .create(
            body=metadata,
            fields="id,name",
            supportsAllDrives=True,
        )
        .execute()
    )

    return result["id"]


def upload_file_to_archive(
    service,
    file_path: Path,
    archive_folder_id: str,
) -> str:
    """Envoie un fichier dans le dossier d'archive."""

    metadata = {
        "name": file_path.name,
        "parents": [archive_folder_id],
    }

    media = MediaFileUpload(
        str(file_path),
        mimetype="application/octet-stream",
        resumable=True,
    )

    result = (
        service.files()
        .create(
            body=metadata,
            media_body=media,
            fields="id,name",
            supportsAllDrives=True,
        )
        .execute()
    )

    return result["id"]


def upload_incident_report(
    service,
    report: dict,
    archive_folder_id: str,
) -> str:
    """Crée et envoie le rapport JSON de l'incident."""

    report_path = PROJECT_ROOT / "incident.json"

    try:

        report_path.write_text(
            json.dumps(
                report,
                ensure_ascii=False,
                indent=4,
            ),
            encoding="utf-8",
        )

        return upload_file_to_archive(
            service,
            report_path,
            archive_folder_id,
        )

    finally:

        if report_path.exists():
            report_path.unlink()


# ============================================================
# ENTRÉE DU CATALOGUE
# ============================================================

def build_entry(
    file: dict,
    local_name: str,
) -> dict:
    """Construit une entrée du catalogue."""

    return {
        "file": local_name,
        "type": get_media_type(
            file["mimeType"]
        ),
        "title": Path(file["name"]).stem,
        "description": "",
        "date": file.get(
            "createdTime",
            "",
        )[:10],
        "drive_id": file["id"],
        "md5_checksum": file.get(
            "md5Checksum",
            "",
        ),
        "modified_time": file.get(
            "modifiedTime",
            "",
        ),
        "synced_at": datetime.now(
            timezone.utc
        ).isoformat(),
    }


# ============================================================
# SYNCHRONISATION
# ============================================================

def main() -> int:

    print(
        "=== Synchronisation des médias APAM ==="
    )

    IMAGE_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    # --------------------------------------------------------
    # VÉRIFICATIONS
    # --------------------------------------------------------

    if not DRIVE_FOLDER_ID:
        print(
            "ERREUR : DRIVE_FOLDER_ID est manquant."
        )
        return 1

    if not ARCHIVE_FOLDER_ID:
        print(
            "ERREUR : ARCHIVE_FOLDER_ID est manquant."
        )
        return 1

    # --------------------------------------------------------
    # AUTHENTIFICATION
    # --------------------------------------------------------

    print(
        "Authentification Google Cloud..."
    )

    credentials, _ = google.auth.default(
        scopes=SCOPES
    )

    service = build(
        "drive",
        "v3",
        credentials=credentials,
    )

    # --------------------------------------------------------
    # LECTURE DRIVE
    # --------------------------------------------------------

    print(
        "Lecture du dossier Google Drive..."
    )

    drive_files = get_drive_files(
        service
    )

    print(
        f"{len(drive_files)} média(s) "
        "trouvé(s) dans Drive."
    )

    # --------------------------------------------------------
    # CHARGEMENT CATALOGUE
    # --------------------------------------------------------

    catalog = load_catalog()

    catalog_by_drive_id = {
        entry.get("drive_id"): entry
        for entry in catalog
        if entry.get("drive_id")
    }

    known_hashes = {
        entry.get("md5_checksum")
        for entry in catalog
        if entry.get("md5_checksum")
    }

    drive_ids = {
        file["id"]
        for file in drive_files
    }

    # --------------------------------------------------------
    # DÉTECTION DES SUPPRESSIONS
    # --------------------------------------------------------

    tracked_entries = [
        entry
        for entry in catalog
        if entry.get("drive_id")
    ]

    missing_entries = [
        entry
        for entry in tracked_entries
        if entry.get("drive_id")
        not in drive_ids
    ]

    deletion_count = len(
        missing_entries
    )

    print(
        f"{deletion_count} média(s) "
        "absent(s) de Drive."
    )

    # --------------------------------------------------------
    # MODE SÉCURITÉ
    # --------------------------------------------------------

    security_mode = (
        deletion_count
        >= SECURITY_DELETE_THRESHOLD
    )

    archive_folder_id = None
    incident_name = None

    if security_mode:

        now = datetime.now().astimezone()

        incident_name = now.strftime(
            "%Y-%m-%d_%H-%M-%S"
        )

        print()
        print(
            "⚠️ MODE SÉCURITÉ ACTIVÉ"
        )

        print(
            f"Médias supprimés détectés : "
            f"{deletion_count}"
        )

        print(
            f"Seuil : "
            f"{SECURITY_DELETE_THRESHOLD}"
        )

        print(
            f"Incident : {incident_name}"
        )

        # ----------------------------------------------------
        # CRÉATION DU DOSSIER INCIDENT
        # ----------------------------------------------------

        try:

            print(
                "Création du dossier "
                "d'archive..."
            )

            archive_folder_id = (
                create_archive_folder(
                    service,
                    incident_name,
                )
            )

            print(
                f"Dossier d'incident créé : "
                f"{archive_folder_id}"
            )

        except Exception as exc:

            print()
            print(
                "❌ IMPOSSIBLE DE CRÉER "
                "L'ARCHIVE."
            )

            print(
                f"Erreur : {exc}"
            )

            print(
                "AUCUNE SUPPRESSION "
                "NE SERA EFFECTUÉE."
            )

            return 1

        # ----------------------------------------------------
        # ARCHIVAGE DES MÉDIAS
        # ----------------------------------------------------

        archived_count = 0

        try:

            for entry in missing_entries:

                local_name = entry.get(
                    "file"
                )

                if not local_name:
                    continue

                local_path = (
                    IMAGE_DIR / local_name
                )

                if not local_path.exists():

                    print(
                        f"⚠️ Fichier local absent : "
                        f"{local_name}"
                    )

                    continue

                print(
                    f"Archivage : {local_name}"
                )

                upload_file_to_archive(
                    service,
                    local_path,
                    archive_folder_id,
                )

                archived_count += 1

            # ------------------------------------------------
            # RAPPORT INCIDENT
            # ------------------------------------------------

            report = {
                "incident": incident_name,
                "date": datetime.now().strftime(
                    "%Y-%m-%d"
                ),
                "heure": datetime.now().strftime(
                    "%H:%M:%S"
                ),
                "medias_supprimes": deletion_count,
                "medias_archives": archived_count,
                "seuil_securite": (
                    SECURITY_DELETE_THRESHOLD
                ),
                "source": "Google Drive",
                "raison": (
                    "Seuil de suppression atteint"
                ),
            }

            upload_incident_report(
                service,
                report,
                archive_folder_id,
            )

            print(
                "Rapport incident archivé."
            )

        except Exception as exc:

            print()
            print(
                "❌ ERREUR PENDANT "
                "L'ARCHIVAGE."
            )

            print(
                f"Erreur : {exc}"
            )

            print(
                "AUCUNE SUPPRESSION "
                "NE SERA EFFECTUÉE."
            )

            return 1

        print(
            "✅ Archivage de sécurité réussi."
        )

    # --------------------------------------------------------
    # COMPTEURS
    # --------------------------------------------------------

    added_count = 0
    updated_count = 0
    duplicate_count = 0
    deleted_count = 0

    updated_catalog = []

    # --------------------------------------------------------
    # AJOUTS / MODIFICATIONS
    # --------------------------------------------------------

    for file in drive_files:

        drive_id = file["id"]

        md5_checksum = file.get(
            "md5Checksum",
            "",
        )

        existing_entry = (
            catalog_by_drive_id.get(
                drive_id
            )
        )

        # ----------------------------------------------------
        # MÉDIA DÉJÀ CONNU
        # ----------------------------------------------------

        if existing_entry:

            local_name = existing_entry[
                "file"
            ]

            destination = (
                IMAGE_DIR / local_name
            )

            previous_md5 = (
                existing_entry.get(
                    "md5_checksum",
                    "",
                )
            )

            current_modified = file.get(
                "modifiedTime",
                "",
            )

            current_type = get_media_type(
                file["mimeType"]
            )

            # ------------------------------------------------
            # MÉDIA MODIFIÉ
            # ------------------------------------------------

            if (
                md5_checksum
                and previous_md5
                and md5_checksum
                != previous_md5
            ):

                print(
                    f"Média modifié : "
                    f"{file['name']}"
                )

                try:

                    download_file(
                        service,
                        file,
                        destination,
                    )

                    existing_entry[
                        "md5_checksum"
                    ] = md5_checksum

                    existing_entry[
                        "modified_time"
                    ] = current_modified

                    existing_entry[
                        "synced_at"
                    ] = datetime.now(
                        timezone.utc
                    ).isoformat()

                    existing_entry[
                        "title"
                    ] = Path(
                        file["name"]
                    ).stem

                    existing_entry[
                        "type"
                    ] = current_type

                    updated_count += 1

                except Exception as exc:

                    print(
                        "  ERREUR lors "
                        "de la mise à jour : "
                        f"{exc}"
                    )

            # ------------------------------------------------
            # FICHIER LOCAL MANQUANT
            # ------------------------------------------------

            elif not destination.exists():

                print(
                    f"Média local manquant : "
                    f"{file['name']}"
                )

                try:

                    download_file(
                        service,
                        file,
                        destination,
                    )

                    existing_entry[
                        "synced_at"
                    ] = datetime.now(
                        timezone.utc
                    ).isoformat()

                    existing_entry[
                        "type"
                    ] = current_type

                    updated_count += 1

                except Exception as exc:

                    print(
                        "  ERREUR lors de "
                        "la restauration : "
                        f"{exc}"
                    )

            updated_catalog.append(
                existing_entry
            )

            continue

        # ----------------------------------------------------
        # NOUVEAU MÉDIA
        # ----------------------------------------------------

        if (
            md5_checksum
            and md5_checksum in known_hashes
        ):

            print(
                f"Doublon détecté : "
                f"{file['name']}"
            )

            duplicate_count += 1
            continue

        extension = ALLOWED_MIME_TYPES[
            file["mimeType"]
        ]

        local_name = (
            f"{drive_id}{extension}"
        )

        destination = (
            IMAGE_DIR / local_name
        )

        print(
            f"Nouveau média : "
            f"{file['name']}"
        )

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

            updated_catalog.append(
                entry
            )

            catalog_by_drive_id[
                drive_id
            ] = entry

            if md5_checksum:
                known_hashes.add(
                    md5_checksum
                )

            added_count += 1

            print(
                f"  -> téléchargé sous "
                f"{local_name}"
            )

        except Exception as exc:

            print(
                "  ERREUR lors du téléchargement : "
                f"{exc}"
            )

    # --------------------------------------------------------
    # SUPPRESSIONS
    # --------------------------------------------------------

    for entry in missing_entries:

        local_name = entry.get(
            "file"
        )

        if not local_name:
            continue

        destination = (
            IMAGE_DIR / local_name
        )

        # Si le mode sécurité était activé,
        # l'archive a déjà été validée.
        #
        # Sinon, on supprime normalement.

        print(
            f"Média supprimé de Drive : "
            f"{local_name}"
        )

        if destination.exists():

            try:

                destination.unlink()

                deleted_count += 1

            except OSError as exc:

                print(
                    "  ERREUR lors de "
                    f"la suppression : {exc}"
                )

    # --------------------------------------------------------
    # TRI
    # --------------------------------------------------------

    updated_catalog.sort(
        key=lambda item: item.get(
            "date",
            "",
        ),
        reverse=True,
    )

    # --------------------------------------------------------
    # SAUVEGARDE
    # --------------------------------------------------------

    save_catalog(
        updated_catalog
    )

    # --------------------------------------------------------
    # RÉSULTAT
    # --------------------------------------------------------

    print()
    print(
        "=== Résultat de la synchronisation ==="
    )

    print(
        f"Médias ajoutés : "
        f"{added_count}"
    )

    print(
        f"Médias mis à jour : "
        f"{updated_count}"
    )

    print(
        f"Doublons ignorés : "
        f"{duplicate_count}"
    )

    print(
        f"Médias supprimés : "
        f"{deleted_count}"
    )

    print(
        f"Médias dans le catalogue : "
        f"{len(updated_catalog)}"
    )

    if security_mode:

        print()
        print(
            f"✅ Incident {incident_name} "
            "archivé avec succès."
        )

    print(
        "Synchronisation terminée."
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(
        main()
    )