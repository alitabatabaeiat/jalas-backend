import {Column, Entity, OneToOne} from "typeorm";
import Base from "./base";
import NotificationSetting from "./notificationSetting";

@Entity('users')
export default class User extends Base {
    @Column({length: 50, unique: true})
    public email: string;

    @Column({length: 20})
    public password: string;

    @Column({name: 'full_name', length: 30})
    public fullName: string;

    @OneToOne(type => NotificationSetting, notificationSetting => notificationSetting.user)
    public notificationSetting: NotificationSetting;
}