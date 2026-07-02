import functools

from django.core.cache import cache

from common.api_response import error_response


def rate_limit(requests_per_minute=60):
    def decorator(view_func):
        @functools.wraps(view_func)
        def wrapper(request_or_self, *args, **kwargs):
            if hasattr(request_or_self, "method"):
                request = request_or_self
            else:
                request = args[0] if args else None

            if request is None:
                return view_func(request_or_self, *args, **kwargs)

            ip = request.META.get("HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR", "unknown"))
            view_name = view_func.__name__
            cache_key = f"rate_limit:{view_name}:{ip}"

            count = cache.get(cache_key, 0)
            if count >= requests_per_minute:
                return error_response(
                    errors="Too many requests",
                    message="Rate limit exceeded",
                    status_code=429,
                )
            cache.set(cache_key, count + 1, timeout=60)
            return view_func(request_or_self, *args, **kwargs)

        return wrapper

    return decorator
