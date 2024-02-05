import { Request } from 'express';
import { JwtPayload } from "jsonwebtoken";


// sub: userid
// username: username
// role: account_type
// iat: issued at
// exp: expiration time
// 2 ways to access the payload:
// access as a dictionary: token['sub']
// access as a parameter: token.sub 
interface JwtRequest extends Request {
    token: JwtPayload;
}

export { JwtRequest }