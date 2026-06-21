from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

auth_limits = limiter.shared_limit("5/minute", scope="auth")
general_limits = limiter.shared_limit("100/minute", scope="general")
