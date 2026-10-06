ALTER TABLE "Couple"
  ADD CONSTRAINT couple_member_count_check
  CHECK ("memberCount" >= 0 AND "memberCount" <= 2);