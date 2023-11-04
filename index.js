const express = require("express");
const app = express();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const port = 5000;

//middleware (parsers)
app.use(express.json());
app.use(cookieParser());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@myprojectscluster.drcktji.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const serviceCollection = client.db("clean-co").collection("services");
const bookingCollection = client.db("clean-co").collection("bookings");

//middleware
//verify token and grant access
const gateman = (req, res, next) => {
  const token = req?.cookies?.token;
  // or
  // const { token } = req.cookies
  // console.log(token);

  //if client does not send token
  if (!token) {
    return res.status(401).send({ message: "You are not authorized" });
  }
  // verify a token symmetric
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: "You are not authorized" });
    }
    // attach decoded user so that others can get it
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();

    app.get("/api/v1/services", gateman, async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.post("/api/v1/user/create-booking", async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    // user specific bookings
    app.get("/api/v1/user/bookings", gateman, async (req, res) => {
      const queryEmail = req.query.email;
      const tokenEmail = req.user.email;
      // console.log(queryEmail, tokenEmail);

      if (queryEmail !== tokenEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }

      //query ?email="mir@gmail.com" // email specific
      // query ?   X    // all data
      let query = {};
      if (queryEmail) {
        query.email = queryEmail;
      }
      // console.log(query);
      // const result = await bookingCollection.findOne({email:queryEmail});
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/api/v1/user/cancel-booking/:bookingId", async (req, res) => {
      const id = req.params.bookingId;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    //jwt access token
    app.post("/api/v1/auth/access-token", async (req, res) => {
      // creating token and send to client
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: 60 * 60,
      });
      //  console.log(token);
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: true,
        })
        .send({ success: true });
    });

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
