const express = require('express');
const app= express();
const cookieParser = require('cookie-parser');
const userModel = require("./models/user");
const postModel = require("./models/post");

app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
const bcrypt=require('bcrypt');
const jwt = require("jsonwebtoken");

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/register", (req, res) => {
  res.render("index");
});

app.get("/profile",isloggedin,(req, res) => {
  console.log(req.user);
  res.render("login");
});



app.get("/login", (req, res) => {
  res.render("login");
});

app.post('/login', async (req, res) => {
    let {email,password}=req.body;
  let user= await userModel.findOne({email})
  if(!user) return res.status(500).send("Something Went Wrong");

  bcrypt.compare(password,user.password, (err,result)=> {
    if(result){ 
     let token=jwt.sign({email:email, userid: user._id}, "adsin");
        res.cookie("token",token)
        res.status(200).send("You can Login");
  }
    else res.redirect("/login")
})

})



app.post('/register', async (req, res) => {
    let {email,password,username,age,name}=req.body;
  let user= await userModel.findOne({email})
  if(user) return res.status(500).send("User already registered");

  //if no user then we will create new user.
 bcrypt.genSalt(10,(err,salt) =>{
    bcrypt.hash(password,salt, async(err,hash)=> {
        let user= await userModel.create({
            username,
            email,
            age,
            name,
            password:hash
            

        })
        let token=jwt.sign({email:email, userid: user._id}, "adsin");
        res.cookie("token",token)
        res.send("Registered")
    })
 })

});


app.get("/logout", (req, res) => {
  res.cookie("token","");
  res.redirect("/")
});

function isloggedin(req,res,next){
  if(req.cookies.token==="") res.send("You must be logged in ");

else {
  let data = jwt.verify(req.cookies.token,"adsin")
  req.user = data;

next();
}
}



app.listen(3000); 
