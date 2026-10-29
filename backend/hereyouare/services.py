import contextlib
import io
import logging

from user_scanner.core.email_orchestrator import run_email_module_batch
from user_scanner.core.helpers import ScanConfig, set_global_timeout
from user_scanner.core.result import Status
from user_scanner.email_scan.social import facebook, instagram

logger = logging.getLogger(__name__)

set_global_timeout(10)

CONFIG = ScanConfig(allow_loud=False, no_nsfw=True)

SITE_MODULES = (
    ("Instagram", "instagram"),
    ("TikTok", None),
    ("Facebook", "facebook"),
    ("YouTube", None),
)


def run_lookup(email: str) -> dict:
    modules = []
    module_sites = {}

    for site, module_name in SITE_MODULES:
        if module_name is None:
            continue
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

    sites = []
    for site, module_name in SITE_MODULES:
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
            note = "No registration was detected; this does not prove no account exists."
        else:
            status = "unknown"
            note = result.get_reason() or "The site did not provide a conclusive result."

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
            "checked": len(modules),
            "detected": sum(result["status"] == "detected" for result in sites),
            "unknown": sum(result["status"] == "unknown" for result in sites),
        },
    }
