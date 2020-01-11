import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";
import BaseEntity from "./base";
import MeetingTime from "./meetingTime";
import User from "./user";

@Entity('votes')
export default class Vote extends BaseEntity {
    @Column('smallint', { default: 0 })
    public voteFor: number;

    @ManyToOne(type => MeetingTime, meetingTime => meetingTime.votes,{onDelete: 'CASCADE'})
    @JoinColumn({name: 'meeting_time_id'})
    public meetingTime: MeetingTime;

    @ManyToOne(type => User)
    @JoinColumn({name: 'user_id'})
    public voter: User;
}