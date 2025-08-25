import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGO_URL;
  if (!uri) {
    console.error("MONGO_URL is missing in environment");
    process.exit(1);
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { autoIndex: true });
  console.log("MongoDB connected");
}
