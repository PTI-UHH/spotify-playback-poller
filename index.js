import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

let sdk;

app.post("/:userId/auth", async (req, res) => {
  let data = req.body;
  sdk = SpotifyApi.withAccessToken("client-id", data);
  const playbackState = (await sdk.player.getPlaybackState()) || {};
  console.log(
    `Successfully requested playback state for user ${req.params.userId}`
  );
  playbackState.userId = req.params.userId;
  res.json(playbackState);
});

app.listen(3001, () => {
  console.log("Example app listening on port 3001!");
});
