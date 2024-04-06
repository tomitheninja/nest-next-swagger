import { Configuration, DefaultApi } from "../generated/my-client";

export const myClientApi = new DefaultApi(
  new Configuration({
    basePath:
      process.env.NEXT_PUBLIC_API_URL ?? process.env.PORT
        ? `http://localhost:${process.env.PORT}`
        : undefined,
  })
);
