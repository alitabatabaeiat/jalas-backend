import {Column, Entity, ManyToOne, OneToMany} from "typeorm";
import Poll from "./poll";
import Base from "./base";
import Vote from "./vote";

@Entity('meeting_times')
export default class MeetingTime extends Base {
    @Column('timestamp with time zone', {name: 'starts_at'})
    public startsAt: Date;

    @Column('timestamp with time zone', {name: 'ends_at'})
    public endsAt: Date;

    @OneToMany(type => Vote, vote => vote.meetingTime)
    public votes: Vote[];

    @Column('smallint', {name: 'vote_for', default: 0})
    public voteFor: number;

    @Column('smallint', {name: 'vote_against', default: 0})
    public voteAgainst: number;

    @Column('smallint', { name: 'vote_abstain', default: 0 })
    public voteAbstain: number;

    @ManyToOne(type => Poll, poll => poll.possibleMeetingTimes, {onDelete: 'CASCADE'})
    public poll: Poll;

    @Column({default: false})
    public selected: boolean;
}