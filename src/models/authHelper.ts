import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';
import { JwtRequest } from '../Global';
import MysqlHelper from './dbHelper';
import { Connection, RowDataPacket } from 'mysql2';

dotenv.config(); // Loads .env file contents into process.env by default.

const secretKey = process.env.JWT_SECRET as string || "secret";
const expirationTime: string = '1h';
const saltRounds = 10;

const conn: Connection = MysqlHelper.getInstance().getConnection();

const hashPassword = (password: string): string => {
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(password, salt);
    return hash;
}

const comparePassword = (password: string, hash: string): boolean => {
    return bcrypt.compareSync(password, hash);
}


// userid for queries, username for rendering purpose, role for the right data
const generateJwt = (userid: number, username: string, role: string): string => {
    const payload = {
        // "subject" seems to be the convention for the username
        userid: userid,
        username: username,
        role: role
    };

    const token: string = jwt.sign(payload, secretKey, { expiresIn: expirationTime });

    return token;
}


const authenticateJwt = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Authorization: Bearer <jwt_token>
        const authHeader = req.header('Authorization') || req.header('authorization') || ""
        if (authHeader.length === 0) {
            throw new Error();
        }
        const token = authHeader.replace('Bearer ', '');

        if (!token) {
            throw new Error();
        }

        const decoded = jwt.verify(token, secretKey) as JwtPayload;
        (req as JwtRequest).token = decoded;

        next();
    } catch (err) {
        res.status(401).send(
            'Invalid jwt token.\nError: ' + err);
    }
};

const validateAccountType = (userid: number, account_type: string, expected_type: string): boolean => {
    if(account_type != expected_type) {
        return false;
    }
    const checkRoleQuery: string = "SELECT account_type FROM accounts WHERE id = ?";
    const checkRoleValues: Array<any> = [userid];
    conn.query(checkRoleQuery, checkRoleValues, (err, results, fields) => {
        if (err) {
            return false;
        }
        results = JSON.parse(JSON.stringify(results)) as RowDataPacket[];
        if (results[0].account_type != expected_type) {
            return false;
        }
    });
    return true;
}

export { hashPassword, comparePassword };
export {generateJwt, authenticateJwt };
export { validateAccountType };