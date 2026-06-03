-- Add a group-role label to personas, distinct from the persona's person name.
ALTER TABLE "personas" ADD COLUMN "role" TEXT NOT NULL DEFAULT '';
