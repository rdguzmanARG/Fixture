-- AlterTable: replace email and name with username
ALTER TABLE `User` ADD COLUMN `username` VARCHAR(191) NOT NULL DEFAULT '';
UPDATE `User` SET `username` = `email`;
ALTER TABLE `User` DROP INDEX `User_email_key`;
ALTER TABLE `User` DROP COLUMN `email`;
ALTER TABLE `User` DROP COLUMN `name`;
ALTER TABLE `User` ADD UNIQUE INDEX `User_username_key`(`username`);
ALTER TABLE `User` ALTER COLUMN `username` DROP DEFAULT;
