-- DropForeignKey
ALTER TABLE `e1_emprestimo` DROP FOREIGN KEY `E1_emprestimo_c1_id_fkey`;

-- DropForeignKey
ALTER TABLE `l1_lancamento` DROP FOREIGN KEY `L1_lancamento_f1_id_fkey`;

-- DropForeignKey
ALTER TABLE `p1_parcela` DROP FOREIGN KEY `P1_parcela_e1_id_fkey`;

-- AddForeignKey
ALTER TABLE `e1_emprestimo` ADD CONSTRAINT `e1_emprestimo_c1_id_fkey` FOREIGN KEY (`c1_id`) REFERENCES `c1_cliente`(`c1_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `p1_parcela` ADD CONSTRAINT `p1_parcela_e1_id_fkey` FOREIGN KEY (`e1_id`) REFERENCES `e1_emprestimo`(`e1_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `l1_lancamento` ADD CONSTRAINT `l1_lancamento_f1_id_fkey` FOREIGN KEY (`f1_id`) REFERENCES `f1_colaborador`(`f1_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `config` RENAME INDEX `Config_chave_key` TO `config_chave_key`;
