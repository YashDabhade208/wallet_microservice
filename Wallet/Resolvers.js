// resolvers.js
const connection = require('./Config');

// Resolver to fetch users
const usersResolver = () => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT user_id, username, email FROM users';
    connection.query(query, (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Resolver to fetch wallet data for a user
const walletResolver = (parent, args) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT wallet_id, crypto_symbol, balance FROM wallets WHERE user_id = ?';
    connection.query(query, [args.user_id], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

const createWalletResolver = (parent, args) => {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO wallets (user_id, balance) VALUES (?, ?)';
    
    connection.query(query, [args.user_id, 10000], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          wallet_id: results.insertId,
          user_id: args.user_id,
          balance: 10000  
        });
      }
    });
  });
};

  

// Resolver to fetch purchase data for a user
const purchasesResolver = (parent, args) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT purchase_id, crypto_symbol, amount, price, purchase_date FROM purchases WHERE user_id = ?';
    connection.query(query, [args.user_id], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Resolver to create a new user
const createUserResolver = (parent, args) => {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    connection.query(query, [args.username, args.email, args.password], (err, results) => {
      if (err) reject(err);
      return({
        user_id: results.insertId,
        username: args.username,
        email: args.email
      });
    });
  });
};

// Resolver to create a purchase and update the wallet
const createPurchaseResolver = async (parent, args) => {
  try {
    const balancequery = `SELECT balance FROM wallets WHERE user_id = ?`;
    const [currentBalance] = await connection.query(balancequery, [args.user_id]);
    
    if (currentBalance[0].balance < args.price) {
      throw new Error("Not enough balance");
    }
    
    // Insert purchase record
    const createpurchasequery = `INSERT INTO purchases (user_id, crypto_symbol, amount, price, purchase_date, wallet_id)
      VALUES (?, ?, ?, ?, NOW(), ?)`;
    const [result] = await connection.query(createpurchasequery, [
      args.user_id,
      args.crypto_symbol,
      args.amount,
      args.price,
      args.wallet_id
    ]);

    // Update wallet balance
    const updatewalletbalance = `UPDATE wallets SET balance = ? WHERE user_id = ?`;
    const newBalance = (currentBalance[0].balance - args.price).toFixed(8);
    await connection.query(updatewalletbalance, [newBalance, args.user_id]);

    // Return the created purchase record
    return {
      purchase_id: result.insertId,
      user_id: args.user_id,
      crypto_symbol: args.crypto_symbol,
      amount: args.amount,
      price: args.price,
      wallet_id: args.wallet_id
    };
  } catch (error) {
    throw new Error(error.message);
  }
};
  
  
  const updateWalletBalanceResolver = (parent, args) => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT balance FROM wallets WHERE user_id = ?';
      
      connection.query(query, [args.user_id], (err, results) => {
        if (err) reject(err);
  
        if (results.length === 0) {
          reject(new Error('Wallet does not exist for this user.'));
          return;
        }
  
        // Parse the current balance JSON
        const wallet = results[0];
        const currentBalance = JSON.parse(wallet.balance);
  
        // Check if the cryptocurrency exists in the wallet
        if (!currentBalance.hasOwnProperty(args.crypto_symbol)) {
          reject(new Error(`No balance found for ${args.crypto_symbol}.`));
          return;
        }
  
        // Update the balance for the given cryptocurrency
        currentBalance[args.crypto_symbol] += args.amount;
  
        // Update the balance in the database
        const updateQuery = 'UPDATE wallets SET balance = ? WHERE user_id = ?';
        connection.query(updateQuery, [JSON.stringify(currentBalance), args.user_id], (updateErr, updateResults) => {
          if (updateErr) reject(updateErr);
          resolve({ user_id: args.user_id, balance: currentBalance });
        });
      });
    });
  };
  
module.exports = {
  usersResolver,
  walletResolver,
  purchasesResolver,
  createUserResolver,
  createPurchaseResolver,
  createWalletResolver,
  updateWalletBalanceResolver
};
