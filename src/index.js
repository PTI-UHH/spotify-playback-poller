import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();
const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

if (process.env.NODE_ENV === "development") {
  // Not required in production, because the frontend is served from the same origin
  app.use(
    cors({
      origin: "http://localhost:3000",
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      credentials: true, // Allow cookies and credentials to be sent with the request (if needed)
    })
  );
}

app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany();

  res.json(users);
});

app.put("/user/:id/active", async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { active: req.body.active },
  });

  res.json(user);
});

app.post("/user/:userId/auth", async (req, res) => {
  const id = req.params.userId;

  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (existingUser) {
    res.status(200).json(existingUser);
  } else {
    const user = await prisma.user.create({
      data: {
        id,
        active: true,
        access_token: req.body.access_token,
        refresh_token: req.body.refresh_token,
      },
    });

    res.status(201).json(user);
  }
});

// app.put('/:userId/update', async (req, res) => {
//   const user_id = req.params.userId
//   const post = await prisma.post.update({
//     where: { user_id },
//     data: { access_token: req.body.access_token},
//   })
//   res.json(post)
// })

// app.post("/:userId/auth", async (req, res) => {
//   console.log("Start1")
//   let data = req.body;

//   let sql = `SELECT *
//            FROM users
//            WHERE user_id  = ?`;

//   const userExists = await new Promise((resolve, reject) =>
//       db.get(sql, [req.params.userId], (err, row) => {
//     if (err) {
//       reject(err.message);
//     }
//     resolve(row);
//   }));

//   if(!userExists){
//    await new Promise((resolve, reject) => db.run("INSERT INTO users (user_id, access_token, refresh_token) VALUES (?, ?, ?)", [req.params.userId, data.access_token, data.refresh_token], (err) => {
//      if(err) {
//        reject(err.message);
//      }
//      resolve();
//    }))
//   }else{
//     await new Promise((resolve, reject) => db.run("UPDATE users SET access_token = ?, refresh_token = ? WHERE user_id = ?", [data.access_token, data.refresh_token, req.params.userId], (err) => {
//       if(err) {
//         reject(err.message);
//       }
//       resolve();
//     }))

//   }
//   console.log("Ok");

//   res.json({message: "ok"});
// });

/*app.post("/:userId/sample", async (req, res) =>{
  const user_id = req.params.userId
  const userData = await prisma.user.findUnique({
    where: {
      user_id: user_id
    },
  })
  //console.log(userData);

  res(userData);
});*/

// app.post("/:userId/sample", async (req, res) =>{

//   let sql = `SELECT *
//            FROM users
//            WHERE user_id  = ?`;

//   const {access_token, refresh_token} = await new Promise((resolve, reject) =>
//       db.get(sql, [req.params.userId], (err, row) => {
//         if (err) {
//           reject(err.message);
//         }
//         resolve(row);
//       }));

//   sdk = SpotifyApi.withAccessToken(process.env.SPOTIFY_CLIENT_ID, {access_token, refresh_token});//{access_token: data.access_token});

//   const playbackState = (await sdk.player.getPlaybackState()) || {};
//   const insertsql = "INSERT INTO playback_data (user_id, data) VALUES (?, ?)";
//   await new Promise((resolve, reject) => db.run(insertsql, [req.params.userId, JSON.stringify(playbackState)], (err) => {
//     if(err) {
//       reject(err.message);
//     }
//     resolve();
//   }))

//   console.log(
//       `Successfully requested playback state for user ${req.params.userId}`
//   );
//   playbackState.userId = req.params.userId;
//   res.json(playbackState);
//   //res.json({access_token, refresh_token});
// });
///////////////////////////
async function sampleUsers() {
  const activeUsers = await prisma.user.findMany({
    where: { active: true },
  });
  console.log(activeUsers);

  activeUsers.map(async (user) => {
    const { access_token, refresh_token, id } = user;
    const sdk = SpotifyApi.withAccessToken(process.env.SPOTIFY_CLIENT_ID, {
      access_token,
      refresh_token,
    });
    let playbackState = {};
    try {
      playbackState = (await sdk.player.getPlaybackState()) || {};
    } catch (e) {
      console.log(e.message);
    }

    await prisma.playbackData.create({
      data: {
        userId: id,
        data: JSON.stringify(playbackState),
      },
    });
  });

  //     let playbackState = {}
  //const {access_token, refresh_token, user_id} = active;
}
//   const usersql = "SELECT * FROM users"
//   const rows = await new Promise((resolve, reject) => db.all(usersql, [], (err, rows) => {
//     if(err) {
//       reject(err.message);
//     }
//     resolve(rows);
//   }))

//   await rows.map(async (row) => {
//     const {access_token, refresh_token, user_id} = row;
//     console.log({access_token, refresh_token});
//     const result = await fetch("https://api.spotify.com/v1/me/player", {
//       method: "GET", headers: { Authorization: `Bearer ${access_token}` }
//     });
//     console.log("ERGEBNIS", result);
//     const sdk = SpotifyApi.withAccessToken(process.env.SPOTIFY_CLIENT_ID, {access_token, refresh_token});
//     let playbackState = {}
//     try{
//      playbackState = (await sdk.player.getPlaybackState()) || {};
//     }catch (e){
//       console.log(e.message);
//     }
//     const insertsql = "INSERT INTO playback_data (user_id, data) VALUES (?, ?)";
//     await new Promise((resolve, reject) => db.run(insertsql, [user_id, JSON.stringify(playbackState)], (err) => {
//       if(err) {
//         reject(err.message);
//       }
//       resolve();
//     }))

//   })

// }

setInterval(sampleUsers, 10000);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Spotify playback poller listening on port ${port}!`);
});
