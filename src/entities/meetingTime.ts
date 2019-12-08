import {Column, CreateDateColumn, Entity, JoinTable, ManyToOne, OneToOne, UpdateDateColumn} from "typeorm";
import Poll from "./poll";
import Base from "./base";

@Entity('meeting_times')
export default class MeetingTime extends Base {
    @Column('timestamp with time zone', {name: 'starts_at'})
    public startsAt: string;

    @Column('timestamp with time zone', {name: 'ends_at'})
    public endsAt: string;

    @Column('smallint', {name: 'vote_for', default: 0})
    public voteFor: number;

    @Column('smallint', {name: 'vote_against', default: 0})
    public voteAgainst: number;

    @ManyToOne(type => Poll, poll => poll.possibleMeetingTimes, {onDelete: 'CASCADE'})
    public poll: Poll;

    @Column({default: false})
    public selected: boolean;
}