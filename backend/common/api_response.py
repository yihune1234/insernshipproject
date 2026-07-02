from rest_framework.response import Response


def success_response(data=None, message=None, status_code=200):
    payload = {"success": True, "data": data}
    if message is not None:
        payload["message"] = message
    return Response(payload, status=status_code)


def error_response(errors=None, message=None, status_code=400):
    payload = {"success": False, "errors": errors}
    if message is not None:
        payload["message"] = message
    return Response(payload, status=status_code)
