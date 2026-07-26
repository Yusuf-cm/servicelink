"""
Safaricom Daraja API client (M-Pesa), per proposal 4.1:

"Payment integration was implemented using Safaricom's Daraja API. When a
client confirms a booking, an STK Push request is sent to their phone
prompting them to complete payment. Once the payment is made, the system
receives a callback and updates the booking status automatically."

This is a real integration against Daraja's sandbox/production REST API —
it requires MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE and
MPESA_PASSKEY to be set (see .env.example). Without them, calls will fail
with a clear authentication error rather than silently mocking success,
since payment correctness shouldn't be faked.
"""

import base64
from datetime import datetime

import requests
from django.conf import settings

SANDBOX_BASE_URL = "https://sandbox.safaricom.co.ke"
PRODUCTION_BASE_URL = "https://api.safaricom.co.ke"


class DarajaError(Exception):
    pass


class DarajaClient:
    def __init__(self):
        self.base_url = PRODUCTION_BASE_URL if settings.MPESA_ENV == "production" else SANDBOX_BASE_URL
        self.consumer_key = settings.MPESA_CONSUMER_KEY
        self.consumer_secret = settings.MPESA_CONSUMER_SECRET
        self.shortcode = settings.MPESA_SHORTCODE
        self.passkey = settings.MPESA_PASSKEY
        self.callback_url = settings.MPESA_CALLBACK_URL

    def _access_token(self) -> str:
        if not self.consumer_key or not self.consumer_secret:
            raise DarajaError(
                "MPESA_CONSUMER_KEY / MPESA_CONSUMER_SECRET are not configured. "
                "Register an app at https://developer.safaricom.co.ke and set them in .env."
            )
        url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        response = requests.get(url, auth=(self.consumer_key, self.consumer_secret), timeout=15)
        if response.status_code != 200:
            raise DarajaError(f"Failed to obtain Daraja access token: {response.status_code} {response.text}")
        return response.json()["access_token"]

    def _password(self, timestamp: str) -> str:
        raw = f"{self.shortcode}{self.passkey}{timestamp}".encode()
        return base64.b64encode(raw).decode()

    def stk_push(self, phone_number: str, amount: int, account_reference: str, transaction_desc: str) -> dict:
        """
        Initiates an STK Push ("Lipa na M-Pesa Online") prompt on the
        client's phone. `phone_number` must be in 2547XXXXXXXX format
        (no leading '+').
        """
        token = self._access_token()
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")

        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": self._password(timestamp),
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount),
            "PartyA": phone_number,
            "PartyB": self.shortcode,
            "PhoneNumber": phone_number,
            "CallBackURL": self.callback_url,
            "AccountReference": account_reference[:12],
            "TransactionDesc": transaction_desc[:13],
        }

        response = requests.post(
            f"{self.base_url}/mpesa/stkpush/v1/processrequest",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=20,
        )
        data = response.json()
        if response.status_code != 200 or data.get("ResponseCode") != "0":
            raise DarajaError(f"STK Push failed: {data}")
        return data

    def query_stk_status(self, checkout_request_id: str) -> dict:
        token = self._access_token()
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")

        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": self._password(timestamp),
            "Timestamp": timestamp,
            "CheckoutRequestID": checkout_request_id,
        }
        response = requests.post(
            f"{self.base_url}/mpesa/stkpushquery/v1/query",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=20,
        )
        return response.json()


def normalize_phone_number(phone_number: str) -> str:
    """Converts +2547XXXXXXXX or 07XXXXXXXX to Daraja's expected 2547XXXXXXXX format."""
    phone_number = phone_number.strip().replace(" ", "")
    if phone_number.startswith("+"):
        phone_number = phone_number[1:]
    if phone_number.startswith("0"):
        phone_number = "254" + phone_number[1:]
    return phone_number
