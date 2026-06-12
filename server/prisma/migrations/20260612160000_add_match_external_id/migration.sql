-- AlterTable
ALTER TABLE `Match` ADD COLUMN `externalId` VARCHAR(191) NULL;
ALTER TABLE `Match` ADD UNIQUE INDEX `Match_externalId_key`(`externalId`);
