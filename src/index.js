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

async function saveUserPlaybackState(user) {
  const { access_token, refresh_token, id } = user;
  const sdk = SpotifyApi.withAccessToken(process.env.SPOTIFY_CLIENT_ID, {
    access_token,
    refresh_token,
  });

  let playbackState = {};

  try {
    playbackState = await sdk.player.getPlaybackState();
  } catch (e) {
    console.error(e.message);
  }

  if (playbackState) {
    await prisma.playbackData.create({
      data: {
        userId: id,
        data: JSON.stringify(playbackState),
      },
    });
  }
}

async function savePlaybackDataForAllActiveUsers() {
  const activeUsers = await prisma.user.findMany({
    where: { active: true },
  });

  await Promise.all(activeUsers.map(saveUserPlaybackState));
}

setInterval(savePlaybackDataForAllActiveUsers, 10000);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Spotify playback poller listening on port ${port}!`);
});
