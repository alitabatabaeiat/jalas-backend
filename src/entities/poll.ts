import {Column, Entity, OneToMany, OneToOne} from "typeorm";
import BaseEntity from "./base";
import MeetingTime from "./meetingTime";

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

    @OneToMany(type => MeetingTime, meetingTime => meetingTime.poll)
    public possibleMeetingTimes: MeetingTime[];

    @OneToOne(type => MeetingTime)
    public meetingTime: MeetingTime;
}