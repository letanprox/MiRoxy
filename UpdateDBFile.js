const http = require("http");
const path = require("path");
const fs = require("fs");

const {google} = require('googleapis');
const readline = require('readline');

var MongoClient = require('mongodb').MongoClient;
var urli = "mongodb://localhost:27017/";

MongoClient.connect(urli , { useUnifiedTopology: true } ,async function(err, db) {
  if (err) throw err;
  var dbo = await db.db("aidb");
  var dbo = await dbo.collection("danh_sach_driveapi");

        var rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });
        rl.question('Nhap: ', async (code) => {
          rl.close();

          index = Number(code);
          let query = { index: Number(code)};
          let select = await dbo.find(query).toArray();
          select = JSON.parse(JSON.stringify(select[0]));
          access_token = select.access_token; 

          let oAuth2Client = new google.auth.OAuth2();
          oAuth2Client.setCredentials({
            access_token:access_token,
            scope: 'https://www.googleapis.com/auth/drive',
          });

          const drive = google.drive({version: 'v3', auth:oAuth2Client});
          let pageToken = '';

          dbo = await db.db("aidb");
          dbo = await dbo.collection("danh_sach_drivelist");
          var myquery = { index: index};
          await dbo.deleteMany(myquery);

          function loadDrive(){
          drive.files.list({
          pageSize: 100,
          fields: 'nextPageToken, files(*)',
          pageToken: pageToken
          }, async (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const files = res.data.files;
            if(String(res.data.nextPageToken) === "undefined") pageToken = 'het';
            else {
              pageToken = res.data.nextPageToken;
              loadDrive();
            }
            if (files.length) {
              console.log('Files:' + files.length);
              for(let i = 0; i < files.length; i++){
                if(String(files[i].name).includes(".ts")){
                  console.log(files[i].name , files[i].mimeType )
                  await dbo.updateOne(
                    {name: String(files[i].name)},
                    {$set: { id: String(files[i].id) , index:index}},
                    { upsert: true }
                  )
                }
              }
            } else {
              console.log('No files found.');
            }
          });
        }

        loadDrive();
        });
});


