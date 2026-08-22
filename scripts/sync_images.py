from __future__ import annotations

import base64
import json
import os
import sys
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path

import google.auth
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload


# ============================================================
# CONFIGURATION
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

MEDIA_DIR = PROJECT_ROOT / "assets" / "image-apam"
JSON_FILE = PROJECT_ROOT / "data" / "images.json"

DRIVE_FOLDER_ID = os.environ.get("DRIVE_FOLDER_ID")
ARCHIVE_FOLDER_ID = os.environ.get("ARCHIVE_FOLDER_ID")

MAIL_SENDER = "mail.auto@apam972.com"

MAIL_RECIPIENTS = [
    os.environ.get("MAIL_COMMUNICATION"),
    os.environ.get("MAIL_DIRECTION"),
]

# Authentification Drive.
SCOPES = [
    "https://www.googleapis.com/auth/drive"
]

# À partir de 10 suppressions :
# archivage sécurisé + notification.
SECURITY_DELETE_THRESHOLD = 10


# ============================================================
# TYPES DE FICHIERS ACCEPTÉS
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


# ============================================================
# OUTILS
# ============================================================

def utc_now_iso() -> str:
    """Retourne la date/heure UTC au format ISO 8601."""
    return datetime.now(timezone.utc).isoformat()


def get_media_type(mime_type: str) -> str:
    """Détermine le type logique d'un média."""

    if mime_type.startswith("image/"):
        return "image"

    if mime_type.startswith("video/"):
        return "video"

    if mime_type.startswith("audio/"):
        return "audio"

    if mime_type == "application/pdf":
        return "pdf"

    return "file"


def get_valid_mail_recipients() -> list[str]:
    """
    Retourne uniquement les adresses plausibles configurées
    dans le workflow.
    """

    recipients: list[str] = []

    for email in MAIL_RECIPIENTS:
        if not email:
            continue

        email = email.strip()

        if "@" not in email:
            raise RuntimeError(
                f"Adresse email invalide dans la configuration : {email}"
            )

        recipients.append(email)

    return recipients


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
            print(
                "ERREUR : images.json doit contenir une liste."
            )
            return []

        return data

    except json.JSONDecodeError as exc:
        print(
            f"ERREUR : images.json est invalide : {exc}"
        )
        sys.exit(1)


def save_catalog(catalog: list[dict]) -> None:
    """Sauvegarde le catalogue JSON."""

    JSON_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with JSON_FILE.open(
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            catalog,
            file,
            ensure_ascii=False,
            indent=4,
        )

        file.write("\n")


# ============================================================
# GOOGLE DRIVE - LECTURE
# ============================================================

def get_drive_files(service) -> list[dict]:
    """Récupère les médias présents dans le dossier Drive."""

    if not DRIVE_FOLDER_ID:
        raise RuntimeError(
            "DRIVE_FOLDER_ID est manquant."
        )

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
                    "modifiedTime,"
                    "description"
                    ")"
                ),
                orderBy="createdTime desc",
                supportsAllDrives=True,
                includeItemsFromAllDrives=True,
            )
            .execute()
        )

        for file in response.get("files", []):

            if file.get("mimeType") in ALLOWED_MIME_TYPES:
                files.append(file)

        page_token = response.get(
            "nextPageToken"
        )

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

    destination.parent.mkdir(
        parents=True,
        exist_ok=True,
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
    """Crée un dossier d'incident dans Archive secure."""

    if not ARCHIVE_FOLDER_ID:
        raise RuntimeError(
            "ARCHIVE_FOLDER_ID est manquant."
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
) -> None:
    """Crée et envoie incident.json."""

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

        upload_file_to_archive(
            service,
            report_path,
            archive_folder_id,
        )

    finally:

        if report_path.exists():
            report_path.unlink()


# ============================================================
# EMAIL - ALERTE
# ============================================================

def send_alert_email(
    access_token: str,
    incident_name: str,
    deleted_count: int,
    archived_count: int,
) -> None:
    """Envoie une alerte email."""

    recipients = get_valid_mail_recipients()

    if not recipients:
        raise RuntimeError(
            "Aucun destinataire d'alerte n'est configuré."
        )

    credentials = Credentials(
        token=access_token
    )

    gmail = build(
        "gmail",
        "v1",
        credentials=credentials,
    )

    message = EmailMessage()

    message["From"] = MAIL_SENDER
    message["To"] = ", ".join(recipients)

    message["Subject"] = (
        "⚠️ APAM — Alerte de synchronisation des médias"
    )

    message.set_content(
        f"""Bonjour,

Le système automatique du site APAM a détecté une
suppression importante de médias dans Google Drive.

Incident :
{incident_name}

Médias supprimés de Drive :
{deleted_count}

Médias archivés :
{archived_count}

Les médias ont été archivés avant leur suppression
du site.

Dossier d'archive :
Archive secure/{incident_name}

Merci de vérifier le dossier « Image de l'APAM ».

— APAM
Système de notifications automatiques
"""
    )

    raw_message = base64.urlsafe_b64encode(
        message.as_bytes()
    ).decode()

    (
        gmail.users()
        .messages()
        .send(
            userId="me",
            body={
                "raw": raw_message,
            },
        )
        .execute()
    )

    print(
        "✅ Email d'alerte envoyé."
    )


# ============================================================
# CONSTRUCTION D'UNE ENTRÉE JSON
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

        "title": Path(
            file["name"]
        ).stem,

        "description": file.get(
            "description",
            "",
        ),

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

        "synced_at": utc_now_iso(),
    }


