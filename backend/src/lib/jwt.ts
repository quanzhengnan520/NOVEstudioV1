import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type AccessClaims = {
  sub: string;
  email: string;
  adm: boolean;
  /** Email verified (legacy tokens without claim treated as verified) */
  ev: boolean;
};

export function signAccessToken(claims: AccessClaims): string {
  return jwt.sign(
    { typ: "access", email: claims.email, adm: claims.adm, ev: claims.ev },
    env.jwtAccessSecret,
    { subject: claims.sub, expiresIn: env.accessTokenTtlSec },
  );
}

export function verifyAccessToken(token: string): AccessClaims {
  const decoded = jwt.verify(token, env.jwtAccessSecret) as jwt.JwtPayload & {
    typ?: string;
    email?: string;
    adm?: boolean;
    ev?: boolean;
  };
  if (decoded.typ !== "access" || !decoded.sub || !decoded.email || typeof decoded.adm !== "boolean") {
    throw new Error("Invalid access token payload");
  }
  const ev = typeof decoded.ev === "boolean" ? decoded.ev : true;
  return { sub: decoded.sub, email: decoded.email, adm: decoded.adm, ev };
}
