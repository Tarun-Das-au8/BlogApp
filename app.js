const express = require("express");
const mongodb = require("mongodb");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");

const port = process.env.PORT || 7700;
let app = express();
const url = "mongodb://localhost:27017";
let db;

app.use(cors());
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
//use session
app.use(session({
  secret:'mysessionid'
}))

app.get('/',(req,res)=>{
  res.status(200).send('Program running successfully');
})

var mongoClient = new mongodb.MongoClient(url,{useNewUrlParser:true, useUnifiedTopology:true})
mongoClient.connect((err)=>{
  if(err) throw err
  db = mongoClient.db('myBlog');
})

//get all post
app.get('/post',(req,res)=>{
  if(!req.session.user){
    res.send('No session found')
  }
  db.collection('posts').find().toArray((err,postdata)=>{
    if(err) throw err;
    res.send(postdata);
  })
})

app.post('/addpost',(req,res) => {
  if(!req.session.user) { 
      res.send('No Session founds')
  }

  let data = {
      title: req.body.title,
      description:req.body.description, 
      createBy:req.session.user._id,
      name:req.session.user.name
  }

  //console.log(data)
  //res.send(data)
  db.collection('posts').insert(data,(err,result) => {
      if(err) throw err;
      res.send("Post added")
  })

})

//Register User
app.post('/register',(req,res)=>{
  let user = {
    name:req.body.name,
    email:req.body.email,
    password:req.body.password
  }
  console.log(user);
  db.collection('users').insert(user, (err,data)=>{
      res.send("Data added");
  })
})

app.post('/login',(req,res) => {
  let user = {
      email:req.body.email,
      password:req.body.password 
  }
  db.collection("users").findOne(user,(err,data) => {
      if(err || !data){
          res.send("No User Found")
      }else{
         req.session.user=data;
         res.send("login success")
      }
  });
});

app.get('/logout',(req,res)=>{
    req.session.user = null;
    res.send('Logout success');
})

app.listen(port,(err)=>{
  if(err) throw err
  console.log(`Server running on port ${port}`);
})