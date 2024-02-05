import express from 'express';
import cors from 'cors';

const app = express();
app.get('/', (req, res) => {
    res.send('<h1>Super hello, Express.js Server!</h1>');
});

app.use(cors());

const port: number = Number(process.env.PORT) || 3000;

import userRoutes from './routes/userRoutes';
import devRoutes from './routes/devRoutes';
import eventRoutes from './routes/eventRoutes';

// // Use routes
app.use('/user', userRoutes)
app.use('/dev', devRoutes);
app.use('/event', eventRoutes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});