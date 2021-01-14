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
//static path
app.use(express.static(__dirname+'/public'));
//html
app.set('views','./src/views');
//view engine
app.set('view engine','ejs');

app.get('/',(req,res)=>{
  let message = req.query.message?req.query.message:'';
  res.render('login',{message:message});
})

var mongoClient = new mongodb.MongoClient(url,{useNewUrlParser:true, useUnifiedTopology:true})
mongoClient.connect((err)=>{
  if(err) throw err
  db = mongoClient.db('myBlog');
})

//get all post
app.get('/posts',(req,res)=>{
  if(!req.session.user){
    res.redirect("/?message=No Session founds! Please Try Again")
  }
  db.collection('posts').find({isActive:true}).toArray((err,postdata)=>{
    if(err) throw err;
    res.render('blog',{postdata:postdata,username:req.session.user.name});
  })
})

//for add post ui
app.get('/addPost',(req,res)=>{
  res.render('addPost');
})

app.post('/addpost',(req,res) => {
  if(!req.session.user) { 
    res.redirect("/?message=No Session founds! Please Try Again")
  }

  let data = {
      name: req.body.title,
      description:req.body.description, 
      createBy:req.session.user._id,
      name:req.session.user.name,
      isActive:true
  }

  //console.log(data)
  //res.send(data)
  db.collection('posts').insert(data,(err,result) => {
      if(err) throw err;
      //res.send("Post added")
      res.redirect('/posts')
  })

})

//displaying UI
app.get('/register',(req,res)=>{
  res.render('register');
})

//Register User
app.post('/register',(req,res)=>{
  let user = {
    name:req.body.name,
    email:req.body.email,
    password:req.body.password,
    role:req.body.role?req.body.role:'user',
    isActive:true
  }
  console.log(user);
  db.collection('users').insert(user, (err,data)=>{
      res.redirect('/');
  })
})

//edit post
app.get('/edit/:id',(req,res)=>{
  if(!req.session.user){
    res.redirect("/?message=No Session founds! Please Try Again")
  }
  let Id = req.params.Id;
  db.collection('post').findOne(
    {_id:mongodb.ObjectID(Id)},
    (err,data)=>{
      if(err) throw err;
      console.log(data);
      res.render('edit',{data});
    }
  )
})

//update post
app.post('/editPost/:id',(req,res)=>{
  let Id = req.params.Id;
  db.collection('posts').update(
    {_id:mongodb.ObjectID(Id)},
    {
      $set:{
        title:req.body.title,
        description:req.body.description
      }
    },(err,result)=>{
      if(err) throw err
      res.redirect('/posts');
    }
  )
})

//hard delete post
app.delete('deletePost/:id',(req,res)=>{
  let Id = req.params.id;
  db.collection('posts').remove({_id:mongodb.ObjectID(Id)},(err,result)=>{
    if(err) throw err
    res.send('Data deleted');
  })
})

//edit user
app.put('/editUser/:id',(req,res)=>{
  let Id = req.params.Id;
  db.collection('users').update(
    {_id:mongodb.ObjectID(Id)},
    {
      $set:{
        name:req.body.name,
        email:req.body.email
      }
    },(err,result)=>{
      if(err) throw err
      res.send('Data updated');
    }
  )
})

//soft delete user
app.put('/deactivateDelete/:id',(req,res)=>{
  let Id = req.params.Id;
  db.collection('users').update(
    {_id:mongodb.ObjectID(Id)},
    {
      $set:{
        isActive:false
      }
    },(err,result)=>{
      if(err) throw err
      res.send('Data updated');
    }
  )
})

app.post('/login',(req,res) => {
  let user = {
      email:req.body.email,
      password:req.body.password
  }
  db.collection("users").findOne(user,(err,data) => {
      if(err || !data){
          res.redirect('/?message=Invalid Login! Please try again.')
      }else{
         req.session.user=data;
         res.redirect("/posts");
      }
  });
});

app.get('/logout',(req,res)=>{
    req.session.user = null;
    res.redirect('/?message=Logout Success! Please login again.')
})

//all users
app.get('/allusers',(req,res)=>{
  db.collection('users').find().toArray((err,data)=>{
    res.render('users',{data:data})
  })
})

app.listen(port,(err)=>{
  if(err) throw err
  console.log(`Server running on port ${port}`);
})