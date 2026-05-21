import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  // Цей рядок автоматично забере логін, пароль, порт і назву бази з URL
  connectionString: process.env.POSTGRES_URL, 
});

export default pool;
