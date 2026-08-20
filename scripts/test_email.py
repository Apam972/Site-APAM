from __future__ import annotations

import base64
import os
from email.message import EmailMessage

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


SENDER = "mail.auto@apam972.com"

RECIPIENT = os.environ.get(
    "TEST_EMAIL",
    "admin@apam972.com",
)


def main() -> None:
    print("=== Test Gmail APAM ===")

    # --------------------------------------------------------
    # RÉCUPÉRATION DU TOKEN GMAIL
    # --------------------------------------------------------

    access_token = os.environ.get(
        "GMAIL_ACCESS_TOKEN"
    )

    if not access_token:
        raise RuntimeError(
            "GMAIL_ACCESS_TOKEN est introuvable."
        )

    print("Token Gmail récupéré.")

    credentials = Credentials(
        token=access_token
    )

    # --------------------------------------------------------
    # CONNEXION À GMAIL
    # --------------------------------------------------------

    gmail = build(
        "gmail",
        "v1",
        credentials=credentials,
    )

    print("Connexion à Gmail réussie.")

    # --------------------------------------------------------
    # CRÉATION DU MESSAGE
    # --------------------------------------------------------

    message = EmailMessage()

    message["From"] = SENDER
    message["To"] = RECIPIENT
    message["Subject"] = (
        "[TEST] APAM — Notifications automatiques"
    )

    message.set_content(
        """Bonjour,

Ceci est un test du système de notifications
automatiques de l'APAM.

L'envoi depuis auto@apam972.com fonctionne
correctement.

Ce message a été envoyé automatiquement
par GitHub Actions.

— APAM
"""
    )

    # --------------------------------------------------------
    # ENCODAGE DU MESSAGE
    # --------------------------------------------------------

    raw_message = base64.urlsafe_b64encode(
        message.as_bytes()
    ).decode()

    # --------------------------------------------------------
    # ENVOI
    # --------------------------------------------------------

    print(
        f"Envoi du message vers {RECIPIENT}..."
    )

    result = (
        gmail.users()
        .messages()
        .send(
            userId="me",
            body={
                "raw": raw_message
            },
        )
        .execute()
    )

    # --------------------------------------------------------
    # RÉSULTAT
    # --------------------------------------------------------

    print()
    print("✅ Email envoyé avec succès.")
    print(
        f"ID du message : {result['id']}"
    )
    print(
        f"Expéditeur : {SENDER}"
    )
    print(
        f"Destinataire : {RECIPIENT}"
    )


if __name__ == "__main__":
    main()