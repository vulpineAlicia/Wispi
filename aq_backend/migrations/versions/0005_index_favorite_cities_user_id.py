"""index favorite_cities.user_id

Revision ID: 0005
Revises: 0004
Create Date: 2026-05-01

"""
from typing import Sequence, Union

from alembic import op

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index("ix_favorite_cities_user_id", "favorite_cities", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_favorite_cities_user_id", table_name="favorite_cities")
