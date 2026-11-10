import re


class ApiError(Exception):
    def __init__(self, status, detail):
        super().__init__(detail)
        self.status = status
        self.detail = detail


def normalize_phone_number(phone_number):
    digits = re.sub(r'\D', '', phone_number or '')

    if digits.startswith('261'):
        normalized = digits
    elif digits.startswith('0') and len(digits) == 10:
        normalized = f'261{digits[1:]}'
    else:
        normalized = digits

    if len(normalized) < 9 or len(normalized) > 15:
        raise ValueError('Le numéro de téléphone est invalide.')

    return f'+{normalized}'


def normalize_phone_or_error(phone_number, status=400):
    try:
        return normalize_phone_number(phone_number)
    except ValueError as error:
        raise ApiError(status, str(error)) from error
