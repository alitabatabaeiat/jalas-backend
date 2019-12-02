import {Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne} from "typeorm";
import BaseEntity from "./base";
import MeetingTime from "./meetingTime";
import User from "./user";

@Entity('polls')
export default class Poll extends BaseEntity {
    @Column({length: 30})
    public title: string;

    @Column('smallint', {nullable: true})
    public room: number;

    @Column('smallint', {default: 0})
    public state: number;

    @Column('timestamp with time zone', {name: 'room_requested_at', nullable: true})
    public roomRequestedAt: Date;

    @OneToMany(type => MeetingTime, meetingTime => meetingTime.poll, {cascade: true})
    public possibleMeetingTimes: MeetingTime[];

    @ManyToOne(type => User)
    public owner: User;

    @ManyToMany(type => User, {cascade: true})
    @JoinTable()
    public participants: User[];
}