# ============================================================
# SYNCHRONISATION DES MÉTADONNÉES
# ============================================================

def update_entry_metadata(
    entry: dict,
    file: dict,
) -> bool:
    """
    Met à jour les métadonnées éditoriales.

    Retourne True si quelque chose a changé.
    """

    old_title = entry.get(
        "title",
        "",
    )

    old_description = entry.get(
        "description",
        "",
    )

    old_date = entry.get(
        "date",
        "",
    )

    old_type = entry.get(
        "type",
        "",
    )

    new_title = Path(
        file["name"]
    ).stem

    new_description = file.get(
        "description",
        "",
    )

    new_date = file.get(
        "createdTime",
        "",
    )[:10]

    new_type = get_media_type(
        file["mimeType"]
    )

    changed = (
        old_title != new_title
        or old_description != new_description
        or old_date != new_date
        or old_type != new_type
    )

    entry["title"] = new_title
    entry["description"] = new_description
    entry["date"] = new_date
    entry["type"] = new_type

    if changed:
        entry["synced_at"] = utc_now_iso()

    return changed


# ============================================================
# SYNCHRONISATION PRINCIPALE
# ============================================================

def main() -> int:

    print(
        "=== Synchronisation des médias APAM ==="
    )

    MEDIA_DIR.mkdir(
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
    # AUTHENTIFICATION DRIVE
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
    # LECTURE GOOGLE DRIVE
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
    # CHARGEMENT DU CATALOGUE
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

    security_mode = (
        deletion_count
        >= SECURITY_DELETE_THRESHOLD
    )

    incident_name: str | None = None
    archive_folder_id: str | None = None

    archived_count = 0

    # --------------------------------------------------------
    # MODE SÉCURITÉ
    # --------------------------------------------------------

    if security_mode:

        incident_time = (
            datetime.now().astimezone()
        )

        incident_name = (
            incident_time.strftime(
                "%Y-%m-%d_%H-%M-%S"
            )
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
                "Création du dossier d'archive..."
            )

            archive_folder_id = (
                create_archive_folder(
                    service,
                    incident_name,
                )
            )

            print(
                f"Dossier créé : "
                f"{archive_folder_id}"
            )

        except Exception as exc:

            print(
                "❌ Impossible de créer l'archive."
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
        # ARCHIVAGE DES FICHIERS
        # ----------------------------------------------------

        try:

            for entry in missing_entries:

                local_name = entry.get(
                    "file"
                )

                if not local_name:
                    continue

                local_path = (
                    MEDIA_DIR / local_name
                )

                if not local_path.exists():

                    raise RuntimeError(
                        "Fichier local manquant "
                        f"pendant l'archivage : "
                        f"{local_name}"
                    )

                print(
                    f"Archivage : "
                    f"{local_name}"
                )

                upload_file_to_archive(
                    service,
                    local_path,
                    archive_folder_id,
                )

                archived_count += 1

            # ------------------------------------------------
            # VÉRIFICATION ARCHIVAGE COMPLET
            # ------------------------------------------------

            if archived_count != deletion_count:

                raise RuntimeError(
                    "Tous les médias supprimés "
                    "n'ont pas pu être archivés."
                )

            # ------------------------------------------------
            # RAPPORT INCIDENT
            # ------------------------------------------------

            report = {
                "incident": incident_name,
                "date": incident_time.strftime(
                    "%Y-%m-%d"
                ),
                "heure": incident_time.strftime(
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
                "✅ Archive de sécurité créée."
            )

        except Exception as exc:

            print(
                "❌ ERREUR pendant l'archivage."
            )

            print(
                f"Erreur : {exc}"
            )

            print(
                "AUCUNE SUPPRESSION "
                "NE SERA EFFECTUÉE."
            )

            return 1

    # --------------------------------------------------------
    # COMPTEURS
    # --------------------------------------------------------

    added_count = 0
    updated_count = 0
    duplicate_count = 0
    deleted_count = 0
    metadata_updated_count = 0

    updated_catalog: list[dict] = []

    # --------------------------------------------------------
    # TRAITEMENT DES MÉDIAS
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

        # ====================================================
        # MÉDIA DÉJÀ CONNU
        # ====================================================

        if existing_entry:

            local_name = existing_entry.get(
                "file"
            )

            if not local_name:
                print(
                    f"⚠️ Entrée invalide : "
                    f"{drive_id}"
                )
                continue

            destination = (
                MEDIA_DIR / local_name
            )

            previous_md5 = (
                existing_entry.get(
                    "md5_checksum",
                    "",
                )
            )

            # ------------------------------------------------
            # MÉTADONNÉES
            # ------------------------------------------------

            metadata_changed = (
                update_entry_metadata(
                    existing_entry,
                    file,
                )
            )

            if metadata_changed:

                metadata_updated_count += 1

                print(
                    f"Métadonnées mises à jour : "
                    f"{file['name']}"
                )

            # ------------------------------------------------
            # FICHIER MODIFIÉ
            # ------------------------------------------------

            if (
                md5_checksum
                and previous_md5
                and md5_checksum != previous_md5
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
                    ] = file.get(
                        "modifiedTime",
                        "",
                    )

                    existing_entry[
                        "synced_at"
                    ] = utc_now_iso()

                    updated_count += 1

                except Exception as exc:

                    print(
                        "ERREUR lors de la "
                        "mise à jour : "
                        f"{exc}"
                    )

                    return 1

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
                        "md5_checksum"
                    ] = md5_checksum

                    existing_entry[
                        "modified_time"
                    ] = file.get(
                        "modifiedTime",
                        "",
                    )

                    existing_entry[
                        "synced_at"
                    ] = utc_now_iso()

                    updated_count += 1

                except Exception as exc:

                    print(
                        "ERREUR lors de la "
                        "restauration : "
                        f"{exc}"
                    )

                    return 1

            updated_catalog.append(
                existing_entry
            )

            continue

        # ====================================================
        # NOUVEAU MÉDIA
        # ====================================================

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
            MEDIA_DIR / local_name
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
                "ERREUR lors du téléchargement : "
                f"{exc}"
            )

            return 1

    # ========================================================
    # SUPPRESSIONS
    # ========================================================

    for entry in missing_entries:

        local_name = entry.get(
            "file"
        )

        if not local_name:
            continue

        destination = (
            MEDIA_DIR / local_name
        )

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
                    "ERREUR lors de la "
                    "suppression : "
                    f"{exc}"
                )

                return 1

        else:

            # Le fichier n'existe déjà plus
            # localement. On considère tout de
            # même l'entrée comme retirée.
            deleted_count += 1

    # ========================================================
    # TRI DU CATALOGUE
    # ========================================================

    updated_catalog.sort(
        key=lambda item: item.get(
            "date",
            "",
        ),
        reverse=True,
    )

    # ========================================================
    # SAUVEGARDE
    # ========================================================

    save_catalog(
        updated_catalog
    )

    # ========================================================
    # ALERTE EMAIL
    # ========================================================

    if security_mode:

        if incident_name is None:

            print(
                "ERREUR : nom d'incident absent."
            )

            return 1

        gmail_access_token = os.environ.get(
            "GMAIL_ACCESS_TOKEN"
        )

        if not gmail_access_token:

            print(
                "⚠️ GMAIL_ACCESS_TOKEN est absent."
            )

            print(
                "L'archive et la suppression "
                "ont été effectuées, mais "
                "l'alerte email n'a pas "
                "pu être envoyée."
            )

        else:

            try:

                send_alert_email(
                    access_token=gmail_access_token,
                    incident_name=incident_name,
                    deleted_count=deletion_count,
                    archived_count=archived_count,
                )

            except Exception as exc:

                print(
                    "⚠️ ERREUR lors de l'envoi "
                    "de l'alerte email : "
                    f"{exc}"
                )

    # ========================================================
    # RÉSULTAT
    # ========================================================

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
        f"Métadonnées mises à jour : "
        f"{metadata_updated_count}"
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

        print(
            f"Incident : "
            f"{incident_name}"
        )

        print(
            f"Médias archivés : "
            f"{archived_count}"
        )

    print(
        "Synchronisation terminée."
    )

    return 0


# ============================================================
# POINT D'ENTRÉE
# ============================================================

if __name__ == "__main__":
    raise SystemExit(
        main()
    )