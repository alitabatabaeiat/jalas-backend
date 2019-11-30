import * as express from 'express';
import * as cors from 'cors';
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

    public listen() {
        const port = process.env.PORT;
        this.app.listen(port, () => {
            console.log(`App listening on the port ${port}`);
        });
    }
}

export default App;