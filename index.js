const express=require('express')
const cors=require('cors')
const jwt=require('jsonwebtoken')
require('dotenv').config()
const app=express();
const port=process.env.PORT || 5000;

//Middleware
app.use(cors())
app.use(express.json())

// console.log(process.env.M_PASS)
//////////////////////
app.get('/',(req,res)=>{
    res.send('Car doctor server is Running')
})



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.M_USER}:${process.env.M_PASS}@cluster0.6g3butq.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyjwt=(req,res,next)=>{
  console.log("Hitting verify JWT Token");
  console.log(req.headers.authorization)
  const authorization=req.headers.authorization;
  if(!req.headers.authorization){
    return res.status(401).send({error:true,message:"Unauthorized Access"})
  }
  const token=authorization.split(' ')[1];
  console.log("Inside the token",token)
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(error,decoded)=>{
    if(error){
      return res.status(403).send({error:true,message:"Unauthorized Access"})
    }
    req.decoded=decoded;
    next();
  })

}
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();
    const serviceCollection=client.db('carDoctor').collection('services')
    const orderCollection=client.db('orderSDB').collection('orders')

    //show all services
    app.get('/services',async(req,res)=>{
      const sort=req.query.sort;
      const search=req.query.search;
      console.log(search)
      //this query for all froduct shoe
      // const query={}; 
        const query={title:{$regex:search , $options:'i'}}
        const options={
          sort:{
            "price": sort==='asc' ? 1:-1
          }
        }
        const cursor=serviceCollection.find(query,options);
        const result= await cursor.toArray();
        res.send(result);
    
    })
    //bOOKING
        //booking or orders
        app.post('/booking',async(req,res)=>{
          const booking=req.body;
          const result = await orderCollection.insertOne(booking);
          res.send(result);
    
      })
    //JWT TOKEN SERVICE
    app.post('/jwt',async(req,res)=>{
      const user=req.headers;
      console.log(user);
      const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:'48h'
      })
      res.send({token});
  
  })


  //find some specific data using query
  app.get('/booked',verifyjwt,async(req,res)=>{
    const decoded=req.decoded;
    console.log(decoded.email)
    console.log("After cameback",decoded)
    // if(decoded.email !== req.query.email){
    //   return res.status(403).send({error:true, message:"For bidden Access"})
    // }
    // console.log(req.query)
    console.log(req.headers)
    let query={}
    if(req.query?.email){
      query={email:req.query.email}
    }
    // console.log(req.query.email)
    // const query={};
    // if(req.query?.email){
    //   query={email:req.query.email}
    // }
    const result= await orderCollection.find(query).toArray();
    res.send(result)
})
    //delete
    app.delete('/booked/:id',async(req,res)=>{
      const id=req.params.id
      const query = {_id: new ObjectId(id) };
      const result= await orderCollection.deleteOne(query);
      res.send(result)

  
  })
  //delete
  app.patch('/booked/:id',async(req,res)=>{
    const id=req.params.id;
    const filter={_id: new ObjectId(id)}
    const updatebooking=req.body;
    console.log(updatebooking)
    const updatedoc={
      $set:{
        status:updatebooking.status

      }
      
    }
    const result=await orderCollection.updateOne(filter,updatedoc)
    res.send(result)


})
    app.get('/services/:id',async(req,res)=>{
        const id=req.params.id
        const query = {_id: new ObjectId(id) };
        const options = {
            // Include only the `title` and `imdb` fields in the returned document
            projection: {title: 1, price: 1, service_id:1, img:1,},
          };
        const result=await serviceCollection.findOne(query, options);
        res.send(result)
    
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);


app.listen(port,()=>{
    console.log(`Car server Running on port ${port}`)

})