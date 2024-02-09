import { Request } from 'express';
import { JwtPayload } from "jsonwebtoken";


// userid: userid
// username: username
// role: account_type
// iat: issued at
// exp: expiration time
// 2 ways to access the payload:
// access as a dictionary: token['userid']
// access as a parameter: token.userid 
interface JwtRequest extends Request {
    token: JwtPayload;
}

export { JwtRequest }