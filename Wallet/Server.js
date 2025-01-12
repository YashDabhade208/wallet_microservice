const express = require('express');
const { graphqlHTTP } = require('express-graphql'); // Correct import
const schema = require('./Schema');
const app = express();
const port = 3001;
const cors = require('cors');
app.use(cors());  // Allow all domains or configure for specific origins


// Middleware to parse JSON data
app.use(express.json());

// Use GraphQL middleware 
app.use('/graphql', graphqlHTTP({
  schema: schema,
  graphiql: true  // Enables GraphiQL tool to test queries in the browser
}));

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}/graphql`);
}); 
