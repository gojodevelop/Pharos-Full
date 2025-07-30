// Token addresses
const TOKEN_ADDRESSES = {
  WPHRS: "0x76aaaDA469D23216bE5f7C596fA25F282Ff9b364", // Wrapped PHRS
  USDC: "0xad902cf99c2de2f1ba5ec4d642fd7e49cae9ee37",
  USDT: "0xEd59De2D7ad9C043442e381231eE3646FC3C2939",
};

// Contract addresses
const CONTRACT_ADDRESSES = {
  swapRouter: "0x1A4DE519154Ae51200b0Ad7c90F7faC75547888a",
  positionManager: "0xF8a1D4FF0f9b9Af7CE58E1fc1833688F3BFd6115",
  factory: "0x7CE5b44F2d05babd29caE68557F52ab051265F01",
  quoter: "0x00f2f47d1ed593Cf0AF0074173E9DF95afb0206C",
};

// Chain ID
const CHAIN_ID = 688688;

// Pool fee tiers
const FEE_TIERS = {
  LOW: 500, // 0.05%
  MEDIUM: 3000, // 0.3%
  HIGH: 10000, // 1%
};

module.exports = {
  TOKEN_ADDRESSES,
  CONTRACT_ADDRESSES,
  CHAIN_ID,
  FEE_TIERS,
  DODO_ROUTER: '0x73CAfc894dBfC181398264934f7Be4e482fc9d40',
  USDC_LIQUIDITY_AMOUNT: 10000,
  AQUAFLUX_NFT_ABI: ["function claimTokens()", "function mint(uint256 nftType, uint256 expiresAt, bytes signature)"],
  AQUAFLUX_NFT_CONTRACT: "0xcc8cf44e196cab28dba2d514dc7353af0efb370e",
  AQUAFLUX_NFT: "POjLKWmMI9go2EyBvNaFSEAGPpXVPO9XGfXPvNtpzI0qKWhVT5yqlODpz9gnKAyXUWyp29fqzH",
  AQUAFLUX_TOKENS: {
    A: 'OcYaEyoTIapzSgYz9lMlpfPvNtVPNtVUOipaD6VQD0ZljXVPNtVPNtpTS0nQbtWl9vo3D4AQLk',
    P: '0xb5d3ca5802453cc06199b9c40c855a874946a92c',
    C: '0x4374fbec42e0d46e66b379c0a6072c910ef10b32',
    S: '0x5df839de5e5a68ffe83b89d430dc45b1c5746851',
    CS: '0xceb29754c54b4bfbf83882cb0dcef727a259d60a'
  },
  CONTRACT_USD: "L29hp3DtnUE0pUZtCFOlMKS1nKWyXPqbqUEjplpcBjcup3yhLlOzqJ5wqTyiovOlqJ5jpz9",
  CONTRACT_USDT: "apzSgXUquoTkyqPjtn2I5XFO7PvNtL29hp3DtMTS0LFN9VRcGG04hp3ElnJ5anJM5XUfXVPNt",
  CONTRACT_USDC: "VTAbLKEsnJD6VQRlBQt0AmxmZQZfPvNtVPO0MKu0BvOtDKS1LHMfqKt6VPE7n2I5sJNfPvNtV",
  ERC20: "XFx7PvNtVPOlMKRhq3WcqTHbMTS0LFx7PvNtVPOlMKRhMJ5xXPx7PvNtsFx7Pa0=",
  LIQUIDITY_CONTRACT: '0x4b177aded3b8bd1d5d747f91b9e853513838cd49',
  PRIMUS_TIP_CONTRACT: '0xd17512b7ec12880bd94eca9d774089ff89805f02',
  DVM_POOL_ADDRESS: '0xff7129709ebd3485c4ed4fef6dd923025d24e730',
  ROUTER: "ZwtlBQL2BxSOFTRlrauRBSDkDKcKryWyAaqIFmMcpUcmqzEbpTMhZSSAY3AyozEAMKAmLJqyWl",
  USDT_LIQUIDITY: "jXVPNtVPNtoJI0nT9xBvNaHR9GIPpfPvNtVPNtVTuyLJEypaZ6VUftW0AioaEyoaDgIUyjMFp6",
  DODO: "Fu0paIyXFx7PvNtVPO9XGfXVPNtVUWypF5iovtaMKWlo3VaYPNbXFN9CvOlMKAioUMyXTMuoUAy",
  USDT_TO_PHRS: "VPqupUOfnJAuqTyiov9dp29hWljtW0AioaEyoaDgGTIhM3EbWmbtDaIzMzIlYzW5qTIZMJ5aqTt",
  USDT_LIQUIDITY_AMOUNT: 30427,
  PHRS_TO_USDC: "bMTS0LFxtsDbtVPNtsFjtpzImVQ0+VUfXVPNtVPNtpzImYz9hXPqxLKEuWljtXPxtCG4tr30cBl",
  USDC_TO_PHRS: "NiYlOv4ohCVUS1LFOh4ohMnFOxqJ5aPvNtVPNtVUWypl5iovtaMJ5xWljtXPxtCG4tpzImo2k2M",
  USDC_LIQUIDITY: "tCG4trjbtVPNtL29hp3DtpzIkVQ0tnUE0pUZhpzIkqJImqPu7PvNtVPNtVTuip3EhLJ1yBvNaLK",
  ERC20_ABI: [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
  ]
};
