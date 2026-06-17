-- AlterTable
ALTER TABLE "Establishment" ADD COLUMN     "bairro" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "cep" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "cidade" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "complemento" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "estado" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "logradouro" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "numero" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "openingHours" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "types" "EstablishmentType"[] DEFAULT ARRAY[]::"EstablishmentType"[];

-- Backfill: tipos múltiplos começam com o tipo único atual
UPDATE "Establishment" SET "types" = ARRAY["type"]::"EstablishmentType"[] WHERE cardinality("types") = 0;
