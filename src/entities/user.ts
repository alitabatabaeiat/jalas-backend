import {Column, CreateDateColumn, Entity, UpdateDateColumn} from "typeorm";

@Entity('users')
export default class User {
    @CreateDateColumn({name: 'created_at'})
    public createdAt: Date;

    @UpdateDateColumn({name: 'updated_at'})
    public updatedAt: Date;

    @Column({length: 30, unique: true, primary: true})
    public email: string;
}