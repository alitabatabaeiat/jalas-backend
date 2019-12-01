import {Column, Entity, ManyToOne} from "typeorm";
import BaseEntity from "./base";
import Poll from "./poll";

@Entity('meeting_times')
export default class MeetingTime extends BaseEntity {
    @Column('timestamp with time zone', {name: 'starts_at'})
    public startsAt: string;

    @Column('timestamp with time zone', {name: 'starts_at'})
    public endsAt: number;

    @Column('smallint', {name: 'vote_for', default: 0})
    public voteFor: number;

    @Column('smallint', {name: 'vote_against', default: 0})
    public voteAgainst: number;

    @ManyToOne(type => Poll, poll => poll.possibleMeetingTimes, {onDelete: 'CASCADE'})
    public poll: Poll;
}