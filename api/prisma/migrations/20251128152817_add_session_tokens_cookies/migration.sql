-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "public_ip" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utmvc_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "session_id" TEXT NOT NULL,

    CONSTRAINT "utmvc_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reese84_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "renew_in_sec" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "session_id" TEXT NOT NULL,

    CONSTRAINT "reese84_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cookies" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "path" TEXT NOT NULL DEFAULT '/',
    "max_age" INTEGER,
    "secure" BOOLEAN NOT NULL DEFAULT true,
    "http_only" BOOLEAN NOT NULL DEFAULT true,
    "session_id" TEXT NOT NULL,

    CONSTRAINT "cookies_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "utmvc_tokens" ADD CONSTRAINT "utmvc_tokens_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reese84_tokens" ADD CONSTRAINT "reese84_tokens_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cookies" ADD CONSTRAINT "cookies_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
