from unittest.mock import patch

from django.test import SimpleTestCase
from rest_framework.test import APIClient
from user_scanner.core.result import Result


class EmailLookupTests(SimpleTestCase):
    def setUp(self):
        self.client = APIClient()

    @patch("hereyouare.services.run_email_module_batch")
    def test_only_supported_sites_are_scanned_and_all_four_are_returned(
        self, scan
    ):
        scan.return_value = [
            Result.taken(url="https://instagram.com").update(site_name="Instagram"),
            Result.available(url="https://facebook.com").update(
                site_name="Facebook"
            ),
        ]

        response = self.client.post(
            "/search/email",
            {"email": "person@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["email"], "person@example.com")
        self.assertEqual(
            [(item["site"], item["status"]) for item in payload["results"]],
            [
                ("Instagram", "detected"),
                ("TikTok", "unknown"),
                ("Facebook", "not_detected"),
                ("YouTube", "unknown"),
            ],
        )
        self.assertEqual(payload["meta"]["checked"], 2)
        self.assertEqual(payload["meta"]["detected"], 1)
        self.assertEqual(payload["meta"]["unknown"], 2)

        modules, email, _config = scan.call_args.args
        self.assertEqual(
            [module.__name__.split(".")[-1] for module in modules],
            ["instagram", "facebook"],
        )
        self.assertEqual(email, "person@example.com")

    @patch("hereyouare.services.run_email_module_batch")
    def test_scan_errors_are_reported_as_unknown(self, scan):
        scan.return_value = [
            Result.error("rate limited").update(site_name="Instagram"),
            Result.taken(url="https://facebook.com").update(site_name="Facebook"),
        ]

        response = self.client.post(
            "/search/email",
            {"email": "person@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        statuses = {
            item["site"]: item["status"] for item in response.json()["results"]
        }
        self.assertEqual(statuses["Instagram"], "unknown")
        self.assertEqual(statuses["Facebook"], "detected")

    @patch("hereyouare.services.run_email_module_batch")
    def test_scanner_exception_is_returned_as_unknown(self, scan):
        scan.side_effect = RuntimeError("scanner unavailable")

        with self.assertLogs("hereyouare.services", level="ERROR"):
            response = self.client.post(
                "/search/email",
                {"email": "person@example.com"},
                format="json",
            )

        self.assertEqual(response.status_code, 200)
        results = {item["site"]: item for item in response.json()["results"]}
        self.assertEqual(results["Instagram"]["status"], "unknown")
        self.assertIn("scanner unavailable", results["Instagram"]["note"])
        self.assertEqual(results["Facebook"]["status"], "unknown")

    @patch("hereyouare.services.run_email_module_batch")
    def test_invalid_email_is_rejected_before_scanning(self, scan):
        response = self.client.post(
            "/search/email",
            {"email": "not-an-email"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        scan.assert_not_called()

    def test_username_endpoint_is_not_part_of_the_application(self):
        response = self.client.post(
            "/search/username",
            {"username": "someone"},
            format="json",
        )

        self.assertEqual(response.status_code, 404)
