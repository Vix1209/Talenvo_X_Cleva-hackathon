import { MigrationInterface, QueryRunner } from "typeorm";

export class SetupForProduction1741981360823 implements MigrationInterface {
    name = 'SetupForProduction1741981360823'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`roles\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL DEFAULT 'student', \`description\` text NULL, \`updateDate\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`createDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`deleteDate\` datetime(6) NULL, UNIQUE INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`additional_resources\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL, \`description\` text NULL, \`type\` enum ('PDF', 'IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT', 'LINK', 'TEXT') NOT NULL DEFAULT 'LINK', \`url\` varchar(255) NOT NULL, \`fileSize\` int NULL, \`mimeType\` varchar(255) NULL, \`courseId\` varchar(255) NOT NULL, \`userId\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`uploadedById\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`quiz\` (\`id\` varchar(36) NOT NULL, \`header\` varchar(255) NOT NULL, \`question\` varchar(255) NOT NULL, \`options\` json NOT NULL, \`courseId\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`downloadable_resources\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`url\` varchar(255) NOT NULL, \`type\` varchar(255) NOT NULL, \`size\` bigint NULL, \`lastModified\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`courseId\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`courses\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL, \`description\` varchar(255) NOT NULL, \`videoUrl\` varchar(255) NOT NULL, \`topics\` json NOT NULL, \`isOfflineAccessible\` tinyint NOT NULL DEFAULT 0, \`downloadCount\` int NOT NULL DEFAULT '0', \`lastSyncedAt\` datetime NULL, \`userId\` varchar(255) NOT NULL, \`duration\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`comments\` (\`id\` varchar(36) NOT NULL, \`comment\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`courseId\` varchar(255) NOT NULL, \`userId\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`firstName\` varchar(255) NOT NULL, \`lastName\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`phoneNumber\` varchar(255) NULL, \`profileImage\` varchar(255) NULL, \`address\` varchar(255) NULL, \`status\` varchar(255) NOT NULL DEFAULT 'active', \`gender\` varchar(255) NULL, \`verificationToken\` varchar(255) NULL, \`isVerified\` tinyint NOT NULL DEFAULT 0, \`isResetTokenVerified\` tinyint NOT NULL DEFAULT 0, \`resetToken\` varchar(255) NULL, \`resetTokenExpiry\` datetime NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`roleId\` int NULL, UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`student_profile\` (\`id\` varchar(36) NOT NULL, \`phoneNumber\` varchar(255) NOT NULL, \`profilePicture\` varchar(255) NULL, \`gradeLevel\` varchar(255) NULL, \`preferredSubjects\` text NULL, \`learningGoals\` text NULL, \`totalLessonsCompleted\` text NULL, \`averageQuizScore\` text NULL, \`badgesEarned\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` varchar(36) NULL, UNIQUE INDEX \`REL_940639e2ce4b06e9857bbef0c9\` (\`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`teacher_profile\` (\`id\` varchar(36) NOT NULL, \`phoneNumber\` varchar(255) NOT NULL, \`profilePicture\` varchar(255) NULL, \`bio\` text NULL, \`subjectsTaught\` text NULL, \`educationLevel\` varchar(255) NULL, \`teachingExperience\` int NULL, \`certifications\` text NULL, \`rating\` text NULL, \`totalCourses\` int NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` varchar(36) NULL, UNIQUE INDEX \`REL_73d2cd95a8ca63731f7a6bfbc0\` (\`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`admin_profile\` (\`id\` varchar(36) NOT NULL, \`phoneNumber\` varchar(255) NOT NULL, \`profilePicture\` varchar(255) NULL, \`lastLogin\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` varchar(36) NULL, UNIQUE INDEX \`REL_1a272d44c2214c1e8b22a886d6\` (\`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`course_progress\` (\`id\` varchar(36) NOT NULL, \`userId\` varchar(255) NOT NULL, \`courseId\` varchar(255) NOT NULL, \`progressPercentage\` float NOT NULL DEFAULT '0', \`isCompleted\` tinyint NOT NULL DEFAULT 0, \`isDownloadedOffline\` tinyint NOT NULL DEFAULT 0, \`offlineAccessHistory\` json NULL, \`lastPosition\` float NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`additional_resources\` ADD CONSTRAINT \`FK_4b568854fcd8482dad2d62589ad\` FOREIGN KEY (\`courseId\`) REFERENCES \`courses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`additional_resources\` ADD CONSTRAINT \`FK_3d1321de4a6f6301ee198c9491f\` FOREIGN KEY (\`uploadedById\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`quiz\` ADD CONSTRAINT \`FK_f74ae73a766eea8e0dfb09816ba\` FOREIGN KEY (\`courseId\`) REFERENCES \`courses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`downloadable_resources\` ADD CONSTRAINT \`FK_6cd8593054c211a8547b8fa1410\` FOREIGN KEY (\`courseId\`) REFERENCES \`courses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`courses\` ADD CONSTRAINT \`FK_8e0ef34f8d606c64586e698abc1\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`comments\` ADD CONSTRAINT \`FK_1285c5358820338d98c3f436f12\` FOREIGN KEY (\`courseId\`) REFERENCES \`courses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`comments\` ADD CONSTRAINT \`FK_7e8d7c49f218ebb14314fdb3749\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_368e146b785b574f42ae9e53d5e\` FOREIGN KEY (\`roleId\`) REFERENCES \`roles\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`student_profile\` ADD CONSTRAINT \`FK_940639e2ce4b06e9857bbef0c90\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`teacher_profile\` ADD CONSTRAINT \`FK_73d2cd95a8ca63731f7a6bfbc0b\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`admin_profile\` ADD CONSTRAINT \`FK_1a272d44c2214c1e8b22a886d61\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`course_progress\` ADD CONSTRAINT \`FK_29a49682b3b764662029ec6a1cb\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`course_progress\` ADD CONSTRAINT \`FK_2cfdeb07b732bd12041e29bf328\` FOREIGN KEY (\`courseId\`) REFERENCES \`courses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`course_progress\` DROP FOREIGN KEY \`FK_2cfdeb07b732bd12041e29bf328\``);
        await queryRunner.query(`ALTER TABLE \`course_progress\` DROP FOREIGN KEY \`FK_29a49682b3b764662029ec6a1cb\``);
        await queryRunner.query(`ALTER TABLE \`admin_profile\` DROP FOREIGN KEY \`FK_1a272d44c2214c1e8b22a886d61\``);
        await queryRunner.query(`ALTER TABLE \`teacher_profile\` DROP FOREIGN KEY \`FK_73d2cd95a8ca63731f7a6bfbc0b\``);
        await queryRunner.query(`ALTER TABLE \`student_profile\` DROP FOREIGN KEY \`FK_940639e2ce4b06e9857bbef0c90\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_368e146b785b574f42ae9e53d5e\``);
        await queryRunner.query(`ALTER TABLE \`comments\` DROP FOREIGN KEY \`FK_7e8d7c49f218ebb14314fdb3749\``);
        await queryRunner.query(`ALTER TABLE \`comments\` DROP FOREIGN KEY \`FK_1285c5358820338d98c3f436f12\``);
        await queryRunner.query(`ALTER TABLE \`courses\` DROP FOREIGN KEY \`FK_8e0ef34f8d606c64586e698abc1\``);
        await queryRunner.query(`ALTER TABLE \`downloadable_resources\` DROP FOREIGN KEY \`FK_6cd8593054c211a8547b8fa1410\``);
        await queryRunner.query(`ALTER TABLE \`quiz\` DROP FOREIGN KEY \`FK_f74ae73a766eea8e0dfb09816ba\``);
        await queryRunner.query(`ALTER TABLE \`additional_resources\` DROP FOREIGN KEY \`FK_3d1321de4a6f6301ee198c9491f\``);
        await queryRunner.query(`ALTER TABLE \`additional_resources\` DROP FOREIGN KEY \`FK_4b568854fcd8482dad2d62589ad\``);
        await queryRunner.query(`DROP TABLE \`course_progress\``);
        await queryRunner.query(`DROP INDEX \`REL_1a272d44c2214c1e8b22a886d6\` ON \`admin_profile\``);
        await queryRunner.query(`DROP TABLE \`admin_profile\``);
        await queryRunner.query(`DROP INDEX \`REL_73d2cd95a8ca63731f7a6bfbc0\` ON \`teacher_profile\``);
        await queryRunner.query(`DROP TABLE \`teacher_profile\``);
        await queryRunner.query(`DROP INDEX \`REL_940639e2ce4b06e9857bbef0c9\` ON \`student_profile\``);
        await queryRunner.query(`DROP TABLE \`student_profile\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP TABLE \`comments\``);
        await queryRunner.query(`DROP TABLE \`courses\``);
        await queryRunner.query(`DROP TABLE \`downloadable_resources\``);
        await queryRunner.query(`DROP TABLE \`quiz\``);
        await queryRunner.query(`DROP TABLE \`additional_resources\``);
        await queryRunner.query(`DROP INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` ON \`roles\``);
        await queryRunner.query(`DROP TABLE \`roles\``);
    }

}
