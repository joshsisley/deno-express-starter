import mongoose from "npm:mongoose@^6.7";
import config from "./config.ts";

const uri:string = config.mongo.uri;

mongoose.Promise = Promise;

export const connect = () => {
  mongoose
    .connect(uri).then(() => {
      console.log("Connected to MongoDB");
    }).catch((err) => {
      console.log("Error connecting to MongoDB", err);
    });
  return mongoose.connection;
};