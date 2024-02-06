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
router.get('/:eid', (req: Request, res: Response) => {
    const id: number = Number(req.params.eid);
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

// create new event
router.post('/create', authenticateJwt, (req: Request, res: Response) => {
    const jwtRequest: JwtRequest = req as JwtRequest;
    const token: JwtPayload = jwtRequest.token;
    const userid: number = token.userid;
    const role: string = token.role;
    const validRole: boolean = validateAccountType(userid, role, 'NPO');
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

// update volunteer's attendance for specific date
router.post('/:eid/enrollment/modify/', authenticateJwt, (req: Request, res: Response) => {
    const vid: number = Number(req.body.userid);
    const enrolled: boolean = req.body.enrolled;
    const eid: number = Number(req.params.eid);

    let updateEnrollmentQuery: string;
    let updateEnrollmentValues: Array<any> = [eid, vid];
    if (enrolled) {
        updateEnrollmentQuery = 
            "INSERT INTO event_volunteers (event_id, volunteer_id) VALUES (?, ?)";
    } else {
        updateEnrollmentQuery = 
            "DELETE FROM event_volunteers WHERE event_id = ? AND volunteer_id = ?";
    }
    conn.query(updateEnrollmentQuery, updateEnrollmentValues, (err, results, fields) => {
        if (err) {
            return res.status(500).send({
                success: false,
                message: 'Error in updating enrollment: ' + err,
            });
        }
        return res.status(200).send({
            success: true,
            message: 'Enrollment updated successfully',
        });
    });
});

// attendance of all dates of the event, without specific data per volunteer
router.get('/:eid/attendance', authenticateJwt, (req: Request, res: Response) => {
    const jwtRequest: JwtRequest = req as JwtRequest;
    const token: JwtPayload = jwtRequest.token;
    const userid: number = token.userid;
    const role: string = token.role;
    const isNPO: boolean = validateAccountType(userid, role, 'NPO');
    if (!isNPO) {
        const isVolunteer: boolean = validateAccountType(userid, role, 'Volunteer');
        if (!isVolunteer) {
            return res.status(403).send({
                success: false,
                message: 'You are not authorized to view attendance',
            });
        }
        res.redirect(`/${req.params.eid}/attendance/${userid}`);
    }


    const eventId: number = Number(req.params.id);
    const volunteerId: number = Number(req.body.volunteer_id);
    const startDate: string = req.body.start_date;
    const endDate: string = req.body.end_date;

    const selectAttendanceQuery: string = 
        "SELECT * FROM attendance WHERE event_id = ? AND volunteer_id = ? \
            AND date >= ? AND date <= ?";
    const selectAttendanceValues: Array<any> = 
        [eventId, volunteerId, startDate, endDate];
    conn.query(selectAttendanceQuery, selectAttendanceValues, (err, results, fields) => {
        if (err) {
            return res.status(500).send({
                success: false,
                message: 'Error in fetching attendance: ' + err,
            });
        }
        results = JSON.parse(JSON.stringify(results)) as RowDataPacket[];
        return res.status(200).send({
            success: true,
            message: 'Attendance fetched successfully',
            data: results
        });
    });
});

// update volunteer's attendance for specific date
router.post('/:eid/attendance/modify/', authenticateJwt, (req: Request, res: Response) => {
    const vid: number = Number(req.body.userid);
    const present: boolean = req.body.present;
    const date: string = req.body.date;
    const eid: number = Number(req.params.eid);

    // check if enrolled in event
    const enrollmentQuery = "SELECT 1 FROM event_volunteers WHERE event_id = ? AND volunteer_id = ? LIMIT 1";
    const enrollmentValues: Array<any> = [eid, vid];
    conn.query(enrollmentQuery, enrollmentValues, (err, results, fields) => {
        if (err) {
            return res.status(500).send({
                success: false,
                message: 'Error in checking participation: ' + err,
            });
        }
        results = JSON.parse(JSON.stringify(results)) as RowDataPacket[];
        if (results.length === 0) {
            return res.status(403).send({
                success: false,
                message: 'Volunteer not enrolled in this event',
            });
        }
    });

    let updateAttendanceQuery: string;
    let updateAttendanceValues: Array<any> = [eid, vid, date];
    if (present) {
        updateAttendanceQuery = 
            "INSERT INTO event_attendance (event_id, volunteer_id, attendance_date) VALUES (?, ?, ?)";
    } else {
        updateAttendanceQuery = 
            "DELETE FROM event_attendance WHERE event_id = ? AND volunteer_id = ? AND attendance_date = ?";
    }
    conn.query(updateAttendanceQuery, updateAttendanceValues, (err, results, fields) => {
        if (err) {
            return res.status(500).send({
                success: false,
                message: 'Error in updating attendance: ' + err,
            });
        }
        return res.status(200).send({
            success: true,
            message: 'Attendance updated successfully',
        });
    });
});

// list of volunteer attendance for specific date
// useful for rendering checklist for attendance logging
router.get('/:eid/attendance/:date', authenticateJwt, (req: Request, res: Response) => {
    const jwtRequest: JwtRequest = req as JwtRequest;
    const token: JwtPayload = jwtRequest.token;
    const userid: number = token.userid;
    const role: string = token.role;
    const isNPO: boolean = validateAccountType(userid, role, 'NPO');
    const isVolunteer: boolean = validateAccountType(userid, role, 'Volunteer');
    if (!isNPO && !isVolunteer) {
        return res.status(403).send({
            success: false,
            message: 'You are not authorized to view attendance\nNo valid role.',
        });
    }
    if (isVolunteer){
        res.redirect(`/user/event/${req.params.eid}/attendance`);
    }

    const validEventDateQuery: string = `
        SELECT 
            CASE 
                WHEN COUNT(*) > 0 THEN TRUE
                ELSE FALSE
            END AS event_valid
        FROM 
            events
        WHERE 
            id = ? 
            AND ? BETWEEN start_time AND end_time;`;
    const validEventDateValues: Array<any> = [req.params.eid, req.params.date];
    conn.query(validEventDateQuery, validEventDateValues, (err, results, fields) => {
        if (err) {
            return res.status(500).send({
                success: false,
                message: 'Error in checking event validity: ' + err,
            });
        }
        results = JSON.parse(JSON.stringify(results)) as RowDataPacket[];
        if (results[0].event_valid === 0) {
            return res.status(403).send({
                success: false,
                message: 'Invalid event date',
            });
        }
    });


    const eventId: number = Number(req.params.eid);
    const date: string = req.params.date;
    const attendanceQuery = `
        SELECT 
            ev.volunteer_id,
            a.name AS volunteer_name,
            IF(ea.id IS NULL, 'Absent', 'Present') AS attendance_status
        FROM 
            event_volunteers ev
        JOIN 
            accounts a ON ev.volunteer_id = a.id
        LEFT JOIN 
            event_attendance ea ON ev.volunteer_id = ea.volunteer_id 
            AND 
            ev.event_id = ea.event_id AND ea.attendance_date = ?
        JOIN 
            events e ON ev.event_id = e.id
        WHERE 
            ev.event_id = ?
            AND e.npo_id = ?
            AND e.status NOT IN ('Cancelled')
        ORDER BY 
            ev.volunteer_id;`;
    const attendanceValues: Array<any> = [date, eventId, userid];
    conn.query(attendanceQuery, attendanceValues, (err, results, fields) => {
        if (err) {
            return res.status(500).send({
                success: false,
                message: 'Error in fetching attendance: ' + err,
            });
        }
        results = JSON.parse(JSON.stringify(results)) as RowDataPacket[];
        return res.status(200).send({
            success: true,
            message: 'Attendance fetched successfully',
            data: results
        });
    });
});


export default router;
