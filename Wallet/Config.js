require('dotenv').config();
const mysql = require('mysql2/promise'); // Use the promise-based wrapper

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: process.env.DB_WAIT_FOR_CONNECTIONS === 'true',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10),
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT, 10),
    timezone: process.env.DB_TIMEZONE,
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT, 10),
});

// Test connection and log confirmation
(async () => {
    try {
        const connection = await pool.getConnection(); // Get a connection from the pool
        console.log('Successfully connected to the database');
        connection.release(); // Release the connection back to the pool
    } catch (err) {
        console.error('Database connection failed:', err.message);
    }
})();

// Export the pool for use in other parts of your application
module.exports = pool;
