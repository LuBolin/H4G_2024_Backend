import express from 'express';

const app = express();
app.get('/', (req, res) => {
    res.send('<h1>Super hello, Express.js Server!</h1>');
});

const port: number = Number(process.env.PORT) || 3000;

import userRoutes from './routes/userRoutes';
import devRoutes from './routes/devRoutes';

// // Use routes
app.use('/user', userRoutes)
app.use('/dev', devRoutes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});