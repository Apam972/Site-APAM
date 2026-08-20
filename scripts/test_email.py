from __future__ import annotations

import base64
import os
from email.message import EmailMessage

from google.oauth2 import service_account
from googleapiclient.discovery import build


SCOPES = [
    "https://www.googleapis.com/auth/gmail.send"
]

SENDER = "auto@apam972.com"
RECIPIENT = os.environ.get(
    "TEST_EMAIL",
    "admin@apam972.com"
)


def main() -> None:
    print("=== Test Gmail APAM ===")

    credentials_path = os.environ.get(
        "GOOGLE_APPLICATION_CREDENTIALS"
    )

    if not credentials_path:
        raise RuntimeError(
            "GOOGLE_APPLICATION_CREDENTIALS est introuvable."
        )

    credentials = (
        service_account.Credentials
        .from_service_account_file(
            credentials_path,
            scopes=SCOPES,
            subject=SENDER,
        )
    )

    gmail = build(
        "gmail",
        "v1",
        credentials=credentials,
    )

    message = EmailMessage()

    message["From"] = SENDER
    message["To"] = RECIPIENT
    message["Subject"] = (
        "[TEST] APAM — Notifications automatiques"
    )

    message.set_content(
        """Bonjour,

Ceci est un test du système de notifications automatiques de l'APAM.

L'envoi depuis auto@apam972.com fonctionne correctement.

Ce message a été envoyé automatiquement par GitHub Actions.

— APAM
"""
    )

    raw_message = base64.urlsafe_b64encode(
        message.as_bytes()
    ).decode()

    result = (
        gmail.users()
        .messages()
        .send(
            userId="me",
            body={"raw": raw_message},
        )
        .execute()
    )

    print(
        f"Email envoyé avec succès."
    )
    print(
        f"ID du message : {result['id']}"
    )
    print(
        f"Destinataire : {RECIPIENT}"
    )


if __name__ == "__main__":
    main()