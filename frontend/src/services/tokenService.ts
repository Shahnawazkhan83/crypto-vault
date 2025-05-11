import api from "./api";
import type { Token } from "../types/token.types";

const TokenService = {
  // Get the list of supported tokens
  async getTokenList(): Promise<Token[]> {
    const response = await api.get("/token");
    return response.data;
  },
};

export default TokenService;
