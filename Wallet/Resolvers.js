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
  const balancequery =`select balance from wallets where user_id =?`
     const  [currentBalance]  = await connection.query(balancequery,[args.user_id])
    console.log(currentBalance[0].balance);
    
      if(currentBalance<args.price){
    
       
        
        return res.status(500).json({message:"not enough balance"})
    }
    else{
      
      
      const createpurchasequery = `insert into purchases (user_id,crypto_symbol,amount,price,purchase_date,wallet_id)
      values (?,?,?,?,NOW(),?)`
      const result = await connection.query(createpurchasequery,[args.user_id,args.crypto_symbol,args.amount,args.price,args.wallet_id])
      console.log(result);

      const updatewalletbalance = `update wallets set balance = ? where user_id = ?`;
      const newBalance = currentBalance[0].balance - args.price;
      const newBalance1 = newBalance.toFixed(8);
      
      console.log(newBalance1);
      
      // Use the correct query string here
      const updatedBalance = await connection.query(updatewalletbalance, [newBalance1, args.user_id]);
      
      console.log(updatedBalance);
      
        
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
