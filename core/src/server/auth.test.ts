import express from "express";
import request from "supertest";
import { describe,expect,it } from "vitest";
import { createSessionGuard, sessionCookieHeader, signSessionToken } from "./auth.js";
import { registerRoutes } from "./routes.js";

describe("route authorization",()=>{
  it("refuses to register private routes without a guard",()=>{
    const app=express();
    expect(()=>registerRoutes(app,[{method:"get",path:"/private",access:"private",handler:(_req,res)=>res.json({ok:true})}]))
      .toThrow(/has no auth guard/);
  });

  it("uses a Secure HttpOnly Strict cookie and enforces it server-side",async()=>{
    const secret="test-secret-at-least-long-enough";
    const token=signSessionToken(secret,{sid:"session-12345",exp:Math.floor(Date.now()/1000)+60});
    const header=sessionCookieHeader(token);
    expect(header).toContain("Secure");
    expect(header).toContain("HttpOnly");
    expect(header).toContain("SameSite=Strict");

    const app=express();
    registerRoutes(app,[{method:"get",path:"/private",access:"private",handler:(_req,res)=>res.json({ok:true})}],createSessionGuard(secret));
    expect((await request(app).get("/private")).status).toBe(401);
    expect((await request(app).get("/private").set("Cookie",header)).status).toBe(200);
  });

  it("accepts a previous signing secret during rotation while signing new sessions with the primary",async()=>{
    const previous="previous-secret-at-least-32-bytes-long";
    const current="current-secret-at-least-32-bytes-long--";
    const claims={sid:"session-rotate",exp:Math.floor(Date.now()/1000)+60};
    const previousToken=signSessionToken(previous,claims);
    const currentToken=signSessionToken([current,previous],claims);

    const app=express();
    registerRoutes(
      app,
      [{method:"get",path:"/private",access:"private",handler:(_req,res)=>res.json({ok:true})}],
      createSessionGuard([current,previous]),
    );

    expect((await request(app).get("/private").set("Cookie",sessionCookieHeader(previousToken))).status).toBe(200);
    expect((await request(app).get("/private").set("Cookie",sessionCookieHeader(currentToken))).status).toBe(200);
    expect(currentToken).not.toBe(previousToken);
  });
});
