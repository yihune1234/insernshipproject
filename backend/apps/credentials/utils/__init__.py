from dataclasses import dataclass, field


@dataclass
class SyncResult:
    processed: int = 0
    created: int = 0
    updated: int = 0
    failed: int = 0
    skipped: int = 0
    errors: list = field(default_factory=list)
