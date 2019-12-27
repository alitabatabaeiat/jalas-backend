import Base from "./base";
import { Entity, Column, OneToOne, JoinColumn } from "typeorm";
import Poll from "./poll";
import User from "./user";

@Entity('comments')
export default class Comment extends Base {
    @Column( 'text')
    public text: string;

    @OneToOne(type => User)
    @JoinColumn({name: 'user_id'})
    public writer: User;

    @OneToOne(type => Poll, poll => poll.comments, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'poll_id'})
    public poll: Poll;
}