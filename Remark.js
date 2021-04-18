const http = require("http");
var MongoClient = require('mongodb').MongoClient;
var urli = "mongodb://localhost:27017/";
const fetch = require("node-fetch");
const fs = require("fs");

let clock = 720;
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
        if(Number(caculateDay(element.thoi_gian)) >= clock){
            dbo.deleteOne({name: element.name},)
            if (fs.existsSync(element.direct)){ 
                fs.unlinkSync(element.direct);
            }
        }

        let dirx = String(element.direct).split('/')[0] + String(element.direct).split('/')[1]
        if (fs.existsSync(dirx)){ 
        fs.readdir(String(dirx), function(err, files) {
            if (err) {
            } else {
               if (!files.length) {
                  fs.rmdirSync(String(dirx), { recursive: true });
               }
            }
        });
        }
    });

    fs.readdir('./TempFile/', function (err, folder_) {
        if (err) throw err;
        else {
            folder_.map(function (folder__) {
            let Pathx = './TempFile/' + folder__;
            fs.readdir(String(Pathx), function(err, files) {
                if (err) {
                } else {
                   if (!files.length) {
                      fs.rmdirSync(String('./TempFile/' + folder__), { recursive: true });
                   }
                }
            });
            });
        }
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

clockTime();
setInterval(function() {
    clockTime();
}, 300000);
