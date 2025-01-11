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
      // Assuming `balance` is a JSON object containing the cryptocurrencies
      const initialBalance = {
        BTC: 0,
        ETH: 0,
        LTC: 0
      };
  
      const query = 'INSERT INTO wallets (user_id, balance) VALUES (?, ?)';
      
      // Insert the user_id and the initial balance as a JSON object
      connection.query(query, [args.user_id, JSON.stringify(initialBalance)], (err, results) => {
        if (err) reject(err);
        resolve(results);
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
      resolve({
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
        console.log('Starting purchase with args:', args);

        // Get wallet balance
        const walletQuery = 'SELECT wallet_id, balance FROM wallets WHERE user_id = ?';
        const [walletData] = await new Promise((resolve, reject) => {
            connection.query(walletQuery, [args.user_id], (err, results) => {
                if (err) {
                    console.error('Wallet query error:', err);
                    reject(err);
                }
                if (!results || results.length === 0) {
                    reject(new Error(`Wallet not found for user_id: ${args.user_id}`));
                }
                console.log('Wallet data found:', results[0]);
                resolve(results);
            });
        });

        // Parse values with proper decimal handling
        const currentBalance = parseFloat(walletData.balance);
        const purchasePrice = parseFloat(args.price);
        const purchaseAmount = parseFloat(args.amount);

        console.log('Values:', {
            currentBalance: currentBalance.toFixed(8),
            purchasePrice: purchasePrice.toFixed(2),
            purchaseAmount: purchaseAmount.toFixed(8)
        });

        if (currentBalance < purchasePrice) {
            throw new Error(`Insufficient balance. Current: ${currentBalance.toFixed(8)}, Required: ${purchasePrice.toFixed(2)}`);
        }

        // Create purchase record
        const purchaseQuery = `
            INSERT INTO purchases 
            (user_id, crypto_symbol, amount, price, purchase_date, wallet_id) 
            VALUES (?, ?, ?, ?, NOW(), ?)
        `;

        const purchaseResults = await new Promise((resolve, reject) => {
            connection.query(purchaseQuery, [
                args.user_id,
                args.crypto_symbol,
                purchaseAmount.toFixed(8),  // amount is decimal(18,8)
                purchasePrice.toFixed(2),   // price is decimal(18,2)
                walletData.wallet_id
            ], (err, results) => {
                if (err) {
                    console.error('Purchase insert error:', err);
                    reject(err);
                }
                console.log('Purchase created:', results);
                resolve(results);
            });
        });

        // Update wallet balance
        const newBalance = (currentBalance - purchasePrice).toFixed(8); // balance is decimal(18,8)
        const updateQuery = 'UPDATE wallets SET balance = ? WHERE wallet_id = ? AND user_id = ?';

        await new Promise((resolve, reject) => {
            connection.query(updateQuery, [
                newBalance,
                walletData.wallet_id,
                args.user_id
            ], (err, results) => {
                if (err) {
                    console.error('Wallet update error:', err);
                    reject(err);
                }
                if (results.affectedRows === 0) {
                    reject(new Error('Failed to update wallet balance'));
                }
                console.log('Wallet updated. New balance:', newBalance);
                resolve(results);
            });
        });

        return {
            purchase_id: purchaseResults.insertId,
            user_id: args.user_id,
            crypto_symbol: args.crypto_symbol,
            amount: purchaseAmount,
            price: purchasePrice,
            wallet_id: walletData.wallet_id
        };
    } catch (error) {
        console.error('Transaction failed:', error);
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
  
module.exports = {
  usersResolver,
  walletResolver,
  purchasesResolver,
  createUserResolver,
  createPurchaseResolver,
  createWalletResolver,
  updateWalletBalanceResolver
};
