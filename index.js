const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express()
app.use(express.json())
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}))
const admin = require("firebase-admin");
const port = process.env.PORT || 5000

app.get("/", (req, res) => {
  res.send("sharemeal server is running")
})



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_SECRET_KEY}@cluster0.blokvlz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const decoded = Buffer.from(process.env.FB_SERVICES_KEY, 'base64').toString('utf8')
const serviceAccount = JSON.parse(decoded)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const verifyToken = async (req, res, next) => {
  const accessToken = req.headers?.authorization
  if (!accessToken || !accessToken.startsWith("Bearer ")) return res.status(401).send({ message: "unauthorized access" })
  const token = accessToken.split(" ")[1]
  try {
    const decoded = await admin.auth().verifyIdToken(token)
    req.decoded = decoded
    next();
  }
  catch (error) {
    return res.status(401).send({ message: "unauthorized access" })
  }
}
const verfiyEmail = (req, res, next) => {
  if (req.decoded.email === req.query.email) next()
  else return res.status(401).send({ message: "unauthorized access" })
}
const verifyDonerEmail = (req, res, next) => {
  if (req.decoded.email == req.body.donor.email) next()
  else return res.status(401).send({ message: "unauthorized access" })
}

async function run() {
  try {

    const foodPostCollection = client.db("sharebite").collection("foodPost")
    const requestsCollection = client.db("sharebite").collection("requests")

    const verfiyDltAuth = async (req, res, next) => {
      const id = req.params;
      const query = { _id: new ObjectId(id) }
      const result = await foodPostCollection.findOne(query)
      if (result.donor.email === req.decoded.email) next()
      else return res.status(401).send({ message: "unauthorized access" })
    }

    app.get('/allfoodpost', async (req, res) => {
      const query = { status: 'available' }
      const result = await foodPostCollection.find(query).sort({ expiredDate: 1 }).toArray()
      res.send(result)
    })


    app.get('/fooddetails/:id', async (req, res) => {
      const id = req.params;
      const filter = { _id: new ObjectId(id) }
      const result = await foodPostCollection.findOne(filter)
      res.send(result)

    })

    app.get('/myfoods', verifyToken, verfiyEmail, async (req, res) => {
      const email = req.query.email
      const filter = { "donor.email": email };
      const result = await foodPostCollection.find(filter).toArray()
      res.send(result)
    })

    app.get('/myrequests', async (req, res) => {
      const email = req.query.email;
      const filter = {userEmail : email}
      const result = await requestsCollection.find(filter).toArray()
      res.send(result)

    })

    app.post('/addfood', async (req, res) => {
      const newpost = req.body
      const result = await foodPostCollection.insertOne(newpost);
      res.send(result)
    })



    //food reqeust added to the server
    app.post('/addrequest', async (req, res) => {
      const newReq = req.body;
      const id = req.body.FoodId;
      const filter = { _id: new ObjectId(id) }
      const update = {
        $set: { status: 'requested' }
      }
      const options = { upsert: true };
      const result1 = await foodPostCollection.updateOne(filter, update, options);
      const result = await requestsCollection.insertOne(newReq)
      res.send(result)

    })

    app.put('/myfood/update/:id', verifyToken, verifyDonerEmail, async (req, res) => {
      const id = req.params
      const query = { _id: new ObjectId(id) }
      const update = {
        $set: req.body
      }
      const options = { upsert: true };
      const result = await foodPostCollection.updateOne(query, update, options);
      res.send(result)
    })

    app.delete('/fooddlt/:id', verifyToken, verfiyDltAuth, async (req, res) => {
      const id = req.params;
      const query = { _id: new ObjectId(id) }
      const result = await foodPostCollection.deleteOne(query)
      res.send(result)
    })

    await client.db("admin").command({ ping: 1 });
    //("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);



app.listen(port, () => {
  console.log("server is running");

})