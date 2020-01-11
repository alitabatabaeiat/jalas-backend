import {getCustomRepository} from "typeorm";
import {Transactional} from "typeorm-transactional-cls-hooked";
import moment from "moment";
import HttpException from "../exceptions/httpException";
import QualityInUseRepository from "../repositories/qualityInUse";
import QualityInUse from "../entities/qualityInUse";

export default class QualityInUseService {
    private static service: QualityInUseService;
    private readonly repository: QualityInUseRepository;

    private constructor() {
        this.repository = getCustomRepository(QualityInUseRepository);
    };

    public static getInstance() {
        if (!QualityInUseService.service)
            QualityInUseService.service = QualityInUseService._getInstance();
        return QualityInUseService.service;
    }

    private static _getInstance = (): QualityInUseService => new QualityInUseService();

    @Transactional()
    public async reserveRoom() {
        try {
            let reserveRoom = await this.repository.findOne({where: {title: 'reserveRoom'}});

            if (reserveRoom)
                return await this.repository.update(reserveRoom.id, {column1: (parseInt(reserveRoom.column1) + 1).toString()});
            else {
                reserveRoom = new QualityInUse();
                reserveRoom.title = 'reserveRoom';
                reserveRoom.column1 = '1';
                return await this.repository.insert(reserveRoom);
            }
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

    @Transactional()
    public async getNumberOfReservedRooms() {
        let error;
        try {
            let qualityInUseRoom = await this.repository.findOne({where: {title: 'reserveRoom'}});
            let qualityInUseChangedPolls = await this.getNumberOfChangedPolls()
            let qualityInUseGetAverageCreationTime = await this.getAverageCreationTime()
            console.log(qualityInUseChangedPolls)
            console.log(qualityInUseGetAverageCreationTime)
            let qualityInUse = {
                'reservedRooms': qualityInUseRoom ? parseInt(qualityInUseRoom.column1) : 0,
                'changedPolls': qualityInUseChangedPolls.numberOfChangedPolls,
                'pollAverageCreationTime': qualityInUseGetAverageCreationTime.averageCreationTime
            }
            console.log(qualityInUse)
            return qualityInUse
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

    @Transactional()
    public async pollChanged(pollId) {
        try {
            let pollChanged = await this.repository.findOne({where: {title: 'pollChanged', column1: pollId}});

            if (pollChanged)
                return;
            else {
                pollChanged = new QualityInUse();
                pollChanged.title = 'pollChanged';
                pollChanged.column1 = pollId;
                return await this.repository.insert(pollChanged);
            }
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

    public async getNumberOfChangedPolls() {
        try {
            let numberOfChangedPolls = (await this.repository.createQueryBuilder()
                .where({title: 'pollChanged'})
                .select('COUNT(id)').getRawOne()).count;
            return {
                numberOfChangedPolls: numberOfChangedPolls ? parseInt(numberOfChangedPolls) : 0
            };
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

    @Transactional()
    public async userEntersPollPage(pollId) {
        try {
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
        } catch (ex) {
            console.log(ex)
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

    @Transactional()
    public async pollCreated(pollId) {
        try {
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
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

    public async getAverageCreationTime() {
        try {
            let averageCreationTime = (await this.repository.createQueryBuilder()
                .where(`title = 'pollCreationTime' AND column2 ~ '^[0-9]*$'`)
                .select('AVG(column2::INTEGER)').getRawOne()).avg;
            return {
                averageCreationTime: averageCreationTime ? parseInt(averageCreationTime) : 0
            };
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }
}