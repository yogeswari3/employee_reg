const mongoose=require("mongoose");
mongoose.connect("mongodb+srv://yogeswari:Yogi1304@cluster0.jvo0dze.mongodb.net/emp-reg?retryWrites=true&w=majority",{
    useNewurlParser:true,
    useUnifiedTopology:true,
   
}).then(()=>{
    console.log("connection established");
}).catch((err)=>{
    console.log(err);
})
