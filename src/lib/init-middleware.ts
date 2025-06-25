import type { NextApiRequest, NextApiResponse } from "next";

type MiddlewareFunction = (
  req: NextApiRequest,
  res: NextApiResponse,
  next: (result?: unknown) => void
) => void;

export default function initMiddleware(middleware: MiddlewareFunction) {
  return (req: NextApiRequest, res: NextApiResponse) =>
    new Promise<void>((resolve, reject) => {
      middleware(req, res, (result?: unknown) => {
        if (result instanceof Error) {
          return reject(result);
        }
        return resolve();
      });
    });
}
