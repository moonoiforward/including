import { dev } from "./dev";
import { Session } from "./models";
export * from "./lib/including";
export * from "./lib/combining";
export * from "./models/Action";
export * from "./models/Include";
async function main() {
  if (process.env.npm_lifecycle_event != "dev") return;
  Session.setSaveLogs(true);
  dev();
}
main();