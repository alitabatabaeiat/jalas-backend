import Base from "./base";
import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
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

    @ManyToOne(type => Comment, comment => comment.replies, {onDelete: 'CASCADE', nullable: true})
    @JoinColumn({name: 'reply_to'})
    public replyTo: Comment;

    @OneToMany(type => Comment, comment => comment.replyTo)
    public replies: Comment[];
}