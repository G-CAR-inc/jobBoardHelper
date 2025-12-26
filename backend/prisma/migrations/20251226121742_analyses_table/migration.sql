-- CreateTable
CREATE TABLE "application_analyses" (
    "id" SERIAL NOT NULL,
    "application_id" TEXT NOT NULL,
    "age_verdict" BOOLEAN NOT NULL,
    "driver_license_verdict" BOOLEAN NOT NULL,
    "residence_verdict" BOOLEAN NOT NULL,
    "visa_verdict" BOOLEAN NOT NULL,
    "estimated_age" INTEGER,
    "visa_status" TEXT,
    "age_reason" TEXT,
    "driver_license_reason" TEXT,
    "residence_reason" TEXT,
    "visa_reason" TEXT,
    "raw_response" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "application_analyses_application_id_key" ON "application_analyses"("application_id");

-- AddForeignKey
ALTER TABLE "application_analyses" ADD CONSTRAINT "application_analyses_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
