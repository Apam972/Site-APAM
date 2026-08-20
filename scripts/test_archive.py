from pathlib import Path

import google.auth
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload


ARCHIVE_FOLDER_ID = "0APiMc1UWCSwcUk9PVA"

TEST_FILE = Path("archive-test.txt")

SCOPES = [
    "https://www.googleapis.com/auth/drive"
]


def main() -> None:
    print("=== Test écriture Archive secure ===")

    # Création du petit fichier de test
    TEST_FILE.write_text(
        "Test d'écriture du système APAM.",
        encoding="utf-8"
    )

    credentials, _ = google.auth.default(
        scopes=SCOPES
    )

    service = build(
        "drive",
        "v3",
        credentials=credentials
    )

    metadata = {
        "name": "APAM_ARCHIVE_TEST.txt",
        "parents": [ARCHIVE_FOLDER_ID]
    }

    media = MediaFileUpload(
        str(TEST_FILE),
        mimetype="text/plain"
    )

    uploaded = (
    service.files()
    .create(
        body=metadata,
        media_body=media,
        fields="id,name",
        supportsAllDrives=True,
    )
    .execute()
)

    print(
        f"Fichier envoyé : "
        f"{uploaded['name']} "
        f"(ID : {uploaded['id']})"
    )

    print("Test d'écriture réussi.")


if __name__ == "__main__":
    main()