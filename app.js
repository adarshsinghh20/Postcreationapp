const express = require('express');
const app= express();
const cookieParser = require('cookie-parser');
const userModel = require("./models/user");
const postModel = require("./models/post");
const multer = require("multer");
const crypto = require("crypto");
const path=require("path");


app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
const bcrypt=require('bcrypt');
const jwt = require("jsonwebtoken");


  

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/uploads");
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(12 ,function(err,bytes){
      const fn=bytes.toString("hex") + path.extname(file.originalname);
        cb(null, fn);
    });
    
  },
});

const upload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/register", (req, res) => {
  res.render("index");
});

app.get("/profile",isloggedin,async(req, res) => {
 
  let user= await userModel.findOne({email:req.user.email}).populate("posts");
  res.render("profile",{user});
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
        res.status(200).redirect("/profile");
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

// Middleware for logged in checking......

function isloggedin(req,res,next){
  if(!(req.cookies.token)) res.send("You must be logged in ");

else {
  let data = jwt.verify(req.cookies.token,"adsin")
  req.user = data;

next();
}
}

////...................Post Routes................////

app.post("/post", isloggedin, async (req, res) => {
  
  let user = await userModel.findOne({ email: req.user.email });
  let {content}=req.body;
  let post = await postModel.create({
    user:user._id,
    content: content

  });
user.posts.push(post._id);
await user.save();
res.redirect("/profile")
});

////...................edit Routes................////

app.get("/edit/:id", isloggedin, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");
  res.render("edit");
  
});

////..............................Multer................
app.get("/test", (req, res) => {
  res.render("test");
});

app.post("/upload",upload.single("image"),(req,res) =>{
 console.log(req.file);
});

app.listen(3000); 
