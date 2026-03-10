//---------------------------記録---------------------------
// 2024/11/02
// spresenseからお店の評価をServerで取得。そのデータをFirestoreのlikesに保存
// shop_id=1で固定

const http = require('http');
const querystring = require('querystring');
const { getFirestore } = require('firebase-admin/firestore');
const HOST = '0.0.0.0';
const PORT = 8080;
const admin = require("firebase-admin");

const serviceAccount = require("./firebaseConfig.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
    });

    const db = getFirestore();
    const likeRef = db.collection("likes");

    let postData = null; // ここでpostDataを初期化
    let Gps ={
        lat:null,
        lng:null
    }
    let lastGps ={
        lat:null,
        lng:null
    }
    // HTTPサーバーの作成
    const server = http.createServer(async function (req, res) {
        // クライアントにデータを送る
        if (req.url === '/' && req.method === 'GET') {
            console.log('GET Response :', postData ? postData['data'] : 'No data');
            res.end(postData ? postData['data'] : 'No data'); // postDataが無い場合もデフォルトのメッセージを表示
        }
        // サーバーがデータを受け取る
        else if (req.url === '/postData' && req.method === 'POST') {
            console.log("Received POST request at /postData");

            let data = '';
            req.on('data', function (chunk) {
                data += chunk;
            });

            req.on('end', async function () {
                postData = querystring.parse(data);
                console.log("now PostData is ", postData.data); // ここで解析されたデータを表示
                try {
                    if (postData.data != null && postData.data != undefined) {
                        await likeRef.add({
                            evaluate: Number(postData.data),
                            shop_id: 1
                        });
                        console.log("Data successfully added to Firestore");
                    }

                    res.end("Data received successfully");
                } catch (error) {
                    console.error("Error adding document: ", error);
                    res.statusCode = 500;
                    res.end("Error adding data");
                }
            });

        }
        // server->店に対してGpsを送る
        else if (req.url === '/getGps' && req.method === 'GET') {
            console.log("Received GET request at /getGps");
            if (Gps.lat != null && Gps.lng != null ) {
                if( Gps.lat!=lastGps.lat &&Gps.lng!=lastGps.lng){
                    lastGps.lat=Gps.lat;
                    lastGps.lng=Gps.lng;
                    console.log(`GPS data: lat = ${Gps.lat}, lng = ${Gps.lng}`)
                    res.end(`${Gps.lat},${Gps.lng}`);
                }
                console.log("this gps is already send :",Gps.lat,Gps.lng);
            } else {
                console.log("No GPS data available");
                res.end("No GPS data available");
            }
        } 

        //web->serverに対してGpsを送る
        else if(req.url === '/postGps' && req.method === 'POST'){
            console.log("Received POST request at /postGps");

            let body = '';
            req.on('data', chunk => {
                body += chunk.toString(); // データを文字列として連結
            });
            req.on('end', () => {
                const data = new URLSearchParams(body); // URLエンコードされたデータを解析
                const gpsData = JSON.parse(data.get('gps')); // 'gps' キーで取得したJSON文字列をオブジェクトに変換
                Gps.lat=gpsData.lat;
                Gps.lng=gpsData.lng;
                console.log(`Received GPS data: lat = ${Gps.lat}, lng = ${Gps.lng}`); // 緯度と経度をログに出力
            });
        }
        else {
            res.statusCode = 404;
            res.end('NotFound');
        }
    });

    server.listen(PORT, HOST, () => {
        console.log(`Server running at http://localhost:${PORT}/`);
});