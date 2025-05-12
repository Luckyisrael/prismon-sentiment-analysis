import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { createPrismonClient } from "../../../../PrismonSDK/src/index";



export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const client = createPrismonClient({
  apiKey: "prismon_17d6102e_app88ab15b9", //prismon_15f29757_appfb1c1586 -- local server && live server -- prismon_17d6102e_app88ab15b9
  //baseUrl: "http://localhost:5122", 
  appId: "77ec7ed8-163f-49f8-a0ba-7e8693eb728f", //localhost app id: 46d6ed9d-ee35-4664-b020-a555b1c9f495 ---- live app id - 77ec7ed8-163f-49f8-a0ba-7e8693eb728f
  solanaRpcUrl: "https://api.devnet.solana.com",
  enableLogging: true,
});
