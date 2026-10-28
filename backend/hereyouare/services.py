import asyncio
import contextlib
import io

from user_scanner.core import engine
from user_scanner.core.email_orchestrator import run_email_category_batch
from user_scanner.core.helpers import ScanConfig, load_categories, set_global_timeout
from user_scanner.core.orchestrator import run_user_category
from user_scanner.core.result import Status

set_global_timeout(10)

CONFIG = ScanConfig(allow_loud=False)


def run_lookup(kind: str, target: str) -> dict:
    is_email = kind == "email"
    category_path = load_categories(is_email=is_email)["social"]

    runner = run_email_category_batch if is_email else run_user_category

    with contextlib.redirect_stdout(io.StringIO()):
        results = runner(category_path, target, CONFIG)

    found = [
        {"website": r.site_name, "url": r.url or None}
        for r in results
        if r.status == Status.TAKEN
    ]

    return {
        "results": sorted(found, key=lambda item: item["website"].lower()),
        "meta": {
            "checked": len(results),
            "found": len(found),
            "errors": sum(r.status == Status.ERROR for r in results),
            "skipped": sum(r.status == Status.SKIPPED for r in results),
        },
    }
