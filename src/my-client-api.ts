import { Configuration, DefaultApi } from "../generated/my-client";

let basePath;

if (process.env.NEXT_PUBLIC_API_URL) {
  basePath = process.env.NEXT_PUBLIC_API_URL;
} else if (process.env.PORT) {
  basePath = `http://localhost:${process.env.PORT}`;
} else if (process.env.NEXT_PUBLIC_VERCEL_URL) {
  basePath = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
} else {
  throw new Error("No API URL found");
}

console.log("API URL:", { basePath });

export const myClientApi = new DefaultApi(new Configuration({ basePath }));
