import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const POLLING_INTERVAL = 10000;

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

async function getLastestTrack(userId) {
  const foundTracks = await prisma.playbackData.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return foundTracks.at(0);
}

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
    console.error(`User ${id}: ` + e.message);
  }

  if (playbackState) {
    const { item, is_playing, progress_ms } = playbackState;

    if (item && item.type === "track") {
      const latestTrack = await getLastestTrack(id);
      const latestTrackData = latestTrack && JSON.parse(latestTrack.data);

      // TODO: evaluate if this makes sense, or if we should just save
      // duplicate data to not complicate the logic and have to parse the
      // data again
      const isSameTrackStillPlayingContinuously =
        is_playing &&
        latestTrack &&
        latestTrack.trackId === item.id &&
        latestTrackData.progress_ms < progress_ms;

      if (!isSameTrackStillPlayingContinuously) {
        await prisma.playbackData.create({
          data: {
            userId: id,
            trackId: item.id,
            data: JSON.stringify(playbackState),
          },
        });
      } else {
        console.log(
          `User ${id}: Same track ${item.id} is still playing, skipping update...`
        );
      }
    }
  }
}

async function savePlaybackDataForAllActiveUsers() {
  const activeUsers = await prisma.user.findMany({
    where: { active: true },
  });

  await Promise.all(activeUsers.map(saveUserPlaybackState));
}

setInterval(savePlaybackDataForAllActiveUsers, POLLING_INTERVAL);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Spotify playback poller listening on port ${port}!`);
});
