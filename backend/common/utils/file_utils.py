import os
import uuid


def get_upload_path(instance, filename, prefix="uploads"):
    ext = filename.rsplit(".", 1)[-1].lower()
    new_name = f"{uuid.uuid4()}.{ext}"
    return os.path.join(prefix, new_name)
