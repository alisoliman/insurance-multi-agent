"""Create initial PostgreSQL schema."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0001_initial_postgres_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "saved_scenarios",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("locale", sa.Text(), nullable=False),
        sa.Column("claim_type", sa.Text(), nullable=False),
        sa.Column("complexity", sa.Text(), nullable=False),
        sa.Column("scenario_data", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_scenarios_locale", "saved_scenarios", ["locale"])
    op.create_index("idx_scenarios_claim_type", "saved_scenarios", ["claim_type"])
    op.create_index("idx_scenarios_created_at", "saved_scenarios", ["created_at"])

    op.create_table(
        "handlers",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("email", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("email", name="uq_handlers_email"),
    )

    op.create_table(
        "vehicles",
        sa.Column("vin", sa.Text(), primary_key=True),
        sa.Column("scenario_id", sa.Text(), nullable=False),
        sa.Column("policy_number", sa.Text(), nullable=False),
        sa.Column("make", sa.Text(), nullable=False),
        sa.Column("model", sa.Text(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("license_plate", sa.Text(), nullable=False),
        sa.Column("color", sa.Text(), nullable=True),
        sa.Column("vehicle_type", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["scenario_id"], ["saved_scenarios.id"], ondelete="CASCADE"),
    )
    op.create_index("idx_vehicles_policy_number", "vehicles", ["policy_number"])
    op.create_index("idx_vehicles_scenario_id", "vehicles", ["scenario_id"])

    op.create_table(
        "policies",
        sa.Column("policy_number", sa.Text(), primary_key=True),
        sa.Column("scenario_id", sa.Text(), nullable=False),
        sa.Column("policy_type", sa.Text(), nullable=False),
        sa.Column("coverage_types", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("coverage_limits", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("deductible", sa.Numeric(), nullable=False),
        sa.Column("premium", sa.Numeric(), nullable=False),
        sa.Column("effective_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expiration_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("customer_name", sa.Text(), nullable=False),
        sa.Column("customer_email", sa.Text(), nullable=True),
        sa.Column("customer_phone", sa.Text(), nullable=True),
        sa.Column("vin", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["scenario_id"], ["saved_scenarios.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["vin"], ["vehicles.vin"], ondelete="SET NULL"),
    )
    op.create_index("idx_policies_scenario_id", "policies", ["scenario_id"])
    op.create_index("idx_policies_customer", "policies", ["customer_name"])

    op.create_table(
        "claims",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("claimant_name", sa.Text(), nullable=False),
        sa.Column("claimant_id", sa.Text(), nullable=False),
        sa.Column("policy_number", sa.Text(), nullable=False),
        sa.Column("claim_type", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("incident_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("estimated_damage", sa.Numeric(), nullable=True),
        sa.Column("location", sa.Text(), nullable=True),
        sa.Column("status", sa.Text(), nullable=False, server_default=sa.text("'new'")),
        sa.Column("priority", sa.Text(), nullable=False, server_default=sa.text("'medium'")),
        sa.Column("assigned_handler_id", sa.Text(), nullable=True),
        sa.Column("version", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["assigned_handler_id"], ["handlers.id"]),
    )
    op.create_index("idx_claims_status", "claims", ["status"])
    op.create_index("idx_claims_assigned_handler", "claims", ["assigned_handler_id"])
    op.create_index("idx_claims_priority_status", "claims", ["priority", "status"])
    op.create_index("idx_claims_created_at", "claims", ["created_at"])

    op.create_table(
        "ai_assessments",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("claim_id", sa.Text(), nullable=False),
        sa.Column("status", sa.Text(), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("agent_outputs", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("final_recommendation", sa.Text(), nullable=True),
        sa.Column("confidence_scores", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("processing_started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("processing_completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["claim_id"], ["claims.id"]),
    )
    op.create_index("idx_assessments_claim", "ai_assessments", ["claim_id"])
    op.create_index("idx_assessments_status", "ai_assessments", ["status"])

    op.create_table(
        "claim_decisions",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("claim_id", sa.Text(), nullable=False),
        sa.Column("handler_id", sa.Text(), nullable=False),
        sa.Column("decision_type", sa.Text(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("ai_assessment_id", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["claim_id"], ["claims.id"]),
        sa.ForeignKeyConstraint(["handler_id"], ["handlers.id"]),
        sa.ForeignKeyConstraint(["ai_assessment_id"], ["ai_assessments.id"]),
    )
    op.create_index("idx_decisions_claim", "claim_decisions", ["claim_id"])
    op.create_index("idx_decisions_handler", "claim_decisions", ["handler_id"])
    op.create_index("idx_decisions_created_at", "claim_decisions", ["created_at"])

    op.create_table(
        "claim_audit_log",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("claim_id", sa.Text(), nullable=False),
        sa.Column("handler_id", sa.Text(), nullable=True),
        sa.Column("action", sa.Text(), nullable=False),
        sa.Column("old_value", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("new_value", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["claim_id"], ["claims.id"]),
        sa.ForeignKeyConstraint(["handler_id"], ["handlers.id"]),
    )
    op.create_index("idx_audit_claim", "claim_audit_log", ["claim_id"])
    op.create_index("idx_audit_timestamp", "claim_audit_log", ["timestamp"])
    op.create_index("idx_audit_handler", "claim_audit_log", ["handler_id"])


def downgrade() -> None:
    op.drop_index("idx_audit_handler", table_name="claim_audit_log")
    op.drop_index("idx_audit_timestamp", table_name="claim_audit_log")
    op.drop_index("idx_audit_claim", table_name="claim_audit_log")
    op.drop_table("claim_audit_log")

    op.drop_index("idx_decisions_created_at", table_name="claim_decisions")
    op.drop_index("idx_decisions_handler", table_name="claim_decisions")
    op.drop_index("idx_decisions_claim", table_name="claim_decisions")
    op.drop_table("claim_decisions")

    op.drop_index("idx_assessments_status", table_name="ai_assessments")
    op.drop_index("idx_assessments_claim", table_name="ai_assessments")
    op.drop_table("ai_assessments")

    op.drop_index("idx_claims_created_at", table_name="claims")
    op.drop_index("idx_claims_priority_status", table_name="claims")
    op.drop_index("idx_claims_assigned_handler", table_name="claims")
    op.drop_index("idx_claims_status", table_name="claims")
    op.drop_table("claims")

    op.drop_index("idx_policies_customer", table_name="policies")
    op.drop_index("idx_policies_scenario_id", table_name="policies")
    op.drop_table("policies")

    op.drop_index("idx_vehicles_scenario_id", table_name="vehicles")
    op.drop_index("idx_vehicles_policy_number", table_name="vehicles")
    op.drop_table("vehicles")

    op.drop_table("handlers")

    op.drop_index("idx_scenarios_created_at", table_name="saved_scenarios")
    op.drop_index("idx_scenarios_claim_type", table_name="saved_scenarios")
    op.drop_index("idx_scenarios_locale", table_name="saved_scenarios")
    op.drop_table("saved_scenarios")
