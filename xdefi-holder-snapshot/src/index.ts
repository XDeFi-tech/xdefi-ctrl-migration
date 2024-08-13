import "dotenv/config";
import { main } from "./main";

main()
  .catch(console.error)
  .then(() => {
    console.log("finished");
    process.exit();
  });
