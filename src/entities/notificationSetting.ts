import Base from "./base";
import {Entity, Column, JoinColumn, OneToOne, CreateDateColumn, UpdateDateColumn} from "typeorm";
import User from "./user";

@Entity('notification_settings')
export default class NotificationSetting {
    @OneToOne(type => User, user => user.notificationSetting, {primary: true})
    @JoinColumn({name: 'user_id'})
    public user: User;

    @CreateDateColumn({name: 'created_at'})
    public createdAt: Date;

    @UpdateDateColumn({name: 'updated_at'})
    public updatedAt: Date;

    @Column({name: 'create_poll', default: true})
    public createPoll: boolean;

    @Column({name: 'reserve_room', default: true})
    public reserveRoom: boolean;

    @Column({name: 'select_meeting_time', default: true})
    public selectMeetingTime: boolean;

    @Column({name: 'vote', default: true})
    public vote: boolean;

    @Column({name: 'add_meeting_time', default: true})
    public addMeetingTime: boolean;

    @Column({name: 'remove_meeting_time', default: true})
    public removeMeetingTime: boolean;

    @Column({name: 'cancel_meeting', default: true})
    public cancelMeeting: boolean;

    @Column({name: 'add_participant', default: true})
    public addParticipant: boolean;

    @Column({name: 'close_poll', default: true})
    public closePoll: boolean;
}