-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `isAdmin` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Team` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `flag` VARCHAR(191) NOT NULL,
    `group` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Team_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Match` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `matchNumber` INTEGER NOT NULL,
    `homeTeamId` INTEGER NULL,
    `awayTeamId` INTEGER NULL,
    `homeTeamLabel` VARCHAR(191) NULL,
    `awayTeamLabel` VARCHAR(191) NULL,
    `round` VARCHAR(191) NOT NULL,
    `group` VARCHAR(191) NULL,
    `matchDay` INTEGER NULL,
    `date` DATETIME(3) NULL,
    `venue` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `homeScore` INTEGER NULL,
    `awayScore` INTEGER NULL,
    `isLocked` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Match_matchNumber_key`(`matchNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Prediction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `matchId` INTEGER NOT NULL,
    `homeScore` INTEGER NOT NULL,
    `awayScore` INTEGER NOT NULL,
    `points` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Prediction_userId_matchId_key`(`userId`, `matchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_homeTeamId_fkey` FOREIGN KEY (`homeTeamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_awayTeamId_fkey` FOREIGN KEY (`awayTeamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prediction` ADD CONSTRAINT `Prediction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prediction` ADD CONSTRAINT `Prediction_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
