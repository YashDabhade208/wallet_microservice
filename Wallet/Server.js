const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const schema = require('./Schema');
const app = express();
const port = 3001;
const cors = require('cors');

app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST','PUT','DELETE'], 
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, 
})); 

// Middleware to parse JSON data
app.use(express.json());
app.get('/getout',(req,res)=>{
   return  res.status(200).json({message:"DAMMN"})
})
// Use GraphQL middleware 
app.use('/graphql', graphqlHTTP({
  schema: schema,
  graphiql: true
}));

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}/graphql`);
}); 
