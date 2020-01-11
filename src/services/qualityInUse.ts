import {getCustomRepository} from "typeorm";
import {Transactional} from "typeorm-transactional-cls-hooked";
import moment from "moment";
import QualityInUseRepository from "../repositories/qualityInUse";
import QualityInUse from "../entities/qualityInUse";
import UnAuthorizedException from "../exceptions/unAuthorizedException";
import Service from "./service";

export default class QualityInUseService extends Service {
    private static service: QualityInUseService;
    private readonly repository: QualityInUseRepository;

    private constructor() {
        super();
        this.repository = getCustomRepository(QualityInUseRepository);
    };

    public static getInstance() {
        if (!QualityInUseService.service)
            QualityInUseService.service = QualityInUseService._getInstance();
        return QualityInUseService.service;
    }

    private static _getInstance = (): QualityInUseService => new QualityInUseService();

    public async getFullReport(user) {
        return await this.catchErrors(async () => {
            if (user.email === 'a.tabatabaei97@gmail.com')
                return {
                    reservedRooms: await this.getNumberOfReservedRooms(),
                    changedPolls: await this.getNumberOfChangedPolls(),
                    pollAverageCreationTime: await this.getAverageCreationTime()
                };
            else
                throw new UnAuthorizedException('Admin privilege needed');
        });
    }

    @Transactional()
    public async reserveRoom() {
        return await this.catchErrors(async () => {
            let reserveRoom = await this.repository.findOne({where: {title: 'reserveRoom'}});

            if (reserveRoom)
                return await this.repository.update(reserveRoom.id, {column1: (parseInt(reserveRoom.column1) + 1).toString()});
            else {
                reserveRoom = new QualityInUse();
                reserveRoom.title = 'reserveRoom';
                reserveRoom.column1 = '1';
                return await this.repository.insert(reserveRoom);
            }
        });
    }

    public async getNumberOfReservedRooms() {
        return await this.catchErrors(async () => {
            let qualityInUseRoom = await this.repository.findOne({where: {title: 'reserveRoom'}});
            return qualityInUseRoom ? parseInt(qualityInUseRoom.column1) : 0;
        });
    }

    @Transactional()
    public async pollChanged(pollId) {
        return await this.catchErrors(async () => {
            let pollChanged = await this.repository.findOne({where: {title: 'pollChanged', column1: pollId}});

            if (pollChanged)
                return;
            else {
                pollChanged = new QualityInUse();
                pollChanged.title = 'pollChanged';
                pollChanged.column1 = pollId;
                return await this.repository.insert(pollChanged);
            }
        });
    }

    public async getNumberOfChangedPolls() {
        return await this.catchErrors(async () => {
            let changedPolls = await this.repository.countChangedPolls();
            return changedPolls ? parseInt(changedPolls.count) : 0;
        });
    }

    @Transactional()
    public async userEntersPollPage(pollId) {
        return await this.catchErrors(async () => {
            let pollCreationTime = await this.repository.findOne({where: {title: 'pollCreationTime', column1: pollId}});

            if (pollCreationTime) {
                if (/^[0-9]*$/.test(pollCreationTime.column2))
                    return;
                else
                    await this.repository.update(pollCreationTime.id, {column2: moment().toISOString()})
            } else {
                pollCreationTime = new QualityInUse();
                pollCreationTime.title = 'pollCreationTime';
                pollCreationTime.column1 = pollId;
                pollCreationTime.column2 = moment().toISOString();
                return await this.repository.insert(pollCreationTime);
            }
        });
    }

    @Transactional()
    public async pollCreated(pollId) {
        return await this.catchErrors(async () => {
            let pollCreationTime = await this.repository.findOne({where: {title: 'pollCreationTime', column1: pollId}});

            if (pollCreationTime) {
                if (/^[0-9]*$/.test(pollCreationTime.column2))
                    return;
                else {
                    const start = moment(pollCreationTime.column2);
                    const diff = moment().diff(start);
                    await this.repository.update(pollCreationTime.id, {column2: diff.toString()});
                }
            } else
                return;
        });
    }

    public async getAverageCreationTime() {
        return await this.catchErrors(async () => {
            let creationTime = await this.repository.averageCreationTime();
            return creationTime ? parseInt(creationTime.avg) : 0;
        });
    }
}