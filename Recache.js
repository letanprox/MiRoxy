var MongoClient = require('mongodb').MongoClient;
var urli = "mongodb://localhost:27017/";
const fs = require("fs");

let clocktime = 1;

function clockTime(){
console.log("RunReCache: " + clocktime);
clocktime = clocktime + 1;

MongoClient.connect(urli , { useUnifiedTopology: true } ,async function(err, db) {
    if (err) throw err;

    fs.readdir('./TempFile/', function (err, folder_) {
        if (err) throw err;
        else {
            folder_.map(function (folder__) {
            let Pathx = String('./TempFile/' + folder__);
            fs.readdir(Pathx, function(err, files) {
                if (err) {
                } else {
                    files.map(async function  (namefile) {
                        var dbo = await db.db("aidb");
                        var dbo = await dbo.collection("danh_sach_drivetemp");

                        let select = await dbo.find({name: String(namefile)}).toArray();
                        select = JSON.parse(JSON.stringify(select));
                        
                        if(select.length == 0){
                            console.log(select.length);
                            console.log(namefile+ " removed!");
                            fs.rmdirSync(String('./TempFile/' + folder__ + '/' + namefile), { recursive: true });
                        }
                    });
                }
            });
            });
        }
    });
});
}
clockTime();
