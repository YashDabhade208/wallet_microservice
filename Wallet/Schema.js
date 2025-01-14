// schema.js
const { GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLInt, GraphQLFloat, GraphQLList } = require('graphql');
const { 
  usersResolver, 
  walletResolver, 
  purchasesResolver, 
  createUserResolver, 
  createPurchaseResolver,
  createWalletResolver,
  updateWalletBalanceResolver,
  getWalletCryptoHoldings,
  createsellResolver,
  getBalanceResolver
} = require('./Resolvers');

// Define the CryptoType (which represents each cryptocurrency and its balance)
const CryptoType = new GraphQLObjectType({
  name: 'Crypto',
  fields: () => ({
    crypto_symbol: { type: GraphQLString },
    balance: { type: GraphQLFloat }
  })
});

// Define the UserType
const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    user_id: { type: GraphQLInt },
    username: { type: GraphQLString },
    email: { type: GraphQLString }
  })
});

// Define the WalletType with a list of cryptocurrencies and their balances
const WalletType = new GraphQLObjectType({
  name: 'Wallet',
  fields: () => ({
    wallet_id: { type: GraphQLInt },
    user_id: { type: GraphQLInt },
    cryptos: { type: new GraphQLList(CryptoType) } // List of cryptocurrencies with their balances
  })
});

// Define the PurchaseType
const PurchaseType = new GraphQLObjectType({
  name: 'Purchase',
  fields: () => ({
    purchase_id: { type: GraphQLInt },
    crypto_symbol: { type: GraphQLString },
    amount: { type: GraphQLFloat },
    price: { type: GraphQLFloat },
    purchase_date: { type: GraphQLString },
    wallet_id: { type: GraphQLInt }
  })
});

// Define the SellType
const SellType = new GraphQLObjectType({
  name: 'Sell',
  fields: () => ({
    sell_id: { type: GraphQLInt },
    crypto_symbol: { type: GraphQLString },
    amount: { type: GraphQLFloat },
    price: { type: GraphQLFloat },
    sell_date: { type: GraphQLString },
    wallet_id: { type: GraphQLInt }
  })
});

// RootQuery to fetch users, wallets, and purchases
const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    users: {
      type: new GraphQLList(UserType),
      resolve: usersResolver
    },
    wallet: {
      type: WalletType,
      args: { user_id: { type: GraphQLInt } },
      resolve: walletResolver
    },
    purchases: {
      type: new GraphQLList(PurchaseType),
      args: { user_id: { type: GraphQLInt } },
      resolve: purchasesResolver
    },
    getWalletHoldings: {
      type: new GraphQLList(CryptoType),
      args: { user_id: { type: GraphQLInt } },
      resolve: getWalletCryptoHoldings
    },
    getBalance: {
      type: GraphQLFloat,
      args: { user_id: { type: GraphQLInt } },
      resolve: getBalanceResolver
    }
  }
});

// Mutation to insert new users, purchases, and wallets
const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createUser: {
      type: UserType,
      args: {
        username: { type: GraphQLString },
        email: { type: GraphQLString },
        password: { type: GraphQLString }
      },
      resolve: createUserResolver
    },
    createPurchase: {
      type: PurchaseType,
      args: {
        user_id: { type: GraphQLInt },
        crypto_symbol: { type: GraphQLString },
        amount: { type: GraphQLFloat },
        price: { type: GraphQLFloat },
        wallet_id: { type: GraphQLInt }
      },
      resolve: createPurchaseResolver
    },
    createWallet: {
      type: WalletType,
      args: {
        user_id: { type: GraphQLInt }
      },
      resolve: createWalletResolver
    }
    , updateWalletBalance: {
        type: WalletType,
        args: {
          user_id: { type: GraphQLInt },
          crypto_symbol: { type: GraphQLString },
          amount: { type: GraphQLFloat }
        },
        resolve: updateWalletBalanceResolver
      },
      createSell: {
        type: SellType,
        args: {
          user_id: { type: GraphQLInt },
          crypto_symbol: { type: GraphQLString },
          amount: { type: GraphQLFloat }
        },
        resolve: createsellResolver
      }
      
  }
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation
});
