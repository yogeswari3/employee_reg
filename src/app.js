require('dotenv').config();  //managing secrets(add securely to github)
const express = require("express");
const path = require("path");
const hbs=require("hbs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser =require("cookie-parser");
const auth = require("./middleware/auth");
//const exp = require("constants");

const app=express();
require("./db/conn");
const Register=require("./models/register");
const port = process.env.PORT || 3000;

const staticPath = path.join(__dirname,"../public");
const templatePath=path.join(__dirname,"../templates/views");
const partialsPath=path.join(__dirname,"../templates/partials");

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended:false}));
app.use(express.static(staticPath));
app.set("view engine","hbs");
app.set("views",templatePath);
hbs.registerPartials(partialsPath);

//console.log(process.env.SECRET_KEY); //SECRET_KEY in .env file

let logined=false;
//let empfName,emplName,empEmail,empPhone,empAge,empYear,empGender;

app.get("/",(req,res)=>{
    res.render("index");
})
app.get("/details",auth,(req,res)=>{
    //console.log(`this is the cookie awesome ${req.cookies.jwt}`); 
    res.render("details",{
        logined:true,
        empfName:req.user.firstname,
        emplName:req.user.lastname,
        empEmail:req.user.email,
        empPhone:req.user.phone,
        empAge:req.user.age,
        empGender:req.user.gender
    });
})

app.get("/logout",auth,async(req,res)=>{
    try {
        //console.log(req.user);

        //for single logout
        req.user.tokens = req.user.tokens.filter((currElement)=>{
            return currElement.token!== req.token
        })

        //logout from all devices
       // req.user.tokens = [];

        res.clearCookie("jwt");
        //console.log(("logout successfully"));
        await req.user.save();
        res.render("login",{
            logined:false
        });
    } catch (error) {
        res.status(500).send(error);
    }
})

app.get("/register",(req,res)=>{
    res.render("register");
});

app.get("/login",(req,res)=>{
    res.render("login");
});

app.get("*",(req,res)=>{
    res.send("<h1>page doesn't exist</h1>");
});

app.post("/register",async(req,res)=>
{
try{
    const password =req.body.password;
    const cpassword=req.body.confirmpassword;
    if(password===cpassword){
        const user = await Register.findOne({$or: [
            {email: req.body.email},
            {phone: req.body.phone}
        ]});
        if(user)
        {
            res.send('<script>alert("email or phone already exists"); window.location.href = "/register"; </script>');
        }
        else
        {
            const registerEmployee=new Register({
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                email: req.body.email,
                gender: req.body.gender,
                phone: req.body.phone,
                age: req.body.age,
                password:password,
                confirmpassword:cpassword,
            })
            //generating token
           // console.log("the success part "+ registerEmployee);
            const token = await registerEmployee.generateAuthToken();
           // console.log("the token part " + token);
    
            //storing the token in cookie
    
            //the res.cookie() function is used to set the cookie name to value
            //the value paramter may be a string or object converted to JSON
            //syntax : res.cookie(name,vlue,[ options])
    
            res.cookie("jwt",token,{
                expires:new Date(Date.now()+30000),
                httpOnly:true
             });
    
            //hashing(bcrypt)
            //before save() runs we runs a pre method (models-register.js)
            const registered=await registerEmployee.save();
            //console.log("the page part " + registered);
            res.status(201).render("login");
        }
    }else{
        res.send("password is not matching");
    }
}catch(e){res.status(400).send("catch block");}
})

app.post("/login",async(req,res)=>{
    try{
        const email = req.body.email;
        const password = req.body.password;
        const useremail = await Register.findOne({email:email});
        const isMatch = await bcrypt.compare(password,useremail.password);

        const token = await useremail.generateAuthToken();
        //console.log("the token part " + token);

        res.cookie("jwt",token,{
             expires:new Date(Date.now()+600000),
             httpOnly:true,
             //secure:true
          });
           

        if(isMatch){
            res.redirect("/details",201,{
                logined:true
            });
          /*  res.set({'Refresh': '0.1; url=/details'});
            res.status(201).render("details",{
                logined:true
            });*/
        }else{
            //res.send("invalid login details");
            res.send('<script>alert("invalid login details"); window.location.href = "/login"; </script>');
        }
    }catch(error){
        //res.status(400).send("<h1>please register before you login</h1>");
        res.send('<script>alert("please register before you login"); window.location.href = "/login"; </script>');
    }
});

/*
const bcrypt = require("bcryptjs");
const securePassword = async (password)=>{
    const passwordHash = await bcrypt.hash(password,10);
    console.log(passwordHash); //$2a$10$aqHz787Y4skxb2nS4ODgPOGMpGZxJdGpfzoQaed3pLNW/ukLelsjm
    const passwordmatch = await bcrypt.compare(password,passwordHash);
    console.log(passwordmatch); //true if matches else false
}
securePassword("yogi");
*/

/*const jwt = require("jsonwebtoken");
const createToken = async() =>{
    const token = await jwt.sign({_id:"62b0ba66553e7db5ac58530e"},"mynameisyogeswariyenduvabtechfinalyear",{
        expiresIn:"2 seconds"
    });
    console.log(token);
    const userVer = await jwt.verify(token,"mynameisyogeswariyenduvabtechfinalyear");
    console.log(userVer);
}
createToken();*/

app.listen(port,()=>{
    console.log(`server is running at port no ${port}`);
})



