import {getCustomRepository} from "typeorm";
import HttpException from "../exceptions/httpException";
import QualityInUseRepository from "../repositories/qualityInUse";
import QualityInUse from "../entities/qualityInUse";
import moment = require("moment");

export default class QualityInUseService {
    private static service: QualityInUseService;
    protected repository: QualityInUseRepository;

    private constructor() {
        this.repository = getCustomRepository(QualityInUseRepository);
    };

    public static getInstance() {
        if (!QualityInUseService.service)
            QualityInUseService.service = QualityInUseService._getInstance();
        return QualityInUseService.service;
    }

    private static _getInstance = (): QualityInUseService => new QualityInUseService();

    public reserveRoom = async () => {
        let reserveRoom = await this.repository.findOne({where: {title: 'reserveRoom'}});

        if (reserveRoom)
            return await this.repository.update(reserveRoom.id, {column1: (parseInt(reserveRoom.column1) + 1).toString()});
        else {
            reserveRoom = new QualityInUse();
            reserveRoom.title = 'reserveRoom';
            reserveRoom.column1 = '1';
            return await this.repository.insert(reserveRoom);
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
            throw new HttpException();
        }
    };

    public pollChanged = async (pollId) => {
        let pollChanged = await this.repository.findOne({where: {title: 'pollChanged', column1: pollId}});

        if (pollChanged)
            return;
        else {
            pollChanged = new QualityInUse();
            pollChanged.title = 'pollChanged';
            pollChanged.column1 = pollId;
            return await this.repository.insert(pollChanged);
        }
    };

    public getNumberOfChangedPolls = async () => {
        let error;
        try {
            let numberOfChangedPolls = (await this.repository.createQueryBuilder()
                .where({title: 'pollChanged'})
                .select('COUNT(id)').getRawOne()).count;
            return {
                numberOfChangedPolls: numberOfChangedPolls ? parseInt(numberOfChangedPolls) : 0
            };
        } catch (ex) {
            throw new HttpException();
        }
    };

    public userEntersPollPage = async (pollId) => {
        let pollCreationTime = await this.repository.findOne({where: {title: 'pollCreationTime', column1: pollId}});

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
    };

    public pollCreated = async (pollId) => {
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
    };

    public getAverageCreationTime = async () => {
        let error;
        try {
            let averageCreationTime = (await this.repository.createQueryBuilder()
                .where(`title = 'pollCreationTime' AND column2 ~ '^[0-9]*$'`)
                .select('AVG(column2::INTEGER)').getRawOne()).avg;
            return {
                averageCreationTime: averageCreationTime ? parseInt(averageCreationTime) : 0
            };
        } catch (ex) {
            throw new HttpException();
        }
    }
}