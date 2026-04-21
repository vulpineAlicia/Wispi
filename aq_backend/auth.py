""" Auth helpers: nickname generation, password hashing, JWT """

from __future__ import annotations

import hashlib
import random
import secrets
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from aq_backend.config import get_settings

_ADJECTIVES = [
    "bouncy", "breezy", "bubbly", "bumpy",
    "cheeky", "chilly", "chunky", "clumsy", "clunky", "cozy", "cranky",
    "creaky", "crinkly", "crispy", "cuddly", "curly",
    "derpy", "dizzy", "dopey", "doughy", "dreamy", "droopy",
    "flaky", "floppy", "fluffy", "frilly", "frizzy", "frosty", "fuzzy",
    "giddy", "giggly", "gloomy", "gnarly", "goofy", "groovy", "grubby",
    "grumpy", "gummy",
    "happy", "hefty",
    "jiggly", "jolly", "jumpy",
    "lanky", "lazy", "leafy", "loopy", "lumpy",
    "melty", "messy", "minty", "misty", "moody", "mossy", "munchy",
    "murky", "mushy",
    "nifty", "noisy", "noodle", "nutty",
    "peppy", "perky", "plucky", "plump", "pokey", "poofy", "prickly",
    "pudgy", "puffy",
    "quirky",
    "rainy", "rowdy", "rusty",
    "sassy", "scruffy", "shaggy", "shaky", "shrimpy", "silly", "sketchy",
    "sleepy", "slimy", "slippery", "sloppy", "slushy", "slumpy", "smiley",
    "smoky", "snappy", "snarky", "snazzy", "sneaky", "snoozy", "snuggly",
    "soggy", "sparkly", "spiky", "splashy", "spongy", "spooky", "spunky",
    "springy", "squashy", "squiggly", "squirmy", "squishy", "starry",
    "stinky", "stompy", "stormy", "stretchy", "stripey", "stumpy", "stuffy",
    "sunny", "swampy",
    "tangy", "teeny", "tickly", "tiny", "toasty", "twirly", "twisty",
    "velvety",
    "waggy", "warty", "waxy", "whimsy", "whirly", "wiggly", "wispy",
    "wobbly", "woozy", "wriggly",
    "yucky",
    "zany", "zesty", "zingy", "zippy",
]

_NOUNS = [
    "alpaca", "armadillo", "axolotl",
    "baboon", "badger", "beaver", "blobfish", "bobcat", "bumblebee",
    "butterfly",
    "camel", "capybara", "cassowary", "catfish", "chameleon", "cheetah",
    "chinchilla", "chipmunk", "cockatoo", "coyote", "crane", "crow",
    "dodo", "dolphin", "donkey", "dragonfly", "duck", "dugong",
    "eagle", "eel",
    "falcon", "ferret", "firefly", "flamingo", "fox", "frog",
    "gecko", "gibbon", "giraffe", "goat", "gorilla", "grasshopper",
    "groundhog",
    "hamster", "hedgehog", "hummingbird", "hyena",
    "iguana",
    "jackal", "jaguar", "jellyfish",
    "kangaroo", "koala", "kookaburra",
    "lemur", "llama", "lobster", "lynx",
    "macaw", "magpie", "manatee", "marmot", "meerkat", "mole", "mongoose",
    "moose", "moth", "mouse",
    "narwhal", "newt",
    "octopus", "ocelot", "okapi", "orca", "ostrich", "otter", "owl",
    "panda", "pangolin", "parrot", "peacock", "pelican", "penguin",
    "platypus", "porcupine", "possum", "puffin",
    "quail", "quokka",
    "rabbit", "raccoon", "raven", "rhino", "rooster",
    "salamander", "seahorse", "seal", "shark", "skunk", "sloth", "snail",
    "sparrow", "squid", "starfish", "stork", "swan",
    "tapir", "toad", "tortoise", "toucan", "turtle",
    "vulture",
    "wallaby", "walrus", "weasel", "whale", "wolf", "wombat", "woodpecker",
    "yak",
    "zebra",
]

_AVATAR_COUNT = 10


def generate_nickname() -> str:
    adj1, adj2 = random.sample(_ADJECTIVES, 2)
    noun = random.choice(_NOUNS)
    return f"{adj1}-{adj2}-{noun}"


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
    except jwt.PyJWTError as exc:
        raise ValueError("Invalid or expired token") from exc
