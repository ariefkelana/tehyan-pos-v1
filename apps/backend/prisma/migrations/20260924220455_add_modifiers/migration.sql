-- AlterTable
ALTER TABLE `order_items` ADD COLUMN `modifiers` TEXT NULL;

-- CreateTable
CREATE TABLE `product_modifiers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `isRequired` BOOLEAN NOT NULL DEFAULT false,
    `multiple` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `modifier_options` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `modifierId` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `additionalPrice` DECIMAL(10, 2) NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `product_modifiers` ADD CONSTRAINT `product_modifiers_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `modifier_options` ADD CONSTRAINT `modifier_options_modifierId_fkey` FOREIGN KEY (`modifierId`) REFERENCES `product_modifiers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
