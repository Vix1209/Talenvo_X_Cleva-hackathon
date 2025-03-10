import { MigrationInterface, QueryRunner } from "typeorm";

export class FirstMigration1741613509971 implements MigrationInterface {
    name = 'FirstMigration1741613509971'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`roles\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL DEFAULT 'staff', \`description\` text NULL, \`updateDate\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`createDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`deleteDate\` datetime(6) NULL, UNIQUE INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`student_profile\` (\`id\` varchar(36) NOT NULL, \`votesCast\` int NULL, \`votingHistory\` json NULL, \`voterLevel\` int NULL, \`lastVotedContestant\` varchar(255) NULL, \`userId\` varchar(36) NULL, UNIQUE INDEX \`REL_940639e2ce4b06e9857bbef0c9\` (\`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`teacher_profile\` (\`id\` varchar(36) NOT NULL, \`gender\` enum ('male', 'female') NULL, \`height\` varchar(255) NULL, \`nationality\` varchar(255) NULL, \`instagram\` varchar(255) NULL, \`tiktok\` varchar(255) NULL, \`currentOccupation\` varchar(255) NULL, \`motivation\` varchar(255) NULL, \`bio\` varchar(255) NULL, \`ranking\` int NULL, \`totalVotes\` int NULL, \`portfolioImages\` json NULL, \`userId\` varchar(36) NULL, UNIQUE INDEX \`REL_73d2cd95a8ca63731f7a6bfbc0\` (\`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`admin_profile\` (\`id\` varchar(36) NOT NULL, \`department\` enum ('Operations', 'Finance', 'Marketing', 'Tech Support') NULL, \`permissions\` json NULL, \`lastLogin\` varchar(255) NULL, \`userId\` varchar(36) NULL, UNIQUE INDEX \`REL_1a272d44c2214c1e8b22a886d6\` (\`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`firstName\` varchar(255) NOT NULL, \`lastName\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`phoneNumber\` varchar(255) NULL, \`profileImage\` varchar(255) NULL, \`address\` varchar(255) NULL, \`status\` varchar(255) NOT NULL DEFAULT 'active', \`gender\` varchar(255) NULL, \`verificationToken\` varchar(255) NULL, \`isVerified\` tinyint NOT NULL DEFAULT 0, \`isResetTokenVerified\` tinyint NOT NULL DEFAULT 0, \`resetToken\` varchar(255) NULL, \`resetTokenExpiry\` datetime NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`roleId\` int NULL, UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`student_profile\` ADD CONSTRAINT \`FK_940639e2ce4b06e9857bbef0c90\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`teacher_profile\` ADD CONSTRAINT \`FK_73d2cd95a8ca63731f7a6bfbc0b\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`admin_profile\` ADD CONSTRAINT \`FK_1a272d44c2214c1e8b22a886d61\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_368e146b785b574f42ae9e53d5e\` FOREIGN KEY (\`roleId\`) REFERENCES \`roles\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_368e146b785b574f42ae9e53d5e\``);
        await queryRunner.query(`ALTER TABLE \`admin_profile\` DROP FOREIGN KEY \`FK_1a272d44c2214c1e8b22a886d61\``);
        await queryRunner.query(`ALTER TABLE \`teacher_profile\` DROP FOREIGN KEY \`FK_73d2cd95a8ca63731f7a6bfbc0b\``);
        await queryRunner.query(`ALTER TABLE \`student_profile\` DROP FOREIGN KEY \`FK_940639e2ce4b06e9857bbef0c90\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP INDEX \`REL_1a272d44c2214c1e8b22a886d6\` ON \`admin_profile\``);
        await queryRunner.query(`DROP TABLE \`admin_profile\``);
        await queryRunner.query(`DROP INDEX \`REL_73d2cd95a8ca63731f7a6bfbc0\` ON \`teacher_profile\``);
        await queryRunner.query(`DROP TABLE \`teacher_profile\``);
        await queryRunner.query(`DROP INDEX \`REL_940639e2ce4b06e9857bbef0c9\` ON \`student_profile\``);
        await queryRunner.query(`DROP TABLE \`student_profile\``);
        await queryRunner.query(`DROP INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` ON \`roles\``);
        await queryRunner.query(`DROP TABLE \`roles\``);
    }

}
