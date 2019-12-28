import Base from "./base";
import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import Poll from "./poll";
import User from "./user";

@Entity('comments')
export default class Comment extends Base {
    @Column( 'text')
    public text: string;

    @ManyToOne(type => User)
    @JoinColumn({name: 'user_id'})
    public writer: User;

    @ManyToOne(type => Poll, poll => poll.comments, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'poll_id'})
    public poll: Poll;
}