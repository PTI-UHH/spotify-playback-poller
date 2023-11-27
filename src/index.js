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

app.get("/users", async (_, res) => {
  const users = await prisma.user.findMany({ include: { accessToken: true } });

  res.json(users);
});

app.put("/user/:id/active", async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { active: req.body.active },
    });

    res.json(user);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.put("/user/:userId/auth", async (req, res) => {
  const id = req.params.userId;
  const { email, access_token, refresh_token, scope, expires } = req.body;

  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (existingUser) {
    const user = await updateUser(id, {
      email,
      accessToken: {
        update: {
          access_token,
          refresh_token,
          scope,
          expires: new Date(expires),
        },
      },
    });

    res.status(200).json(user);
  } else {
    try {
      const user = await prisma.user.create({
        data: {
          id,
          active: true,
          email,
          accessToken: {
            create: {
              access_token,
              refresh_token,
              scope,
              expires: new Date(expires),
            },
          },
        },
      });

      res.status(201).json(user);
    } catch (e) {
      res.status(500).send(e.message);
    }
  }
});

async function updateUser(id, data) {
  const updatedUser = await prisma.user.update({
    where: { id },
    data,
  });

  return updatedUser;
}

async function updateAccessToken(access_token, data) {
  const updatedAccessToken = await prisma.accessToken.update({
    where: { access_token },
    data,
  });

  return updatedAccessToken;
}

async function getLastestTrack(userId) {
  const foundTracks = await prisma.playbackData.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return foundTracks.at(0);
}

async function updateRefreshedTokens(accessToken, sdk) {
  const { userId, access_token, refresh_token } = accessToken;

  const spotifyAccessToken = await sdk.getAccessToken();
  const wasAccessTokenRefreshed =
    access_token !== spotifyAccessToken.access_token ||
    refresh_token !== spotifyAccessToken.refresh_token;

  if (wasAccessTokenRefreshed) {
    console.log(`User ${userId}: Access token was refreshed, updating...`);
    const newAccessToken = {
      userId,
      access_token: spotifyAccessToken.access_token,
      refresh_token: spotifyAccessToken.refresh_token,
      scope: spotifyAccessToken.scope,
      expires: new Date(spotifyAccessToken.expires),
    };
    await updateAccessToken(access_token, newAccessToken);
  }
}

async function saveUserPlaybackState(user) {
  const { id, accessToken } = user;
  const sdk = SpotifyApi.withAccessToken(
    process.env.SPOTIFY_CLIENT_ID,
    accessToken
  );

  let playbackState = {};

  try {
    playbackState = await sdk.player.getPlaybackState();
    await updateRefreshedTokens(accessToken, sdk);
  } catch (e) {
    console.error(`User ${id}: ` + e.message);
  }

  if (playbackState) {
    const { item } = playbackState;

    if (item && item.type === "track") {
      await prisma.playbackData.create({
        data: {
          userId: id,
          trackId: item.id,
          data: JSON.stringify(playbackState),
        },
      });
    }
  }
}

async function savePlaybackDataForAllActiveUsers() {
  const activeUsers = await prisma.user.findMany({
    where: { active: true },
    include: { accessToken: true },
  });

  await Promise.all(activeUsers.map(saveUserPlaybackState));
}

setInterval(savePlaybackDataForAllActiveUsers, POLLING_INTERVAL);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Spotify playback poller listening on port ${port}!`);
});
