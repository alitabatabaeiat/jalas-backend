import express from 'express';
import cors from 'cors';
import winston, {format} from 'winston';
import Controller from "./controllers/controller";
import notFoundMiddleware from "./middlewares/notFound";
import errorMiddleware from "./middlewares/error";

class App {
    private app: express.Application;

    constructor(controllers: Controller[]) {
        this.app = express();

        this.initializeMiddleware();
        this.initializeControllers(controllers);
        this.initializeErrorHandling();
        this.initializeWinston();
    }

    private initializeMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({extended: false}));
    }

    private initializeControllers(controllers: Controller[]) {
        controllers.forEach(controller => this.app.use('/api/v1', controller.router));
    }

    private initializeErrorHandling() {
        this.app.use(notFoundMiddleware);
        this.app.use(errorMiddleware);
    }

    private initializeWinston() {
        winston.add(new winston.transports.File({
            filename: 'logfile.log', format: format.combine(
                format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                format.simple()
            )
        }));
        winston.exceptions.handle(
            new winston.transports.File({filename: 'uncaughtExceptions.log'}),
            new winston.transports.Console()
        );
    }

    public listen() {
        const port = process.env.PORT;
        this.app.listen(port, () => winston.info('App started successfully'));
    }
}

export default App;