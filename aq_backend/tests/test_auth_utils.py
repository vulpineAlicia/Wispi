import pytest

from aq_backend.auth.utils import (
    create_access_token,
    decode_access_token,
    generate_nickname,
    hash_password,
    hash_token,
    random_avatar_id,
    verify_password,
)


def test_password_round_trip():
    h = hash_password("secret123")
    assert verify_password("secret123", h)


def test_wrong_password_rejected():
    h = hash_password("correct")
    assert not verify_password("wrong", h)


def test_same_password_produces_different_hashes():
    # bcrypt salts each hash
    assert hash_password("abc") != hash_password("abc")


def test_hash_token_is_deterministic():
    assert hash_token("token") == hash_token("token")


def test_hash_token_differs_for_different_inputs():
    assert hash_token("a") != hash_token("b")


def test_generate_nickname_has_three_parts():
    parts = generate_nickname().split("-")
    assert len(parts) == 3


def test_generate_nickname_parts_are_alpha():
    assert all(p.isalpha() for p in generate_nickname().split("-"))


def test_random_avatar_id_in_range():
    for _ in range(50):
        assert 0 <= random_avatar_id() <= 9


def test_access_token_round_trip():
    token = create_access_token("uid-123", "fluffy-cat", 3)
    payload = decode_access_token(token)
    assert payload["sub"] == "uid-123"
    assert payload["nickname"] == "fluffy-cat"
    assert payload["avatar_id"] == 3


def test_decode_garbage_token_raises():
    with pytest.raises(ValueError, match="Invalid or expired"):
        decode_access_token("not.a.jwt")


def test_decode_tampered_token_raises():
    token = create_access_token("uid", "nick", 0)
    with pytest.raises(ValueError):
        decode_access_token(token + "x")
