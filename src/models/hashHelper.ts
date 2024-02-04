import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';
import { IncomingHttpHeaders } from 'http';

dotenv.config(); // Loads .env file contents into process.env by default.

const secretKey = process.env.JWT_SECRET as string || "secret";
const expirationTime: string = '1h';
const saltRounds = 10;

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
        sub: userid, // "subject", seems to be the convention for the username
        username: username,
        role: role
    };

    const token: string = jwt.sign(payload, secretKey, { expiresIn: expirationTime });

    return token;
}

export interface CustomRequest extends Request {
    token: string | JwtPayload;
}

const authenticateJwt = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Authorization: Bearer <jwt_token>
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            throw new Error();
        }

        const decoded = jwt.verify(token, secretKey);
        (req as CustomRequest).token = decoded;

        next();
    } catch (err) {
        res.status(401).send('Invalid jwt token.');
    }
};

export { hashPassword, comparePassword, generateJwt, authenticateJwt };