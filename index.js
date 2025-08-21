const { MongoClient, ServerApiVersion } = require('mongodb');
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


    app.post('/addfood' , async ( req , res) =>{
        const newpost = req.body
        const result = await foodPostCollection.insertOne(newpost);
        res.send(result)
    })


    app.get('/allfoodpost' , async ( req , res)=>{
        const query = {status: 'available'}
        const result = await foodPostCollection.find(query).toArray()
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