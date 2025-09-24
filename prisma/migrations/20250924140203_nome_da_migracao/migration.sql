-- AlterTable
ALTER TABLE `c1_cliente` ADD COLUMN `c1_cpf` VARCHAR(20) NULL;

-- CreateTable
CREATE TABLE `F1_colaborador` (
    `f1_id` INTEGER NOT NULL AUTO_INCREMENT,
    `f1_nome` VARCHAR(100) NOT NULL,
    `f1_email` VARCHAR(100) NULL,
    `f1_telefone` VARCHAR(20) NULL,
    `f1_cargo` VARCHAR(50) NULL,
    `f1_salario` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `f1_status` VARCHAR(20) NOT NULL DEFAULT 'ativo',
    `f1_createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `f1_updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`f1_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `L1_lancamento` (
    `l1_id` INTEGER NOT NULL AUTO_INCREMENT,
    `f1_id` INTEGER NULL,
    `descricao` VARCHAR(200) NOT NULL,
    `valor` DECIMAL(10, 2) NOT NULL,
    `tipo` VARCHAR(20) NOT NULL,
    `data_lancamento` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `l1_createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `l1_updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`l1_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `C1_caixa` (
    `c1_id` INTEGER NOT NULL AUTO_INCREMENT,
    `descricao` VARCHAR(100) NOT NULL,
    `saldo_inicial` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `saldo_atual` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `c1_createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `c1_updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`c1_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Config` (
    `config_id` INTEGER NOT NULL AUTO_INCREMENT,
    `chave` VARCHAR(100) NOT NULL,
    `valor` TEXT NOT NULL,
    `config_createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `config_updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Config_chave_key`(`chave`),
    PRIMARY KEY (`config_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `L1_lancamento` ADD CONSTRAINT `L1_lancamento_f1_id_fkey` FOREIGN KEY (`f1_id`) REFERENCES `F1_colaborador`(`f1_id`) ON DELETE SET NULL ON UPDATE CASCADE;
