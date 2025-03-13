import { MigrationInterface, QueryRunner } from "typeorm";

export class NewEntitiesadded1741898436284 implements MigrationInterface {
    name = 'NewEntitiesadded1741898436284'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`additional_resources\` CHANGE \`additionalResourcesId\` \`userId\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`courses\` ADD \`userId\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`additional_resources\` DROP COLUMN \`userId\``);
        await queryRunner.query(`ALTER TABLE \`additional_resources\` ADD \`userId\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`courses\` ADD CONSTRAINT \`FK_8e0ef34f8d606c64586e698abc1\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`courses\` DROP FOREIGN KEY \`FK_8e0ef34f8d606c64586e698abc1\``);
        await queryRunner.query(`ALTER TABLE \`additional_resources\` DROP COLUMN \`userId\``);
        await queryRunner.query(`ALTER TABLE \`additional_resources\` ADD \`userId\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`courses\` DROP COLUMN \`userId\``);
        await queryRunner.query(`ALTER TABLE \`additional_resources\` CHANGE \`userId\` \`additionalResourcesId\` varchar(255) NOT NULL`);
    }

}
