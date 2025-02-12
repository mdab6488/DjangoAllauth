from rest_framework.throttling import AnonRateThrottle

class EmailVerificationRateThrottle(AnonRateThrottle):
    rate = '5/hour'

class LoginRateThrottle(AnonRateThrottle):
    rate = '5/minute'