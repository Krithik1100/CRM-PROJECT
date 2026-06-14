"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool_1 = __importDefault(require("./pool"));
async function migrate() {
    const schemaPath = path_1.default.join(__dirname, 'schema.sql');
    const schema = fs_1.default.readFileSync(schemaPath, 'utf-8');
    const client = await pool_1.default.connect();
    try {
        console.log('Running database migrations...');
        await client.query(schema);
        console.log('✅ Database schema applied successfully');
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
    finally {
        client.release();
        await pool_1.default.end();
    }
}
migrate();
//# sourceMappingURL=migrate.js.map