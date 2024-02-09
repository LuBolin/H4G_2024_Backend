import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';
import { JwtRequest } from '../Global';
import MysqlHelper from './dbHelper';
import { Connection, RowDataPacket } from 'mysql2';
import exp from 'constants';

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
const generateJwt = (userid: number, name: string, role: string): string => {
    const payload = {
        userid: userid,
        name: name,
        role: role
    };
    const token: string = jwt.sign(payload, secretKey, { expiresIn: expirationTime });
    return token;
}

// router.use(updateJwtMiddleware);
const updateJwtMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    await updateJwt(req, res);
    next();
};

// to force an update, set expiry to -1
const updateJwt = async (req: Request, res: Response) => {
    const jwtRequest = req as JwtRequest;
    const token: JwtPayload = jwtRequest.token;
    if (!token) { // new login
        return false;
    }
    const userid: number = token.userid;
    const expiry: number = token.exp || -1;
    const issue_time: number = token.iat || -1;
    let toUpdate: boolean = true;
    if ((expiry != -1) && (issue_time != -1)) {
        const currentTime: number = Math.floor(Date.now() / 1000);
        const timeToExpire: number = expiry - currentTime;
        const totalDuration: number = expiry - issue_time;
        if (timeToExpire > totalDuration / 2) {
            toUpdate = false; // still have > 50% time to expiry
        }
    }

    if (toUpdate){
        const tokenDataQuery: string = 
            "SELECT account_type, name FROM accounts WHERE id = ?";
        const tokenDataValues: Array<any> = [userid];

        try {
            const token_results = await new Promise<RowDataPacket[]>((resolve, reject) => {
                conn.query(tokenDataQuery, tokenDataValues, (token_err, token_results, token_fields) => {
                    if (token_err) {
                        reject(token_err);
                        return;
                    }
                    token_results = JSON.parse(JSON.stringify(token_results)) as RowDataPacket[];
                    resolve(token_results);
                });
            });

            const accountType = token_results[0].account_type as string;
            const name = token_results[0].name as string;
            const newToken = generateJwt(userid, name, accountType);
            res.set('Authorization', 'Bearer ' + newToken);
            // jwtRequest.token = jwt.verify(newToken, secretKey) as JwtPayload;
        } catch (error) {
            console.log(error);
        }
    }
};




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
export {generateJwt, authenticateJwt, updateJwtMiddleware };
export { validateAccountType };