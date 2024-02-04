import express, { query } from 'express'
import {Request, Response} from 'express';
import MysqlHelper from '../models/dbHelper';
import { Connection, ResultSetHeader, RowDataPacket } from 'mysql2'
import { comparePassword, hashPassword, generateJwt, authenticateJwt } from '../models/hashHelper';

const router = express.Router();
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

const conn: Connection = MysqlHelper.getInstance().getConnection();


// for testing purpose
router.get('/:id', (req: Request, res: Response) => {
    const id: number = Number(req.params.id);
    const selectAccountQuery: string = "SELECT * FROM accounts WHERE id = ?";
    const selectAccountValues: Array<any> = [id];
    conn.query(selectAccountQuery, selectAccountValues, (err, results, fields) => {
        if (err) {
            return res.status(500).send({
                success: false,
                message: 'Error in fetching account: ' + err,
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


// promise, async, await should be used here
// but i cant wrap my head around it
router.post('/signup', (req: Request, res: Response) => {
    const username: string = req.body.username;
    const email: string = req.body.email;
    const password: string = req.body.password;
    console.log(username, email, password);
    const insertAccountQuery: string = "INSERT INTO accounts (username, email) VALUES (?, ?)";
    const insertAccountValues: Array<any> = [username, email];
    conn.query(insertAccountQuery, insertAccountValues, (accErr, accResults, accFields) => {
        if (accErr) {
            return res.status(500).send({
                success: false,
                message: 'Error in creating account: ' + accErr,
            });
        }
        const resultHeader: ResultSetHeader = JSON.parse(JSON.stringify(accResults));
        const accountInsertId: number = resultHeader.insertId;

        const passwordHash = hashPassword(password);
        const insertPasswordQuery: string = "INSERT INTO passwords (account_id, password_hash) VALUES (?, ?)";
        const insertPasswordValues: Array<any> = [accountInsertId, passwordHash];
        conn.query(insertPasswordQuery, insertPasswordValues, (passErr, passResults, passFields) => {
            if (passErr) {
                return res.status(500).send({
                    success: false,
                    message: 'Error in creating password: ' + passErr,
                });
            }
            return res.status(200).send({
                success: true,
                message: 'Account created successfully',
            });
        });
    });
});


// issue jwt
router.post('/signin', (req: Request, res: Response) => {
    const username: string = req.body.username;
    const password: string = req.body.password;
    const selectHashQuery: string = " \
        SELECT p.password_hash \
        FROM accounts a INNER JOIN passwords p \
        ON a.id = p.account_id WHERE a.username = ? \
        ";
    const selectHashValues: Array<any> = [username];
    conn.query(selectHashQuery, selectHashValues, (err, results, fields) => {
        if (err) {
            return res.status(500).send({
                success: false,
                message: 'That account does not exist.',
            });
        }
        results = JSON.parse(JSON.stringify(results)) as RowDataPacket[];
        if (results.length === 0) {
            return res.status(400).send({
                success: false,
                message: 'That account does not exist.'
            });
        }

        const hash: string = (results[0] as RowDataPacket).password_hash;

        const valid: boolean = comparePassword(password, hash);
        if (!valid) {
            return res.status(400).send({
                success: false,
                message: 'Wrong password'
            });
        }

        const tokenDataQuery: string = 
            "SELECT id, account_type, name FROM accounts WHERE username = ?";
        const tokenDataValues: Array<any> = [username];

        var userId: number = -1;
        var accountType: string = "";
        var name: string = "";
        conn.query(tokenDataQuery, tokenDataValues, (err, results, fields) => {
            if (err) {
                return res.status(500).send({
                    success: false,
                    message: 'Error in fetching token data: ' + err,
                });
            }
            results = JSON.parse(JSON.stringify(results)) as RowDataPacket[];
            userId = (results[0] as RowDataPacket).id;
            accountType = (results[0] as RowDataPacket).account_type;
            name = (results[0] as RowDataPacket).name;
        });

        const token = generateJwt(userId, name, accountType);
        
        return res.status(200).send({
            success: true,
            message: 'Login successful',
            token: token
        });
    });
});

router.put('/update', authenticateJwt, (req: Request, res: Response) => {
    console.log(req.body);
    const userid: number = Number(req.body.userid);
    const accountType: string = req.body.accountType;
    const name: string = req.body.name;
    const phone: string = req.body.phone;
    const description: string = req.body.description || "";

    const updateAccountQuery: string = 
        "UPDATE accounts SET account_type = ?, name = ?, phone = ?, description = ? WHERE id = ?";
    const updateAccountValues: Array<any> = [accountType, name, phone, description, userid];
    conn.query(updateAccountQuery, updateAccountValues, (err, results, fields) => {
        console.log(err);
        console.log(results);
        console.log(fields);
        if (err) {
            return res.status(500).send({
                success: false,
                message: 'Error in updating account information: ' + err,
            });
        }
        return res.status(200).send({
            success: true,
            message: 'Account updated successfully',
        });
    });
});



export default router;