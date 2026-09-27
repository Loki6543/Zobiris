import type { Express, RequestHandler } from "express";
import type { RouteAccess } from "./auth.js";

export type RouteMethod="get"|"post"|"put"|"patch"|"delete";

export interface RouteDefinition {
  method:RouteMethod;
  path:string;
  access:RouteAccess;
  handler:RequestHandler;
}

export function registerRoutes(app:Express,routes:RouteDefinition[],authGuard?:RequestHandler) {
  for(const route of routes) {
    if(route.access!=="public" && !authGuard) {
      throw new Error(`Protected route ${route.method.toUpperCase()} ${route.path} has no auth guard`);
    }
    const handlers=route.access==="public" ? [route.handler] : [authGuard!,route.handler];
    switch(route.method) {
      case "get": app.get(route.path,...handlers); break;
      case "post": app.post(route.path,...handlers); break;
      case "put": app.put(route.path,...handlers); break;
      case "patch": app.patch(route.path,...handlers); break;
      case "delete": app.delete(route.path,...handlers); break;
    }
  }
}
