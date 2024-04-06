// This file is used to deploy a staging version of the app to Vercel.
import type { NextApiRequest, NextApiResponse } from "next";
import { bootstrap } from "@/../dist/app";

export const dynamic = "force-dynamic";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { app } = await bootstrap();
  const handler = (await app.init()).getHttpAdapter().getInstance();
  handler(req, res);
}
