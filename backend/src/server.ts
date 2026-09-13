import { app } from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log(`9Drive backend listening on http://localhost:${env.port}`);
});
