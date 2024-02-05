import express from 'express'
import {Request, Response} from 'express';
import MysqlHelper from '../models/dbHelper';
import { Connection, ResultSetHeader, RowDataPacket } from 'mysql2'
import { authenticateJwt, validateAccountType } from '../models/authHelper';
import { JwtRequest } from '../Global';
import { JwtPayload } from 'jsonwebtoken';

const router = express.Router();
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

const conn: Connection = MysqlHelper.getInstance().getConnection();


// for testing purpose
router.get('/:id', (req: Request, res: Response) => {
    const id: number = Number(req.params.id);
    const selectEventQuery: string = "SELECT * FROM events WHERE id = ?";
    const selecEventValues: Array<any> = [id];
    conn.query(selectEventQuery, selecEventValues, (err, results, fields) => {
        if (err) {
            return res.status(500).send({
                success: false,
                message: 'Error in fetching event: ' + err,
            });
        }
        results = JSON.parse(JSON.stringify(results)) as RowDataPacket[];
        return res.status(200).send({
            success: true,
            message: 'Account fetched successfully',
            data: results[0]
        });
    });
});


router.post('/create', authenticateJwt, (req: Request, res: Response) => {
    const jwtRequest: JwtRequest = req as JwtRequest;
    const token: JwtPayload = jwtRequest.token;
    const userid: number = token.userid;
    const role: string = token.role;
    if (role !== 'NPO') {
        return res.status(403).send({
            success: false,
            message: 'You are not authorized to create an event',
        });
    }
    const validRole: boolean = validateAccountType(userid, 'NPO');
    if (!validRole) {
        return res.status(403).send({
            success: false,
            message: 'You are not authorized to create an event',
        });
    }

    const event_name: string = req.body.event_name;
    const description: string = req.body.description;
    const start_time: string = req.body.start_time;
    const end_time: string = req.body.end_time;

    const insertEventQuery: string = 
        "INSERT INTO events (event_name, description, \
            start_time, end_time, npo_id) VALUES (?, ?, ?, ?, ?)";
    const insertEventValues: Array<any> = 
        [event_name, description, start_time, end_time, userid];
    conn.query(insertEventQuery, insertEventValues, (err, results, fields) => {
        if (err) {
            return res.status(500).send({
                success: false,
                message: 'Error in creating event: ' + err,
            });
        }
        const resultHeader: ResultSetHeader = JSON.parse(JSON.stringify(results));
        const eventId: number = resultHeader.insertId;
        return res.status(200).send({
            success: true,
            message: 'Event created successfully',
            event_id: eventId // now you can go to /event/:id to see the event
        });
    });
});



export default router;
