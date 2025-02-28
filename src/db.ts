import Database, { Database as DatabaseType } from 'better-sqlite3';
import config from './config';

class DatabaseSingleton {
    private static instance: DatabaseType;

    private constructor() {}

    public static getInstance(): DatabaseType {
        if (!DatabaseSingleton.instance) {
            DatabaseSingleton.instance = new Database(config.database.path);
        }
        return DatabaseSingleton.instance;
    }
}

export default DatabaseSingleton;
