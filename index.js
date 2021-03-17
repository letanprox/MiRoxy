const http = require("http");
const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch");
const {google} = require('googleapis');
const readline = require('readline');

const express = require('express');
var cors = require('cors');
const app = express()
const port = 80;


var corsOptions = {
    origin: 'http://cuongonepiece.com',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }


var MongoClient = require('mongodb').MongoClient;
var urli = "mongodb://localhost:27017/";
var URL = require('url').URL;

app.use(cors(corsOptions) , (req, response) => {
MongoClient.connect(urli , { useUnifiedTopology: true } ,async function(err, db) {
  if (err) throw err;

  let dbo = await db.db("aidb");
  dbo = await dbo.collection("danh_sach_drivetemp");

  let nameFile = String(req.url).replace('/', '').replace(' ','');
  let listnum = nameFile.split("_");
  let nameFolder = nameFile.replace(String(String(listnum[listnum.length - 1])), '') ;

  if (!fs.existsSync(nameFolder)){
    fs.mkdirSync(nameFolder);
  }

  let query = { name:nameFile};
  let select = await dbo.find(query).toArray();

  if(select.length > 0){

    console.log(nameFile," + get");
    let readStream = fs.createReadStream(String(select[0].direct));
    readStream.on('open', function () {
        readStream.pipe(response);
    });
    readStream.on('error', function(err) {
        res.end(err);
    });
    dbo.updateOne(
        {name: String(select[0].name)},
        {$set: {thoi_gian: getCurrentTime()}},
        {upsert: true}
    )

  }else{

    console.log(nameFile," + create")

  dbo = await db.db("aidb");
  dbo = await dbo.collection("danh_sach_drivelist");
  let query = { name:nameFile};
  let select = await dbo.find(query).toArray();
  select = JSON.parse(JSON.stringify(select[0]));

  var fileId = String(select.id);
  var nameId = String(select.name);
  dbo = await db.db("aidb");
  dbo = await dbo.collection("danh_sach_driveapi");
  let drive;
      index = Number(select.index);
       query = { index: index};
     select = await dbo.find(query).toArray();
      select = JSON.parse(JSON.stringify(select[0]));
      access_token = select.access_token; 
      let oAuth2Client = new google.auth.OAuth2();
      oAuth2Client.setCredentials({
        access_token:access_token,
        scope: 'https://www.googleapis.com/auth/drive',
      });
      drive = google.drive({version: 'v3', auth:oAuth2Client});
    
var dest = fs.createWriteStream( nameFolder + '/' + nameId);

    drive.files.get({fileId: fileId, alt: 'media'}, {responseType: 'stream'},
    function(err, res){
        res.data.on('end', async () => {
            dbo = await db.db("aidb");
            dbo = await dbo.collection("danh_sach_drivetemp");
            dbo.updateOne(
                {name: nameId},
                {$set: { direct: String(nameFolder + '/' + nameId) ,  thoi_gian: getCurrentTime()}},
                { upsert: true }
              )
        })
        .on('error', err => {
            console.log('Error', err);
        })
        .pipe(response);


        res.data.on('end', () => {
        })
        .on('error', err => {
            console.log('Error', err);
        })
        .pipe(dest);
    }
);

  }
});
 
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })



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