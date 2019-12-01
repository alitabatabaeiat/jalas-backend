import {Column, Entity} from "typeorm";
import BaseEntity from "./base";

@Entity('users')
export default class User extends BaseEntity {
    @Column({length: 30, unique: true})
    public email: string;

    @Column()
    public password: string;
}