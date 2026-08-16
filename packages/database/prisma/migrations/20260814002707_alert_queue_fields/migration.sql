-- AlterTable
ALTER TABLE "alerts" ADD COLUMN     "acknowledgedAt" TIMESTAMPTZ(6),
ADD COLUMN     "assignedToUserId" UUID,
ADD COLUMN     "disposition" TEXT,
ADD COLUMN     "resolutionNotes" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "alerts_assignedToUserId_idx" ON "alerts"("assignedToUserId");
