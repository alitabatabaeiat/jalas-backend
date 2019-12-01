import {Column, Entity} from "typeorm";
import BaseEntity from "./base";

@Entity('polls')
export default class Poll extends BaseEntity {
    @Column({length: 30})
    public title: string;

    @Column('smallint')
    public room: number;

    @Column('smallint')
    public state: number;

    @Column('timestamp with time zone', {name: 'room_requested_at'})
    public roomRequestedAt: Date;
}