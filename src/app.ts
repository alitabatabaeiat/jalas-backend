import * as express from 'express';
import * as cors from 'cors';

class App {
    private app: express.Application;

    constructor(controllers) {
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

    private initializeControllers(controllers) {
        controllers.forEach(controller => this.app.use('/api/v1', controller.router));
    }

    private initializeErrorHandling() {
    }

    public listen() {
        const port = process.env.PORT;
        this.app.listen(port, () => {
            console.log(`App listening on the port ${port}`);
        });
    }
}

export default App;