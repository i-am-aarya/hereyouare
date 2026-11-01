import contextlib
import io
import logging

from cloakbrowser import launch
from user_scanner.core.email_orchestrator import run_email_module_batch
from user_scanner.core.helpers import ScanConfig, set_global_timeout
from user_scanner.core.result import Status
from user_scanner.email_scan.social import facebook, instagram

logger = logging.getLogger(__name__)

set_global_timeout(10)

CONFIG = ScanConfig(allow_loud=False, no_nsfw=True)

SITE_MODULES = (
    ("Instagram", "instagram"),
    ("TikTok", "tiktok"),
    ("Facebook", "facebook"),
    ("YouTube", None),
)

TIKTOK_LOGIN_URL = "https://www.tiktok.com/login/phone-or-email/email"


def check_tiktok(email: str, timeout: int = 30) -> dict:
    """Check whether an email address is registered on TikTok using CloakBrowser."""
    browser = None
    try:
        browser = launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1366, "height": 900}, locale="en-US"
        )
        page = context.new_page()

        page.goto(
            TIKTOK_LOGIN_URL,
            wait_until="domcontentloaded",
            timeout=timeout * 1000,
        )
        page.wait_for_timeout(3500)

        u_field = page.locator('input[name="username"]').first
        u_field.click()
        u_field.press_sequentially(email, delay=25)

        p_field = page.locator('input[type="password"]').first
        p_field.click()
        p_field.press_sequentially("DummyPass123!", delay=25)

        page.wait_for_timeout(800)

        submit_btn = page.locator('button[type="submit"]').last
        with page.expect_response(
            lambda r: "/passport/web/user/login/" in r.url,
            timeout=timeout * 1000,
        ) as response_info:
            submit_btn.click()

        response = response_info.value
        try:
            payload = response.json()
        except Exception:
            payload = {}

        data = payload.get("data") or {}
        error_code = data.get("error_code")
        description = (
            data.get("description")
            or data.get("alert_text")
            or payload.get("message")
            or ""
        )

        if error_code == 1011:
            return {
                "status": "not_detected",
                "url": None,
                "note": "No registration was detected; this does not prove no account exists.",
            }
        elif error_code in (1033, 1009):
            return {
                "status": "detected",
                "url": "https://www.tiktok.com",
                "note": None,
            }
        elif error_code in (7, 10000):
            return {
                "status": "unknown",
                "url": None,
                "note": "TikTok rate-limited or challenged the request with a captcha.",
            }
        else:
            return {
                "status": "unknown",
                "url": None,
                "note": description or "The site did not provide a conclusive result.",
            }
    except Exception as exc:
        logger.exception("TikTok registration check failed")
        return {
            "status": "unknown",
            "url": None,
            "note": f"Check failed: {type(exc).__name__}: {exc}",
        }
    finally:
        if browser:
            try:
                browser.close()
            except Exception:
                pass


def run_lookup(email: str) -> dict:
    modules = []
    module_sites = {}

    for site, module_name in SITE_MODULES:
        if module_name in {"instagram", "facebook"}:
            module = {"instagram": instagram, "facebook": facebook}[module_name]
            modules.append(module)
            module_sites[module_name] = site

    results_by_site = {}
    if modules:
        try:
            with contextlib.redirect_stdout(io.StringIO()):
                scan_results = run_email_module_batch(modules, email, CONFIG)
        except Exception as exc:
            logger.exception("Email registration checks failed")
            scan_results = []
            scan_error = f"Check failed: {type(exc).__name__}: {exc}"
        else:
            scan_error = None

        for result in scan_results:
            module_name = (result.site_name or "").lower()
            site = module_sites.get(module_name)
            if site:
                results_by_site[site] = result
    else:
        scan_error = None

    tiktok_result = check_tiktok(email)

    sites = []
    for site, module_name in SITE_MODULES:
        if site == "TikTok":
            sites.append(
                {
                    "site": "TikTok",
                    "status": tiktok_result["status"],
                    "url": tiktok_result["url"],
                    "note": tiktok_result["note"],
                }
            )
            continue

        result = results_by_site.get(site)
        if module_name is None:
            status = "unknown"
            note = "Email-based registration checks are not available for this site."
        elif scan_error:
            status = "unknown"
            note = scan_error
        elif result is None:
            status = "unknown"
            note = "The registration check did not return a result."
        elif result.status == Status.TAKEN:
            status = "detected"
            note = None
        elif result.status == Status.AVAILABLE:
            status = "not_detected"
            note = (
                "No registration was detected; this does not prove no account exists."
            )
        else:
            status = "unknown"
            note = (
                result.get_reason() or "The site did not provide a conclusive result."
            )

        sites.append(
            {
                "site": site,
                "status": status,
                "url": result.url or None if result else None,
                "note": note,
            }
        )

    return {
        "email": email,
        "results": sites,
        "meta": {
            "checked": len(modules) + 1,
            "detected": sum(result["status"] == "detected" for result in sites),
            "unknown": sum(result["status"] == "unknown" for result in sites),
        },
    }
