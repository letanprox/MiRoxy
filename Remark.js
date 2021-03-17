const http = require("http");
var MongoClient = require('mongodb').MongoClient;
var urli = "mongodb://localhost:27017/";
const fetch = require("node-fetch");
const fs = require("fs");
let clock = 23;
let clocktime = 1;

function clockTime(){

console.log("RunRemark: " + clocktime);
clocktime = clocktime + 1;

MongoClient.connect(urli , { useUnifiedTopology: true } ,async function(err, db) {
    if (err) throw err;
    var dbo = await db.db("aidb");
    var dbo = await dbo.collection("danh_sach_drivetemp");

    let select = await dbo.find({}).toArray();
    select = JSON.parse(JSON.stringify(select));

    select.forEach(element => {
        if(Number(caculateDay(element.thoi_gian)) > clock){
            dbo.deleteOne({name: element.name},)
            fs.unlinkSync(element.direct);
        }

        fs.readdir(String(String(element.direct).split('/')[0]), function(err, files) {
            if (err) {
            } else {
               if (!files.length) {
                  fs.rmdirSync(String(String(element.direct).split('/')[0]), { recursive: true });
               }
            }
        });

    });
});

}


let caculateDay = (day)=>{
    date1 = new Date(day);
    var today = new Date();
    var date = today.getFullYear()+'/'+(today.getMonth()+1)+'/'+today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    date2 =  new Date(date+' '+time);    
    time = Math.abs(((date2.getTime() - date1.getTime())/1000));
    return Math.floor(time / (60));                  
}

let getCurrentTime = ()=>{
    var today = new Date();
    var date = today.getFullYear()+'/'+(today.getMonth()+1)+'/'+today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    return date+' '+time;
}

clockTime();
setInterval(function() {
    clockTime();
}, 420000);