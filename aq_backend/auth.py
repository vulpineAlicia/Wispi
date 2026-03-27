""" Auth helpers: nickname generation, password hashing, JWT """

from __future__ import annotations

import hashlib
import random
import secrets
from datetime import UTC, datetime, timedelta

import bcrypt
from jose import JWTError, jwt

from aq_backend.config import get_settings

_ADJECTIVES = [
    "bouncy", "bubbly", "cheeky", "clumsy", "cozy", "cranky", "creaky",
    "crispy", "cuddly", "curly", "derpy", "dizzy", "dopey", "doughy",
    "dreamy", "droopy", "fluffy", "frosty", "fuzzy", "giddy", "giggly",
    "gloomy", "goofy", "grumpy", "gummy", "happy", "jolly", "jumpy",
    "lazy", "loopy", "lumpy", "misty", "moody", "mushy", "noisy", "noodle",
    "peppy", "plump", "pokey", "puffy", "quirky", "rusty", "sassy",
    "silly", "sleepy", "slimy", "slippery", "sloppy", "slushy", "sneaky",
    "snoozy", "snuggly", "soggy", "spongy", "spooky", "spunky", "squiggly",
    "squirmy", "starry", "stinky", "stompy", "stormy", "stretchy", "sunny",
    "squishy", "tiny", "toasty", "twirly", "whimsy", "wiggly", "wobbly",
    "woozy", "wriggly", "zany", "zippy",
]

_NOUNS = [
    "axolotl", "badger", "beaver", "blobfish", "capybara", "catfish",
    "chipmunk", "dodo", "dugong", "ferret", "flamingo", "fox", "gecko",
    "hamster", "hedgehog", "jellyfish", "lemur", "llama", "manatee",
    "marmot", "mongoose", "narwhal", "newt", "octopus", "pangolin",
    "platypus", "possum", "puffin", "quokka", "raccoon", "salamander",
    "sloth", "snail", "squid", "tapir", "walrus", "weasel", "wombat",
]

_AVATAR_COUNT = 10


def generate_nickname() -> str:
    return f"{random.choice(_ADJECTIVES)}-{random.choice(_NOUNS)}"


def random_avatar_id() -> int:
    return random.randint(0, _AVATAR_COUNT - 1)


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_access_token(user_id: str, nickname: str, avatar_id: int) -> str:
    settings = get_settings()
    now = datetime.now(UTC)
    payload = {
        "sub": user_id,
        "nickname": nickname,
        "avatar_id": avatar_id,
        "exp": now + timedelta(minutes=settings.access_token_expire_minutes),
        "iat": now,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_refresh_token() -> tuple[str, datetime]:
    settings = get_settings()
    raw = secrets.token_urlsafe(32)
    expires_at = datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)
    return raw, expires_at


def decode_access_token(token: str) -> dict:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise ValueError("Invalid or expired token") from exc
