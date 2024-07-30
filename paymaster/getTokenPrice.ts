import axios from "axios";

export interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
}

export async function getTokenPrice(
  coins: string[] = ["xdefi"]
): Promise<CoinGeckoCoin> {
  const response = await axios.get<CoinGeckoCoin[]>(
    `https://rpc-proxy.xdefi.services/coingecko/api/v3/coins/markets?vs_currency=usd&ids=${coins.join(
      ","
    )}&order=market_cap_desc&per_page=100&page=1&sparkline=false`
  );
  return response.data[0];
}
