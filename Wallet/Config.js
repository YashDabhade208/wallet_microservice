const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: "mysql-376920d9-ankurbahadure007-251b.g.aivencloud.com",
    port: 22980,
    user: "avnadmin",
    password: "AVNS_y3lgRr1IBI983QxlHBI",
    database:"1works",
    waitForConnections:  'true',
    connectionLimit: 10,
    queueLimit:2,
    timezone:"UTC",
    connectTimeout: 20000 
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
        console.log('Successfully connected to the database');
         // Release the connection back to the pool
    } catch (err) {
        console.log('Database connection failed:', err);
    }
})();


// Export the pool for use in other parts of your application
module.exports = pool;


