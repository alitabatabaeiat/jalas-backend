import Base from "./base";
import {Column, Entity} from "typeorm";

@Entity('quality_in_use')
export default class QualityInUse extends Base {
    @Column()
    public title: string;

    @Column()
    public column1: string;

    @Column({nullable: true})
    public column2: string;
}