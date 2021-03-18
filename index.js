const http = require("http");
const fs = require("fs");
const {google} = require('googleapis');

var MongoClient = require('mongodb').MongoClient;
var urli = "mongodb://localhost:27017/";
var URL = require('url').URL;

let keysetdomain = "chuaconguoiyeu";

http.createServer(function (req, response) {
MongoClient.connect(urli , { useUnifiedTopology: true } ,async function(err, db) {
  if (err) throw err;

  let dbo = await db.db("aidb");
  dbo = await dbo.collection("danh_sach_drivetemp");

  let firstrl = String(String(req.url).replace('/', '').replace(' ','')).split('/');

  let nameFile = String(firstrl[0]);
  let keytemp = String(firstrl[1]);

  if(keytemp === keysetdomain){
  
  let listnum = nameFile.split("_");
  let nameFolder = nameFile.replace(String(String(listnum[listnum.length - 1])), '') ;

  if (!fs.existsSync(nameFolder)){
    fs.mkdirSync(nameFolder);
  }

  let query = { name:nameFile};
  let select = await dbo.find(query).toArray();

  if(select.length > 0){

    console.log(nameFile," + get");
    // let readStream = fs.createReadStream(String(select[0].direct));
    // readStream.on('open', function () {
    //     readStream.pipe(response);
    // });
    // readStream.on('error', function(err) {
    //     res.end(err);
    // });

    fs.readFile(String(select[0].direct), (err, content) => {
      if (err) {

      }else{
        response.writeHead(200, {"Access-Control-Allow-Origin": "*", 'Content-Type': 'video/mp2t'});
        res.end(content, "utf8");
      }
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
    

      // response.setHeader('Content-Type', 'application/json')
      // response.setHeader("Access-Control-Allow-Origin", "*")

  let chunck;

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

            response.writeHead(200, {"Access-Control-Allow-Origin": "*", 'Content-Type': 'video/mp2t'});
            response.end(chunck,'utf8')
        })
        .on('data', data => {
            chunck = chunck + data;
        })
        on('error', err => {
          console.log('Error', err);
        }).pipe(dest);
    }
);

  }
  }else{
    response.write('Hello World!'); //write a response to the client
    response.end();
  }
});

}).listen(80);




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