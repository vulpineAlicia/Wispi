"""convert string primary keys to native uuid type

Revision ID: 0003
Revises: 0002
Create Date: 2026-04-09

"""
from typing import Sequence, Union

from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop FK constraints before altering the columns they reference/use
    op.drop_constraint("refresh_tokens_user_id_fkey", "refresh_tokens", type_="foreignkey")
    op.drop_constraint("favorite_cities_user_id_fkey", "favorite_cities", type_="foreignkey")

    # Cast all VARCHAR(36) UUID columns to the native uuid type.
    # These are hardcoded table/column names from our own schema — not user input.
    UUID_COLUMNS: list[tuple[str, str]] = [
        ("users", "id"),
        ("refresh_tokens", "id"),
        ("refresh_tokens", "user_id"),
        ("favorite_cities", "id"),
        ("favorite_cities", "user_id"),
    ]
    for table, col in UUID_COLUMNS:
        op.execute(f"ALTER TABLE {table} ALTER COLUMN {col} TYPE uuid USING {col}::uuid")

    # Re-add FK constraints
    op.create_foreign_key(
        "refresh_tokens_user_id_fkey",
        "refresh_tokens", "users",
        ["user_id"], ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "favorite_cities_user_id_fkey",
        "favorite_cities", "users",
        ["user_id"], ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("refresh_tokens_user_id_fkey", "refresh_tokens", type_="foreignkey")
    op.drop_constraint("favorite_cities_user_id_fkey", "favorite_cities", type_="foreignkey")

    UUID_COLUMNS: list[tuple[str, str]] = [
        ("users", "id"),
        ("refresh_tokens", "id"),
        ("refresh_tokens", "user_id"),
        ("favorite_cities", "id"),
        ("favorite_cities", "user_id"),
    ]
    for table, col in UUID_COLUMNS:
        op.execute(f"ALTER TABLE {table} ALTER COLUMN {col} TYPE varchar(36) USING {col}::text")

    op.create_foreign_key(
        "refresh_tokens_user_id_fkey",
        "refresh_tokens", "users",
        ["user_id"], ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "favorite_cities_user_id_fkey",
        "favorite_cities", "users",
        ["user_id"], ["id"],
        ondelete="CASCADE",
    )
