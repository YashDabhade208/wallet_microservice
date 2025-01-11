require('dotenv').config();
const mysql = require('mysql2');

// Create the pool using environment variables with proper type handling
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost', // Fallback to 'localhost' if undefined
    port: parseInt(process.env.DB_PORT, 10) || 3306, // Convert string to number, default to 3306
    user: process.env.DB_USER || 'root', // Fallback to 'root' if undefined
    password: process.env.DB_PASSWORD || '', // Default to empty password
    database: process.env.DB_NAME || '', // Default to empty string
    waitForConnections: process.env.DB_WAIT_FOR_CONNECTIONS === 'true', // Convert to boolean
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10, // Default to 10
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT, 10) || 0, // Default to 0
    timezone: process.env.DB_TIMEZONE || 'UTC', // Default to 'UTC'
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT, 10) || 10000, // Default to 10 seconds
});
// Test connection and log confirmation with a Promise wrapper
(async () => {
    try {
        const connection = await new Promise((resolve, reject) => {
            pool.getConnection((err, conn) => {
                if (err) reject(err);
                else resolve(conn);
            });
        });
        1
        connection.release();
        console.log('Successfully connected to the database');
    } catch (err) {
        console.log('Database connection failed:', err);
    }
})();


// Export the pool for use in other parts of your application
module.exports = pool;


