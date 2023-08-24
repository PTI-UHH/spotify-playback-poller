import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

let sdk;

app.post("/accept-user-token", async (req, res) => {
  let data = req.body;
  sdk = SpotifyApi.withAccessToken("client-id", data);
  const playbackState = await sdk.player.getPlaybackState();
  res.json(playbackState || {});
});

app.listen(3001, () => {
  console.log("Example app listening on port 3001!");
});
