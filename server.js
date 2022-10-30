const express = require("express");
const cors = require("cors");
const Redis = require("redis");
const axios = require("axios");

const redisClient = Redis.createClient();
redisClient.connect();

redisClient.on('connect', () => {
    console.log("redis connected!")
});
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get('/photos', async (req, res) => {
    const albumId = req.query.albumId;
    const photos = await getOrSetCache(`photos?albumId=${albumId}`, async () => {
        const { data } = await axios.get(
            `https://jsonplaceholder.typicode.com/photos/`,
            { params: { albumId } }
        );
        return data;
    });
    res.json(photos);

    // let getCacheData = await redisClient.get(`photos`);
    // let getCacheData = await redisClient.get(`photos?albumId=${albumId}`);
    // let response = '';
    // if (getCacheData) {
    //     console.log('cache hit');
    //     response = JSON.parse(getCacheData);

    // } else {
    //     console.log('cache miss');
    //     const { data } = await axios.get(
    //         `https://jsonplaceholder.typicode.com/photos/`,
    //         { params: { albumId } }
    //     );
    //     redisClient.setEx(`photos?albumId=${albumId}`, 180, JSON.stringify(data));
    //     response = data;
    // }
    // res.json(response);
})


function getOrSetCache(key, cb) {
    return new Promise(async (resolve, reject) => {
        const result = await redisClient.get(key);
        if (result) {
            resolve(JSON.parse(result));
            console.log("hit")
        } else {
            console.log("miss")
            const freshData = await cb();
            redisClient.setEx(key, 180, JSON.stringify(freshData));
            resolve(freshData);
        }
    });
}


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`app is running on ${PORT}`))

