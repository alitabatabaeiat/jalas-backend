import {EntityManager, getManager} from "typeorm";
import moment from "moment";
import HttpException from "../exceptions/httpException";
import QualityInUseRepository from "../repositories/qualityInUse";
import QualityInUse from "../entities/qualityInUse";

export default class QualityInUseService {
    private static service: QualityInUseService;
    private mainRepository: QualityInUseRepository;
    private repository: QualityInUseRepository;

    private constructor() {
        this.mainRepository = getManager().getCustomRepository(QualityInUseRepository);
    };

    public static getInstance(manager?: EntityManager) {
        if (!QualityInUseService.service)
            QualityInUseService.service = QualityInUseService._getInstance();
        return QualityInUseService.service._setManager(manager);
    }

    private _setManager = (manager: EntityManager = getManager()) => {
        this.repository = manager.getCustomRepository(QualityInUseRepository);
        return this;
    };

    private static _getInstance = (): QualityInUseService => new QualityInUseService();

    public reserveRoom = async () => {
        try {
            let reserveRoom = await this.mainRepository.findOne({where: {title: 'reserveRoom'}});

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
    };

    public getNumberOfReservedRooms = async () => {
        let error;
        try {
            let qualityInUse = await this.repository.findOne({where: {title: 'reserveRoom'}});
            return {
                numberOfReservedRooms: qualityInUse ? parseInt(qualityInUse.column1) : 0
            };
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    };

    public pollChanged = async (pollId) => {
        try {
            let pollChanged = await this.mainRepository.findOne({where: {title: 'pollChanged', column1: pollId}});

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
    };

    public getNumberOfChangedPolls = async () => {
        try {
            let numberOfChangedPolls = (await this.mainRepository.createQueryBuilder()
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
    };

    public userEntersPollPage = async (pollId) => {
        try {
            let pollCreationTime = await this.mainRepository.findOne({where: {title: 'pollCreationTime', column1: pollId}});

            if (pollCreationTime) {
                if (/^[0-9]*$/.test(pollCreationTime.column2))
                    return;
                else
                    await this.repository.update(pollCreationTime.id, {column2: moment().toISOString})
            } else {
                pollCreationTime = new QualityInUse();
                pollCreationTime.title = 'pollCreationTime';
                pollCreationTime.column1 = pollId;
                pollCreationTime.column2 = moment().toISOString();
                return await this.repository.insert(pollCreationTime);
            }
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    };

    public pollCreated = async (pollId) => {
        try {
            let pollCreationTime = await this.mainRepository.findOne({where: {title: 'pollCreationTime', column1: pollId}});

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
    };

    public getAverageCreationTime = async () => {
        try {
            let averageCreationTime = (await this.mainRepository.createQueryBuilder()
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