import Base from "./base";
import { Entity, Column, OneToOne } from "typeorm";
import Poll from "./poll";
import User from "./user";

@Entity('comments')
export default class Comment extends Base {
    @Column( 'text')
    public text: string;

    @OneToOne(type => User)
    public writer: User;

    @OneToOne(type => Poll, poll => poll.comments, {onDelete: 'CASCADE'})
    public poll: Poll;
}