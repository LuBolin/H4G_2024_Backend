import express from 'express'
import {Request, Response} from 'express';
import MysqlHelper from '../models/dbHelper';
import { Connection, QueryOptions } from 'mysql2'

const router = express.Router();
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

const conn: Connection = MysqlHelper.getInstance().getConnection();


router.get('/', (req: Request, res: Response) => {
    res.send('this is dev route');
});

router.get('/Id/:id/Name/:name', (req: Request, res: Response) => {
    res.send({
        message: 'Test route with id and name',
        id: req.params.id,
        name: req.params.name
    });
})

router.post('/Id/:id/Name/:name', (req: Request, res: Response) => {
    res.send({
        data: req.body,
        params: {
            id: req.params.id,
            name: req.params.name
        }
    });
})

router.get('/user', (req: Request, res: Response) => {
    return res.status(400).send({
        success: false,
        message: 'User id is required'
    })
});

router.get('/user/:id', (req: Request, res: Response) => {
    const query: string = "SELECT * FROM accounts WHERE id = ?";
    const queryOptions: QueryOptions = {
        sql: query,
    }
    const values: Array<any> = [req.params.id];
    conn.query(queryOptions, values, (err, results, fields) => {
        console.log(err);
        console.log(results);
        console.log(fields);
        if (err) {
            console.log(err);
            return res.status(500).send({
                success: false,
                message: 'Error in fetching data',
            });
        }
        return res.status(500).send({
            success: true,
            data: results,
        });
    });
});


export default router;