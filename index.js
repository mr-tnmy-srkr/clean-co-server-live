const express = require("express");
const app = express();
require('dotenv').config()
const port = 5000;

//parsers
app.use(express.json())

const { MongoClient, ServerApiVersion } = require("mongodb");

const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@myprojectscluster.drcktji.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const serviceCollection = client.db('clean-co').collection('services')
const bookingCollection = client.db('clean-co').collection('bookings')


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();

    app.get('/api/v1/services', async (req, res) => {
        const cursor = serviceCollection.find()
        const result = await cursor.toArray()
        res.send(result)
    })
    app.post('/api/v1/user/create-booking', async (req, res) => {
        const booking = req.body;
        const result = await bookingCollection.insertOne(booking)
        res.send(result)
    })

    // Send a ping to confirm a successful connection
    client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
