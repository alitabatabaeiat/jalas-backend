import {Column, CreateDateColumn, Entity, ManyToOne, UpdateDateColumn} from "typeorm";
import Poll from "./poll";

@Entity('meeting_times')
export default class MeetingTime {
    @CreateDateColumn({name: 'created_at'})
    public createdAt: Date;

    @UpdateDateColumn({name: 'updated_at'})
    public updatedAt: Date;

    @Column('timestamp with time zone', {name: 'starts_at'})
    public startsAt: string;

    @Column('timestamp with time zone', {name: 'ends_at'})
    public endsAt: number;

    @Column('smallint', {name: 'vote_for', default: 0})
    public voteFor: number;

    @Column('smallint', {name: 'vote_against', default: 0})
    public voteAgainst: number;

    @ManyToOne(type => Poll, poll => poll.possibleMeetingTimes, {primary: true, onDelete: 'CASCADE'})
    public poll: Poll;
}