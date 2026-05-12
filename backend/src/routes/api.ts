import { Router } from "express";
import { ok } from "../lib/apiResponse.js";

export const apiRouter = Router();

apiRouter.get("/v1/ping", (req, res) => {
  res.json(ok(req.requestId, { message: "pong" }));
});
