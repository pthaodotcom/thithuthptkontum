-- Reserved migration number.
--
-- Acceptance fixtures were moved to ../seed_acceptance_phase2.sql because they
-- create known-password test accounts and must never be applied automatically
-- as part of a cloud schema deployment.
select 1;
