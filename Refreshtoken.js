const http = require("http");
var MongoClient = require('mongodb').MongoClient;
var urli = "mongodb://localhost:27017/";
const fetch = require("node-fetch");
let clocktime = 1;

async function datax(){

    console.log("RunRefresh: " + clocktime);
    clocktime = clocktime + 1;

    MongoClient.connect(urli , { useUnifiedTopology: true } ,async function(err, db) {
    if (err) throw err;
    var dbo = await db.db("aidb");
    var dbo = await dbo.collection("danh_sach_driveapi");

    let select = await dbo.find({}).toArray();
    select = JSON.parse(JSON.stringify(select));
    for(let i = 0; i < select.length; i++){
        let data = JSON.stringify({
            "client_id": select[i].client_id,
            "client_secret": select[i].client_secret,
            "refresh_token": select[i].refresh_token,
            "grant_type": "refresh_token",
        });
        let tokenDetails = await fetch("https://accounts.google.com/o/oauth2/token", {
            "method": "POST",
            "body":data
        });
        tokenDetails = await tokenDetails.json();
        // console.log(JSON.stringify(tokenDetails,null,2)); 
        const accessToken = tokenDetails.access_token;  
        var myquery = { index: Number(select[i].index)};
        var newvalues = { $set: { access_token: accessToken} };
        await dbo.updateOne(myquery,newvalues);
    }
    });
}

datax();
setInterval(function() {
    datax();
}, 1800000);