from __future__ import annotations

import os
import sys

import google.auth
from googleapiclient.discovery import build


def main() -> int:
    folder_id = os.environ.get("DRIVE_FOLDER_ID")

    if not folder_id:
        print("ERREUR : DRIVE_FOLDER_ID n'est pas défini.")
        return 1

    credentials, _ = google.auth.default(
        scopes=["https://www.googleapis.com/auth/drive.readonly"]
    )

    service = build(
        "drive",
        "v3",
        credentials=credentials,
    )

    query = f"'{folder_id}' in parents and trashed = false"

    result = (
        service.files()
        .list(
            q=query,
            pageSize=20,
            fields="files(id,name,mimeType,createdTime,modifiedTime)",
            orderBy="modifiedTime desc",
        )
        .execute()
    )

    files = result.get("files", [])

    print(f"\nFichiers trouvés : {len(files)}\n")

    for file in files:
        print(
            f"- {file['name']} "
            f"| {file['mimeType']} "
            f"| ID : {file['id']}"
        )

    return 0


if __name__ == "__main__":
    sys.exit(main())