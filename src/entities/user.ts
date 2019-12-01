import {Column, Entity} from "typeorm";
import Base from "./base";

@Entity('users')
export default class User extends Base {
    @Column({length: 30, unique: true})
    public email: string;
}