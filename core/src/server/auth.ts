import { createHmac, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import { z } from "zod";

export type RouteAccess = "public" | "private" | "mutating";

const ClaimsSchema=z.object({
  sid:z.string().min(8),
  exp:z.number().int().positive(),
});

export type SessionClaims=z.infer<typeof ClaimsSchema>;

function b64url(input:string) {
  return Buffer.from(input,"utf8").toString("base64url");
}

function hmac(secret:string,payload:string) {
  return createHmac("sha256",secret).update(payload).digest("base64url");
}

export function signSessionToken(secret:string,claims:SessionClaims) {
  const parsed=ClaimsSchema.parse(claims);
  const payload=b64url(JSON.stringify(parsed));
  return `${payload}.${hmac(secret,payload)}`;
}

export function verifySessionToken(secret:string,token:string,nowMs=Date.now()):SessionClaims|null {
  const [payload,signature,...rest]=token.split(".");
  if(!payload||!signature||rest.length) return null;
  const expected=hmac(secret,payload);
  const a=Buffer.from(signature);
  const b=Buffer.from(expected);
  if(a.length!==b.length || !timingSafeEqual(a,b)) return null;
  try {
    const claims=ClaimsSchema.parse(JSON.parse(Buffer.from(payload,"base64url").toString("utf8")));
    if(claims.exp*1000<=nowMs) return null;
    return claims;
  } catch {
    return null;
  }
}

export function sessionCookieHeader(token:string) {
  return `__Host-zobiris-session=${token}; Path=/; Secure; HttpOnly; SameSite=Strict`;
}

function cookieValue(header:string|undefined,name:string):string|null {
  if(!header) return null;
  for(const pair of header.split(";")) {
    const index=pair.indexOf("=");
    if(index<0) continue;
    if(pair.slice(0,index).trim()===name) return pair.slice(index+1).trim();
  }
  return null;
}

export function createSessionGuard(secret:string|undefined):RequestHandler {
  return (req,res,next)=>{
    if(!secret) return res.status(503).json({ok:false,error:"PRIVATE_AUTH_NOT_CONFIGURED"});
    const token=cookieValue(req.headers.cookie,"__Host-zobiris-session");
    if(!token || !verifySessionToken(secret,token)) {
      return res.status(401).json({ok:false,error:"UNAUTHORIZED"});
    }
    res.setHeader("Cache-Control","no-store");
    return next();
  };
}

export const securityHeaders:RequestHandler=(_req,res,next)=>{
  res.setHeader("X-Content-Type-Options","nosniff");
  res.setHeader("Referrer-Policy","no-referrer");
  res.setHeader("X-Frame-Options","DENY");
  res.setHeader("Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
  next();
};
