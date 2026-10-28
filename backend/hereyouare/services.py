import asyncio

from user_scanner.core import engine
from user_scanner.core.result import Status


async def lookup_email(email):
    result = await engine.check_category("social", email)

    websites = []

    for r in result:
        if r.status == Status.TAKEN:
            websites.append(
                {
                    "website": r.site_name,
                    "url": r.url,
                }
            )

    return websites


async def lookup_username(username):
    raise NotImplementedError("username lookup is not implemented yet")
