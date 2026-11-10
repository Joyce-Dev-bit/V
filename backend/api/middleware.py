from django.conf import settings
from django.http import HttpResponse


class CorsMiddleware:
    """Autorise uniquement les origines configurées à appeler l'API."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        origin = request.headers.get('Origin')
        allowed = origin in settings.CORS_ALLOWED_ORIGINS
        is_preflight = request.method == 'OPTIONS' and 'Access-Control-Request-Method' in request.headers
        response = HttpResponse(status=204) if is_preflight else self.get_response(request)

        if allowed:
            response['Access-Control-Allow-Origin'] = origin
            response['Vary'] = 'Origin'
            if is_preflight:
                response['Access-Control-Allow-Methods'] = 'GET, POST, DELETE, OPTIONS'
                response['Access-Control-Allow-Headers'] = 'Content-Type, X-Phone-Number'
                response['Access-Control-Max-Age'] = '600'
        return response
