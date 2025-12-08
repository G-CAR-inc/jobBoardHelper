-- CreateTable
CREATE TABLE "job_listings" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "company_name" TEXT,
    "status" TEXT NOT NULL,
    "salary" TEXT,
    "location" TEXT,
    "industry" TEXT,
    "employment_type" TEXT,
    "education_level" TEXT,
    "work_experience" TEXT,
    "posted_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicants" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "nationality" TEXT,
    "current_position" TEXT,
    "current_company" TEXT,
    "education_level" TEXT,
    "total_experience" TEXT,
    "salary_expectation" TEXT,
    "cv_url" TEXT,
    "photo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applicants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "is_rejected" BOOLEAN NOT NULL DEFAULT false,
    "is_viewed" BOOLEAN NOT NULL DEFAULT false,
    "relevancy_score" DOUBLE PRECISION,
    "applied_at" TIMESTAMP(3) NOT NULL,
    "db_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_job_id_applicant_id_key" ON "job_applications"("job_id", "applicant_id");

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
