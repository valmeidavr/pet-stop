-- CreateEnum
CREATE TYPE "AdoptableSpecies" AS ENUM ('cao', 'gato', 'outro');

-- CreateEnum
CREATE TYPE "AdoptableSize" AS ENUM ('pequeno', 'medio', 'grande');

-- CreateEnum
CREATE TYPE "AdoptableGender" AS ENUM ('macho', 'femea');

-- CreateEnum
CREATE TYPE "BuscaPetType" AS ENUM ('perdido', 'encontrado');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('ativa', 'encerrada');

-- CreateTable
CREATE TABLE "Adoptable" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" "AdoptableSpecies" NOT NULL,
    "breed" TEXT,
    "ageYears" DOUBLE PRECISION NOT NULL,
    "size" "AdoptableSize" NOT NULL,
    "gender" "AdoptableGender" NOT NULL,
    "photo" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "adoptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Adoptable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bannerImage" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "organizer" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'ativa',
    "infoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuscaPetPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "BuscaPetType" NOT NULL,
    "petName" TEXT,
    "species" "AdoptableSpecies" NOT NULL,
    "photo" TEXT NOT NULL,
    "lastSeenLocation" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuscaPetPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Adoptable_slug_key" ON "Adoptable"("slug");

-- CreateIndex
CREATE INDEX "Adoptable_species_idx" ON "Adoptable"("species");

-- CreateIndex
CREATE INDEX "Adoptable_adoptedAt_idx" ON "Adoptable"("adoptedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_slug_key" ON "Campaign"("slug");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "Campaign_startsAt_idx" ON "Campaign"("startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "BuscaPetPost_slug_key" ON "BuscaPetPost"("slug");

-- CreateIndex
CREATE INDEX "BuscaPetPost_type_idx" ON "BuscaPetPost"("type");

-- CreateIndex
CREATE INDEX "BuscaPetPost_resolvedAt_idx" ON "BuscaPetPost"("resolvedAt");
