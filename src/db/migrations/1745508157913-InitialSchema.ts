import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1745508157913 implements MigrationInterface {
  name = 'InitialSchema1745508157913';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "vehicle_makes" ("makeId" integer NOT NULL, "makeName" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2059572e00761ac87de2db5dcb8" PRIMARY KEY ("makeId"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "vehicle_types" ("id" SERIAL NOT NULL, "typeId" integer NOT NULL, "typeName" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "makeId" integer NOT NULL, CONSTRAINT "PK_73d1e40f4add7f4f6947acad3a8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_types" ADD CONSTRAINT "FK_049df82f9f3172c75de41839d28" FOREIGN KEY ("makeId") REFERENCES "vehicle_makes"("makeId") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicle_types" DROP CONSTRAINT "FK_049df82f9f3172c75de41839d28"`,
    );
    await queryRunner.query(`DROP TABLE "vehicle_types"`);
    await queryRunner.query(`DROP TABLE "vehicle_makes"`);
  }
}
