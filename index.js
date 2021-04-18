const http = require("http");
const fs = require("fs");
const {google} = require('googleapis');

var MongoClient = require('mongodb').MongoClient;
var urli = "mongodb://localhost:27017/";
let keysetdomain = "chuaconguoiyeu";

let Iplist = {};
let countreq = 0;

const parseIp = (req) =>
    (typeof req.headers['x-forwarded-for'] === 'string'
        && req.headers['x-forwarded-for'].split(',').shift())
    || req.connection?.remoteAddress
    || req.socket?.remoteAddress
    || req.connection?.socket?.remoteAddress

MongoClient.connect(urli , { useUnifiedTopology: true } ,async function(err, db) {
http.createServer(async function (req, response) {
  if (err) throw err;
  let date_ob = new Date();
  let allowip = false;
  countreq = countreq + 1;
  if(countreq == 50){
    countreq = 0;
    Iplist = {}
  } 
  let ipree = String(parseIp(req));
  if(Iplist.hasOwnProperty(ipree) ){
    if( Number(Iplist[ipree]) < Number(date_ob.getSeconds()) ){
      console.log( Number(Iplist[ipree]) , "sss" ,Number(date_ob.getSeconds())
      allowip = true;
      Iplist[ipree] = Number(Iplist[ipree]) + 0.1;
    }else{
      allowip = false;
      console.log("chan ip " + ipree)
    }
  }else{
    Iplist[ipree] = Number(date_ob.getSeconds());
  }

if(allowip === true){

  let firstrl = String(String(req.url).replace('/', '').replace(' ','')).split('/');
  let keytemp = String(firstrl[1]);
  let nameFile = String(firstrl[0]);
  let ishavefile = 0;
  let ischose = 0;

if(keytemp === keysetdomain){

  let listnum = nameFile.split("_");
  let nameFolder = 'TempFile/' + nameFile.replace(String(listnum[listnum.length - 1]), '');
  if (!fs.existsSync(nameFolder)){
    fs.mkdirSync(nameFolder);
    ishavefile = 0;
  }else{
    if (!fs.existsSync(nameFolder + '/' + nameFile)) ishavefile = 0;
    else ishavefile = 1;
  }

  let dbo = await db.db("aidb");
  dbo = await dbo.collection("danh_sach_drivetemp");
  let query = {name:nameFile};
  let select = await dbo.find(query).toArray();

  let statsfile = 1;
  let dest;
  let drive;

  if((select.length > 0 && ishavefile == 0) || (select.length == 0 && ishavefile == 1)){
    if(ishavefile == 1){
      console.log("exist file nosql")
      fs.unlinkSync(nameFolder + '/' + nameFile);
    } 
    dbo.deleteOne({name: nameFile});
    ischose = 0;
    console.log("error file");
  }else{
    if(select.length > 0) ischose = 1;
    else ischose = 0;
  }

  if(ischose > 0){
    console.log(nameFile," + get");
    
    response.writeHead( 200, { 
      'Content-Type': 'multipart/form-data' ,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Expose-Headers': '*',
    } );
    fs.createReadStream(String(select[0].direct)).pipe(response);
    dbo.updateOne(
        {name: String(select[0].name)},
        {$set: {thoi_gian: getCurrentTime()}},
        {upsert: true}
    )
    ///Next Load
    let nameId =  String(select[0].name);
    let listemId  = nameId.split('_');
    let nextId = String(listemId[listemId.length - 1]).replace('.ts','');
    nextId = Number(nextId) + 1;
    nameId = nameId.replace(String(listemId[listemId.length - 1]),String(nextId)+'.ts')
    query = {name:nameId};
    select = await dbo.find(query).toArray();
    if(select.length > 0){}else{
      if (fs.existsSync(nameFolder + '/' + nameId)){
        statsfile = fs.statSync(nameFolder + '/' + nameId);
        if(Number(statsfile.size) < 3){
          dest = fs.createWriteStream( nameFolder + '/' + nameId);
          statsfile = 0;
        };
      }else{
        dest = fs.createWriteStream( nameFolder + '/' + nameId);
        statsfile = 0;
      }

      if(statsfile == 0){
        console.log(nameFile," + getnextfile");
        dbo = await db.db("aidb");
        dbo = await dbo.collection("danh_sach_drivelist");
          query = { name:nameId};
          select = await dbo.find(query).toArray();
          select = JSON.parse(JSON.stringify(select[0]));
          fileId = String(select.id);
          nameId = String(select.name);

        dbo = await db.db("aidb");
        dbo = await dbo.collection("danh_sach_driveapi");
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
        drive.files.get({fileId: fileId, alt: 'media'}, {responseType: 'stream'},
        function(err, res){
          res.data
          .on('end', async () => {
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
          .pipe(dest);
        });
      }
    }

  }else{
    console.log(nameFile," + create");

    dbo = await db.db("aidb");
    dbo = await dbo.collection("danh_sach_drivelist");
      let query = { name:nameFile};
      let select = await dbo.find(query).toArray();
      select = JSON.parse(JSON.stringify(select[0]));
      let fileId = String(select.id);
      let nameId = String(select.name);

    dbo = await db.db("aidb");
    dbo = await dbo.collection("danh_sach_driveapi");
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

    if (fs.existsSync(nameFolder + '/' + nameId)){
      statsfile = fs.statSync(nameFolder + '/' + nameId);
      if(Number(statsfile.size) < 3){
        dest = fs.createWriteStream( nameFolder + '/' + nameId);
        statsfile = 0;
      };
    }else{
      dest = fs.createWriteStream( nameFolder + '/' + nameId);
      statsfile = 0;
    }
    drive = google.drive({version: 'v3', auth:oAuth2Client});
    drive.files.get({fileId: fileId, alt: 'media'}, {responseType: 'stream'},
    function(err, res){
        res.data
        .on('end', async () => {
            dbo = await db.db("aidb");
            dbo = await dbo.collection("danh_sach_drivetemp");
            dbo.updateOne(
                {name: nameId},
                {$set: { direct: String(nameFolder + '/' + nameId) ,  thoi_gian: getCurrentTime()}},
                { upsert: true }
            )
            ///Next Load
            let listemId  = nameId.split('_');
            let nextId = String(listemId[listemId.length - 1]).replace('.ts','');
            nextId = Number(nextId) + 1;
            nameId = nameId.replace(String(listemId[listemId.length - 1]),String(nextId)+'.ts')
            query = {name:nameId};
            select = await dbo.find(query).toArray();

            if(select.length > 0){}else{
              if (fs.existsSync(nameFolder + '/' + nameId)){
                statsfile = fs.statSync(nameFolder + '/' + nameId);
                if(Number(statsfile.size) < 3){
                  dest = fs.createWriteStream( nameFolder + '/' + nameId);
                  statsfile = 0;
                };
              }else{
                dest = fs.createWriteStream( nameFolder + '/' + nameId);
                statsfile = 0;
              }
              if(statsfile === 0){
              console.log(nameFile," + getnextfile");
                dbo = await db.db("aidb");
                dbo = await dbo.collection("danh_sach_drivelist");
                  query = { name:nameId};
                  select = await dbo.find(query).toArray();
                  select = JSON.parse(JSON.stringify(select[0]));
                  fileId = String(select.id);
                  nameId = String(select.name);   
                  dest = fs.createWriteStream( nameFolder + '/' + nameId);
                  drive.files.get({fileId: fileId, alt: 'media'}, {responseType: 'stream'},
                  function(err, res){
                    res.data
                    .on('end', async () => {
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
                    .pipe(dest);
                  });
              }
            }
        })
        .on('error', err => {
            console.log('Error', err);
        })
        .on('response', () => {
          response.header('content-type', 'multipart/form-data');
          response.header('Access-Control-Allow-Origin', '*');
          response.header('Access-Control-Allow-Credentials', 'true');
          response.header('Access-Control-Allow-Headers', '*');
          response.header('Access-Control-Expose-Headers', '*');
        })
        .pipe(response);

        if(statsfile == 0){
          console.log(nameFile," + getpushfile");
          res.data.pipe(dest);
        } 
    }
  );
  }

}else{
  response.write('can key deload'); //write a response to the client
  response.end();
}
}else{
  response.write('to many request'); //write a response to the client
  response.end();
}
}).listen(80);
});


let getCurrentTime = ()=>{
    var today = new Date();
    var date = today.getFullYear()+'/'+(today.getMonth()+1)+'/'+today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    return date+' '+time;
}