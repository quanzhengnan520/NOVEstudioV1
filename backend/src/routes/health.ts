import { Router } from "express";
import { ok } from "../lib/apiResponse.js";

export const healthRouter = Router();

healthRouter.get("/", (req, res) => {
  res.json(
    ok(req.requestId, {
      status: "ok",
      service: "nove-backend",
      brand: "NOVE Studio",
    }),
  );
});
