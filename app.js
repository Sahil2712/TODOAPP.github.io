const express=require('express');
const app=express();
const bodyParser=require('body-parser');
const path=require('path');
const db=require("./db");
const collection="todo";
const Joi=require('joi');

//Schema Used for Validation for our todo document
const schema=Joi.object().keys({
    todo:Joi.string().required()
});
//Parser Json data Sent to us by the user
app.use(bodyParser.json());
//Serve static  html file to user
app.get('/',function (req,res) {
  res.sendFile(path.join(__dirname,'index.html'));
});
//Read
app.get('/getTodos',function (req,res) {
  //get all Todo documents within our todo collection
  //send back to user as json
  db.getDB().collection(collection).find({}).toArray((err,documents)=>{
    if(err){
      console.log(err);
    }
    else {
      // console.log(documents);
      res.json(documents);
    }
  });
});
//update
app.put('/:id',function (req,res) {
  //Primarykey to Todo Document we wish to update
  const todoID=req.params.id;
  //Document used to update
  const userInput=req.body;
  //Find Document ny ID and Update
  db.getDB().collection(collection).findOneAndUpdate({_id:db.getPrimaryKey(todoID)},
    {$set:{todo:userInput.todo}},{returnOriginal:false},function (err,result) {
        if(err){
          console.log(err);
        }
        else{
          res.json(result);
        }
    });
});

//Create
app.post('/',function (req,res,next) {
  //Document to be inserted
  const userInput=req.body;
  //Validate document
  //If document is invalid pass to error middleware
 Joi.validate(userInput,schema,function(err,result){
   if(err){
     const error=new Error("Invalid Input");
     error.status=400;
     next(error);
   }
   else{
  db.getDB().collection(collection).insertOne(userInput,function(err,result) {
    if(err){
      const error=new Error("Failed to insert Todo Document");
      error.status=400;
      // console.log(err);
      next(err);
    }
    else{
      res.json({result:result,document:result.ops[0],msg:"Succesfully inserted Todo!!!",error:null});
    }
    });
    }
  })
});
//Delete
app.delete('/:id',function(req,res) {
  //Primarykey to Todo Document
  const todoID=req.params.id;
  //Find Document by ID and Delete document
  db.getDB().collection(collection).findOneAndDelete({_id:db.getPrimaryKey(todoID)},
    function (err,result) {
      if(err){
        console.log(err);
      }
      else{
        res.json(result);
      }
    });
});
//middleware for handling error
//Send Error response back to user
app.use(function(err,req,res,next) {
  res.status(err.status).json({
    error:{
      message:error.message
    }
  });
})
db.connect((err)=>{
  //If error unable to connect to database
  //End application
  if(err){
    console.log('Unable to connect to database');
    process.exit(1);
  }
  else{
    app.listen(3000,function () {
      console.log("Connected to Database,app listening to server 3000");

    });
  }
});
