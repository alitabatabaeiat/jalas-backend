import express from 'express';

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.post('/rooms/:id/reserve', (req, res) => {
    // res.status(503).send('Reservation System has been crashed');
    res.status(200).send(`Room ${req.body.room} successfully reserved for:${req.body.username}`);
    console.log('here');
});
app.listen(8000, () => console.log('Mock reservation service is up at port 8000'));
