import * as mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config(); // Loads .env file contents into process.env by default.

export default class MysqlHelper {
    private static instance: MysqlHelper;
    private connection: mysql.Connection;

    private constructor() {
        this.connection = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PSWD,
            database: process.env.DB_NAME,
            multipleStatements: true
        });
    }

    public static getInstance(): MysqlHelper {
        if (!MysqlHelper.instance) {
            MysqlHelper.instance = new MysqlHelper();
        }

        return MysqlHelper.instance;
    }

    public getConnection(): mysql.Connection {
        return this.connection;
    }
}

