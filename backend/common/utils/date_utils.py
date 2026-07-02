from datetime import datetime, timezone


def format_date(dt: datetime) -> str:
    if dt is None:
        return None
    return dt.strftime("%B %d, %Y %H:%M")


def is_expired(dt: datetime) -> bool:
    if dt is None:
        return False
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt < now


def format_iso(dt: datetime) -> str:
    if dt is None:
        return None
    return dt.isoformat()
