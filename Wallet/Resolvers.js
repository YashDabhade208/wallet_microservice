// resolvers.js
const connection = require('./Config');

// Instead of hardcoding specific crypto symbols, create an empty object
const initialBalance = {};

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
    const query = 'SELECT user_id, wallet_id, balance FROM wallets WHERE user_id = ?';
    connection.query(query, [args.user_id], (err, results) => {
      if (err) {
        reject(err);
        return;
      }

      if (results.length === 0) {
        resolve(null); // or handle the case where no wallet is found
        return;
      }

      const wallet = results[0];
      const balanceData = JSON.parse(wallet.balance);

      const cryptos = Object.keys(balanceData).map(cryptoSymbol => ({
        crypto_symbol: cryptoSymbol,
        balance: balanceData[cryptoSymbol]
      }));

      resolve({
        user_id: wallet.user_id,
        wallet_id: wallet.wallet_id,
        cryptos: cryptos
      });
    });
  });
};


const createWalletResolver = async (parent, args) => {
  try {
      console.log('Creating wallet for user_id:', args.user_id);
      
      const initialBalance = 1000000.00000000; // Match your decimal(18,8) format
      const query = 'INSERT INTO wallets (user_id, balance) VALUES (?, ?)';
      
      const [result] = await connection.query(query, [args.user_id, initialBalance]);
      
      console.log('Wallet created:', result);

      // Return the created wallet data
      return {
          wallet_id: result.insertId,
          user_id: args.user_id,
          balance: initialBalance
      };

  } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
  }
};

  

// Resolver to fetch purchase data for a user
const purchasesResolver = (parent, args) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT purchase_id, crypto_symbol, amount, price, purchase_date, wallet_id FROM purchases WHERE user_id = ?';
    connection.query(query, [args.user_id], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};


// const createUserResolver = (parent, args) => {
//   return new Promise((resolve, reject) => {
//     const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
//     connection.query(query, [args.username, args.email, args.password], (err, results) => {
//       if (err) reject(err);
//       resolve({
//         user_id: results.insertId,
//         username: args.username,
//         email: args.email
//       });
//     });
//   });
// };

// Helper function to initialize balance for a new crypto
const initializeCryptoBalance = (symbol) => {
  if (!initialBalance.hasOwnProperty(symbol)) {
    initialBalance[symbol] = 0;
  }
};

// Resolver to create a purchase and update the wallet
const createPurchaseResolver = async (parent, args) => {
  try {
    const balancequery = `SELECT balance FROM wallets WHERE user_id = ?`;
    const [currentBalance] = await connection.query(balancequery, [args.user_id]);

    console.log('Current balance:', currentBalance[0].balance);
    console.log('Price:', args.price);
    if (currentBalance[0].balance < args.price) {
      throw new Error("Not enough balance");
    }
    
    // Initialize balance for this crypto if it doesn't exist
    initializeCryptoBalance(args.crypto_symbol);
    
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

const createsellResolver = async (parent, args) => {
  try {
    // Get current balance
    const balancequery = `SELECT balance FROM wallets WHERE user_id = ?`;
    const [balanceResults] = await connection.query(balancequery, [args.user_id]);
    
    if (!balanceResults || balanceResults.length === 0) {
      throw new Error('Wallet not found');
    }

    const currentBalance = parseFloat(balanceResults[0].balance);

    const amountquery = `
SELECT 
    w.wallet_id,
    p.crypto_symbol,
    SUM(p.amount) AS total_amount
FROM 
    wallets w
JOIN 
    purchases p ON w.user_id = p.user_id
WHERE 
    w.user_id = ? and p.crypto_symbol = ?
GROUP BY 
    p.crypto_symbol;`;
    
    const [amountResults] = await connection.query(amountquery, [args.user_id, args.crypto_symbol]);
    
    if (!amountResults || amountResults.length === 0) {
      throw new Error('No crypto holdings found');
    }

    if (amountResults[0].total_amount < args.amount) {
      throw new Error('Not enough crypto to sell');
    }

    // Insert sell record into purchases table
    const query = 'INSERT INTO purchases (user_id, crypto_symbol, amount, price, purchase_date, wallet_id) VALUES (?, ?, ?, ?, NOW(), ?)';
    const [result] = await connection.query(query, [
      args.user_id,
      args.crypto_symbol,
      -args.amount, 
      args.price,
      args.wallet_id
    ]);

    // Update wallet balance
    const updatewalletbalance = `UPDATE wallets SET balance = ? WHERE user_id = ?`;
    const newBalance = (currentBalance + args.price).toFixed(8);
    await connection.query(updatewalletbalance, [newBalance, args.user_id]);

    // Return the created sell record
    return {
      sell_id: result.insertId,
      user_id: args.user_id,
      crypto_symbol: args.crypto_symbol,
      amount: args.amount,
      price: args.price,
      wallet_id: args.wallet_id
    };
  } catch (error) {
    console.error('Error creating sell:', error);
    throw error;
  }
};

const getWalletCryptoHoldings = async (parent, args) => {
  console.log('Starting getWalletCryptoHoldings with user_id:', args.user_id);
  
  if (!args.user_id) {
      console.error('No user_id provided');
      throw new Error('User ID is required');
  }

  try {
      const query = `
          SELECT 
              p.crypto_symbol,
              SUM(p.amount) as balance
          FROM 
              purchases p
          WHERE 
              p.user_id = ?
          GROUP BY 
              p.crypto_symbol
      `;
      
      console.log('Executing query for wallet_id:', args.user_id);
      
      const [results] = await connection.query(query, [args.user_id]);
      
      console.log('Raw query results:', results);
      
      if (!results || results.length === 0) {
          console.log('No holdings found for wallet');
          return [];
      }

      // Format results
      const holdings = results.map(row => ({
          crypto_symbol: row.crypto_symbol,
          balance: parseFloat(row.balance)
      }));

      console.log('Formatted holdings:', holdings);
      return holdings;

  } catch (error) {
      console.error('Error fetching wallet holdings:', error);
      throw error;
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
  const getBalanceResolver = async (parent, args) => {
    try {
      const query = 'SELECT balance FROM wallets WHERE user_id = ?';
      const [results] = await connection.query(query, [args.user_id]);
      
      if (!results || results.length === 0) {
        throw new Error('Wallet not found for this user');
      }
      
      // Return the balance directly
      return parseFloat(results[0].balance);
      
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error;
    }
  };
  
module.exports = {
  usersResolver,
  walletResolver,
  purchasesResolver,
  createPurchaseResolver,
  createWalletResolver,
  updateWalletBalanceResolver,
  getWalletCryptoHoldings,
  createsellResolver,
  getBalanceResolver
};
