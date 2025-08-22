const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express()
app.use(express.json())
app.use(cors({
    origin : "http://localhost:5173",
    credentials : true
}))

const port = process.env.PORT || 5000

app.get("/" , (req , res)=>{
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

async function run() {
  try {

    const foodPostCollection = client.db("sharebite").collection("foodPost")
    const requestsCollection = client.db("sharebite").collection("requests")

    app.get('/allfoodpost' , async ( req , res)=>{
        const query = {status: 'available'}
        const result = await foodPostCollection.find(query).sort({expiredDate: 1 }).toArray()
        res.send(result)
    })


    app.get('/fooddetails/:id' , async(req , res)=>{
      const id = req.params;
      const filter = {_id : new ObjectId(id)}
      const result = await foodPostCollection.findOne(filter)
      res.send(result)
      
    })

    app.post('/addfood' , async ( req , res) =>{
        const newpost = req.body
        const result = await foodPostCollection.insertOne(newpost);
        res.send(result)
    })


    //food reqeust added to the server
    app.post('/addrequest' , async( req , res)=>{
      const newReq = req.body;
      console.log(newReq);
      const id = req.body.FoodId;
      const filter = {_id : new ObjectId(id)}
      const update = {
        $set:{status: 'requested'}
      }
      const options = { upsert: true };
      const result1 = await foodPostCollection.updateOne(filter, update, options);
      const result = await requestsCollection.insertOne(newReq)
      res.send(result)
      
    })




    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);



app.listen(port , ()=>{
    console.log("server is running");
    
})