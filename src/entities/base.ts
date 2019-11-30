import {CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";

class BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    public id?: string;

    @CreateDateColumn()
    public createdAt: Date;

    @UpdateDateColumn()
    public updatedAt: Date;
}

export default BaseEntity;