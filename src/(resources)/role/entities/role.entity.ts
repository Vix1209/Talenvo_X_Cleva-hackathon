import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'roles' })
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', default: 'staff', unique: true })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @UpdateDateColumn({ nullable: true })
  updateDate?: Date;

  @CreateDateColumn()
  createDate!: Date;

  @DeleteDateColumn({ nullable: true })
  deleteDate?: Date;
}
