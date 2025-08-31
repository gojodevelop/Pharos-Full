require('dotenv').config();
const { ethers } = require('ethers');
const axios = require('axios');
const crypto = require('crypto');
const settings = require('../config/config');

const networkConfig = {
  name: 'Pharos Testnet',
  chainId: 688688,
  rpcUrl: 'https://testnet.dplabs-internal.com',
};

const PUBLIC_KEY_PEM = `
-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDWPv2qP8+xLABhn3F/U/hp76HP
e8dD7kvPUh70TC14kfvwlLpCTHhYf2/6qulU1aLWpzCz3PJr69qonyqocx8QlThq
5Hik6H/5fmzHsjFvoPeGN5QRwYsVUH07MbP7MNbJH5M2zD5Z1WEp9AHJklITbS1z
h23cf2WfZ0vwDYzZ8QIDAQAB
-----END PUBLIC KEY-----
`;

const USDC_CONTRACT_ADDRESS = '0x72df0bcd7276f2dFbAc900D1CE63c272C4BCcCED';
const USDT_CONTRACT_ADDRESS = '0xD4071393f8716661958F766DF660033b3d35fD29';
const MUSD_CONTRACT_ADDRESS = '0x7F5e05460F927Ee351005534423917976F92495e';
const mvMUSD_CONTRACT_ADDRESS = '0xF1CF5D79bE4682D50f7A60A047eACa9bD351fF8e';
const STAKING_ROUTER_ADDRESS = '0x11cD3700B310339003641Fdce57c1f9BD21aE015';

const ERC20_CONTRACT_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'address', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'claimFaucet',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
];

const AUTOSTAKING_CONTRACT_ABI = [
  {
    type: 'function',
    name: 'getNextFaucetClaimTime',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
];

const BASE_API = 'https://asia-east2-auto-staking.cloudfunctions.net/auto_staking_pharos_v7';
const PROMPT = `1. Mandatory Requirement: The product's TVL must be higher than one million USD.
2. Balance Preference: Prioritize products that have a good balance of high current APY and high TVL.
3. Portfolio Allocation: Select the 3 products with the best combined ranking in terms of current APY and TVL among those with TVL > 1,000,000 USD. To determine the combined ranking, rank all eligible products by current APY (highest to lowest) and by TVL (highest to lowest), then sum the two ranks for each product. Choose the 3 products with the smallest sum of ranks. Allocate the investment equally among these 3 products, with each receiving approximately 33.3% of the investment.`;

class StakingService {
  constructor({ privateKey, log }) {
    this.provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    this.wallet = privateKey ? new ethers.Wallet(privateKey, this.provider) : null;
    this.authorization = this.generateAuthToken(this.wallet.address);
    this.usedNonce = {};
    this.stakingCount = settings.NUMBER_STAKING || 1;
    this.minDelay = 5;
    this.maxDelay = 10;
    this.log = log;
  }

  generateAuthToken(address) {
    try {
      const publicKey = crypto.createPublicKey(PUBLIC_KEY_PEM);
      const ciphertext = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256",
        },
        Buffer.from(address)
      );
      return ciphertext.toString("base64");
    } catch (error) {
      console.log(`Lỗi tạo auth token: ${error.message}`.red);
      return null;
    }
  }

  getAxiosConfig(headers = {}) {
    const config = {
      headers,
      timeout: 60000,
    };
    return config;
  }

  generateRecommendationPayload(usdcAmount, usdtAmount, musdAmount) {
    try {
      const usdcAssets = ethers.parseUnits(usdcAmount.toString(), 6);
      const usdtAssets = ethers.parseUnits(usdtAmount.toString(), 6);
      const musdAssets = ethers.parseUnits(musdAmount.toString(), 6);
      return {
        user: this.wallet.address,
        profile: PROMPT,
        userPositions: [],
        userAssets: [
          {
            chain: { id: 688688 },
            name: 'USDC',
            symbol: 'USDC',
            decimals: 6,
            address: USDC_CONTRACT_ADDRESS,
            assets: usdcAssets.toString(),
            price: 1,
            assetsUsd: usdcAmount,
          },
          {
            chain: { id: 688688 },
            name: 'USDT',
            symbol: 'USDT',
            decimals: 6,
            address: USDT_CONTRACT_ADDRESS,
            assets: usdtAssets.toString(),
            price: 1,
            assetsUsd: usdtAmount,
          },
          {
            chain: { id: 688688 },
            name: 'MockUSD',
            symbol: 'MockUSD',
            decimals: 6,
            address: MUSD_CONTRACT_ADDRESS,
            assets: musdAssets.toString(),
            price: 1,
            assetsUsd: musdAmount,
          },
        ],
        chainIds: [688688],
        tokens: ['USDC', 'USDT', 'MockUSD'],
        protocols: ['MockVault'],
        env: 'pharos',
      };
    } catch (e) {
      throw new Error(`Tạo payload khuyến nghị thất bại: ${e.message}`);
    }
  }

  generateTransactionsPayload(changeTx) {
    try {
      return {
        user: this.wallet.address,
        changes: changeTx,
        prevTransactionResults: {},
      };
    } catch (e) {
      throw new Error(`Tạo payload giao dịch thất bại: ${e.message}`);
    }
  }

  async getTokenBalance(contractAddress) {
    try {
      const tokenContract = new ethers.Contract(contractAddress, ERC20_CONTRACT_ABI, this.provider);
      const balance = await tokenContract.balanceOf(this.wallet.address);
      const decimals = await tokenContract.decimals();
      return ethers.formatUnits(balance, decimals);
    } catch (e) {
      await this.log(`Lỗi khi lấy số dư token ${contractAddress}: ${e.message}`, 'error');
      return null;
    }
  }

  async getNextFaucetClaimTime() {
    try {
      const contract = new ethers.Contract(mvMUSD_CONTRACT_ADDRESS, AUTOSTAKING_CONTRACT_ABI, this.provider);
      const nextClaimTime = await contract.getNextFaucetClaimTime(this.wallet.address);
      return Number(nextClaimTime);
    } catch (e) {
      await this.log(`Lỗi khi lấy thời gian claim faucet tiếp theo: ${e.message}`, 'error');
      return null;
    }
  }

  async sendRawTransactionWithRetries(tx, retries = 5) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const txResponse = await this.wallet.sendTransaction(tx);
        return txResponse.hash;
      } catch (e) {
        if (e.code === 'NONCE_EXPIRED' || e.code === 'REPLACEMENT_UNDERPRICED') {
          this.usedNonce[this.wallet.address] = await this.provider.getTransactionCount(this.wallet.address, 'pending');
          tx.nonce = ethers.toBigInt(this.usedNonce[this.wallet.address]);
          await this.log(`[Thử ${attempt + 1}] Lỗi gửi giao dịch, cập nhật nonce: ${e.message}`, 'warning');
          continue;
        }
        await this.log(`[Thử ${attempt + 1}] Lỗi gửi giao dịch: ${e.message}`, 'warning');
        await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 1000));
      }
    }
    throw new Error('Không thể gửi giao dịch sau số lần thử tối đa');
  }

  async waitForReceiptWithRetries(txHash, retries = 5) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const receipt = await this.provider.waitForTransaction(txHash, 1, 300000);
        return receipt;
      } catch (e) {
        if (e.code === 'TRANSACTION_NOT_FOUND') continue;
        await this.log(`[Thử ${attempt + 1}] Lỗi chờ biên nhận: ${e.message}`, 'warning');
        await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 1000));
      }
    }
    throw new Error('Không tìm thấy biên nhận giao dịch sau số lần thử tối đa');
  }

  async performClaimFaucet() {
    try {
      const contract = new ethers.Contract(mvMUSD_CONTRACT_ADDRESS, ERC20_CONTRACT_ABI, this.wallet);
      const claimData = contract.interface.encodeFunctionData('claimFaucet');
      let estimatedGas;
      try {
        estimatedGas = await contract.claimFaucet.estimateGas({ from: this.wallet.address });
      } catch (e) {
        await this.log(`Lỗi khi ước tính gas: ${e.message}${e.reason ? `, Reason: ${e.reason}` : ''}`, 'error');
        return [null, null];
      }

      const tx = {
        to: mvMUSD_CONTRACT_ADDRESS,
        data: claimData,
        gasLimit: ethers.toBigInt(Math.floor(Number(estimatedGas) * 1.2)),
        maxFeePerGas: ethers.parseUnits('1', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('1', 'gwei'),
        nonce: ethers.toBigInt(this.usedNonce[this.wallet.address]),
        chainId: ethers.toBigInt(networkConfig.chainId),
      };

      const txHash = await this.sendRawTransactionWithRetries(tx);
      const receipt = await this.waitForReceiptWithRetries(txHash);
      this.usedNonce[this.wallet.address] += 1;

      await this.log(`Claim faucet thành công`, 'success');
      await this.log(`Tx Hash: ${txHash}`, 'action');
      return [txHash, receipt.blockNumber];
    } catch (e) {
      await this.log(`Claim faucet thất bại: ${e.message}${e.reason ? `, Reason: ${e.reason}` : ''}`, 'error');
      return [null, null];
    }
  }

  async approveToken(assetAddress, amount) {
    try {
      const tokenContract = new ethers.Contract(assetAddress, ERC20_CONTRACT_ABI, this.wallet);
      const decimals = await tokenContract.decimals();
      const amountInWei = ethers.parseUnits(amount.toString(), decimals);
      const allowance = await tokenContract.allowance(this.wallet.address, STAKING_ROUTER_ADDRESS);

      if (allowance < amountInWei) {
        const approveData = tokenContract.interface.encodeFunctionData('approve', [STAKING_ROUTER_ADDRESS, ethers.MaxUint256]);
        let estimatedGas;
        try {
          estimatedGas = await tokenContract.approve.estimateGas(STAKING_ROUTER_ADDRESS, ethers.MaxUint256, { from: this.wallet.address });
        } catch (e) {
          await this.log(`Lỗi khi ước tính gas cho phê duyệt: ${e.message}${e.reason ? `, Reason: ${e.reason}` : ''}`, 'error');
          throw e;
        }

        const approveTx = {
          to: assetAddress,
          data: approveData,
          gasLimit: ethers.toBigInt(Math.floor(Number(estimatedGas) * 1.2)),
          maxFeePerGas: ethers.parseUnits('1', 'gwei'),
          maxPriorityFeePerGas: ethers.parseUnits('1', 'gwei'),
          nonce: ethers.toBigInt(this.usedNonce[this.wallet.address]),
          chainId: ethers.toBigInt(networkConfig.chainId),
        };

        const txHash = await this.sendRawTransactionWithRetries(approveTx);
        const receipt = await this.waitForReceiptWithRetries(txHash);
        this.usedNonce[this.wallet.address] += 1;

        await this.log(`Phê duyệt token ${assetAddress} thành công`, 'success');
        await this.log(`Tx Hash: ${txHash}`, 'action');
      }
      return true;
    } catch (e) {
      throw new Error(`Phê duyệt token thất bại: ${e.message}`);
    }
  }

  async performStaking(changeTx, usdcAmount, usdtAmount, musdAmount) {
    try {
      await this.approveToken(USDC_CONTRACT_ADDRESS, usdcAmount);
      await this.approveToken(USDT_CONTRACT_ADDRESS, usdtAmount);
      await this.approveToken(MUSD_CONTRACT_ADDRESS, musdAmount);

      const transactions = await this.generateChangeTransactions(changeTx);
      if (!transactions || !transactions.data || !transactions.data['688688'] || !transactions.data['688688'].data) {
        throw new Error('Tạo calldata giao dịch thất bại');
      }

      const calldata = transactions.data['688688'].data;
      let estimatedGas;
      try {
        estimatedGas = await this.provider.estimateGas({
          from: this.wallet.address,
          to: STAKING_ROUTER_ADDRESS,
          data: calldata,
        });
      } catch (e) {
        await this.log(`Lỗi khi ước tính gas cho staking: ${e.message}${e.reason ? `, Reason: ${e.reason}` : ''}`, 'error');
        throw e;
      }

      const tx = {
        to: STAKING_ROUTER_ADDRESS,
        data: calldata,
        gasLimit: ethers.toBigInt(Math.floor(Number(estimatedGas) * 1.2)),
        maxFeePerGas: ethers.parseUnits('1', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('1', 'gwei'),
        nonce: ethers.toBigInt(this.usedNonce[this.wallet.address]),
        chainId: ethers.toBigInt(networkConfig.chainId),
      };

      const txHash = await this.sendRawTransactionWithRetries(tx);
      const receipt = await this.waitForReceiptWithRetries(txHash);
      this.usedNonce[this.wallet.address] += 1;

      await this.log(`Staking thành công`, 'success');
      await this.log(`Tx Hash: ${txHash}`, 'action');
      return [txHash, receipt.blockNumber];
    } catch (e) {
      await this.log(`Staking thất bại: ${e.message}${e.reason ? `, Reason: ${e.reason}` : ''}`, 'error');
      return [null, null];
    }
  }

  async financialPortfolioRecommendation(usdcAmount, usdtAmount, musdAmount, retries = 50) {
    const url = `${BASE_API}/investment/financial-portfolio-recommendation`;
    const data = this.generateRecommendationPayload(usdcAmount, usdtAmount, musdAmount);
    const headers = {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      Origin: 'https://autostaking.pro',
      Referer: 'https://autostaking.pro/',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      Authorization: this.authorization,
      'Content-Type': 'application/json',
      'Content-Length': JSON.stringify(data).length,
    };

    await new Promise((resolve) => setTimeout(resolve, 3000));
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const config = this.getAxiosConfig(headers);
        const response = await axios.post(url, data, config);
        if (response.data && response.data.data) {
          return response.data;
        }
        throw new Error('Không nhận được dữ liệu khuyến nghị');
      } catch (e) {
        if (attempt < retries - 1) {
          await this.log(`[Thử ${attempt + 1}] AI chưa rep bây ơi bây: ${e.message}`, 'warning');
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        }
        await this.log(`Đã thất bại sau ${retries} lần thử: ${e.message}`, 'error');
        return null;
      }
    }
    return null;
  }

  async generateChangeTransactions(changeTx, retries = 5) {
    const url = `${BASE_API}/investment/generate-change-transactions`;
    const data = this.generateTransactionsPayload(changeTx);
    const headers = {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      Origin: 'https://autostaking.pro',
      Referer: 'https://autostaking.pro/',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      Authorization: this.authorization,
      'Content-Type': 'application/json',
      'Content-Length': JSON.stringify(data).length,
    };

    await new Promise((resolve) => setTimeout(resolve, 3000));
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const config = this.getAxiosConfig(headers);
        const response = await axios.post(url, data, config);
        if (response.data && response.data.data) {
          return response.data;
        }
        throw new Error('Không nhận được dữ liệu giao dịch');
      } catch (e) {
        if (attempt < retries - 1) {
          await this.log(`[Thử ${attempt + 1}] Tạo giao dịch thất bại: ${e.message}`, 'warning');
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        }
        await this.log(`Tạo giao dịch thất bại sau ${retries} lần thử: ${e.message}`, 'error');
        return null;
      }
    }
    return null;
  }

  async processPerformClaimFaucet() {
    const nextClaimTime = await this.getNextFaucetClaimTime();
    if (nextClaimTime !== null) {
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime >= nextClaimTime) {
        const [txHash, blockNumber] = await this.performClaimFaucet();
        if (txHash && blockNumber) {
          return true;
        }
        await this.log('Thực hiện claim faucet thất bại', 'error');
      } else {
        const nextClaimDate = new Date(nextClaimTime * 1000).toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
        await this.log(`Đã claim trước đó. Lần claim tiếp theo: ${nextClaimDate}`, 'warning');
      }
    }
    return false;
  }

  async processPerformStaking() {
    try {
      const usdcBalance = parseFloat(await this.getTokenBalance(USDC_CONTRACT_ADDRESS)) || 0;
      const usdtBalance = parseFloat(await this.getTokenBalance(USDT_CONTRACT_ADDRESS)) || 0;
      const musdBalance = parseFloat(await this.getTokenBalance(MUSD_CONTRACT_ADDRESS)) || 0;

      const usdcAmount = (usdcBalance * 0.01).toFixed(6);
      const usdtAmount = (usdtBalance * 0.01).toFixed(6);
      const musdAmount = (musdBalance * 0.01).toFixed(6);

      if (usdcAmount <= 0) {
        await this.log('Số dư USDC không đủ để stake (0 sau khi tính 1%)', 'warning');
        return false;
      }
      if (usdtAmount <= 0) {
        await this.log('Số dư USDT không đủ để stake (0 sau khi tính 1%)', 'warning');
        return false;
      }
      if (musdAmount <= 0) {
        await this.log('Số dư MockUSD không đủ để stake (0 sau khi tính 1%)', 'warning');
        return false;
      }

      await this.log(`Số lượng token để stake: ${usdcAmount} USDC | ${usdtAmount} USDT | ${musdAmount} MockUSD`, 'info');

      const portfolio = await this.financialPortfolioRecommendation(usdcAmount, usdtAmount, musdAmount);
      if (portfolio && portfolio.data && portfolio.data.changes) {
        const [txHash, blockNumber] = await this.performStaking(portfolio.data.changes, usdcAmount, usdtAmount, musdAmount);
        if (txHash && blockNumber) {
          return true;
        }
        await this.log('Thực hiện staking thất bại', 'error');
      } else {
        await this.log('Lấy khuyến nghị danh mục đầu tư thất bại', 'error');
      }
      return false;
    } catch (e) {
      await this.log(`Lỗi trong processPerformStaking: ${e.message}${e.reason ? `, Reason: ${e.reason}` : ''}`, 'error');
      return false;
    }
  }

  async processAccount() {
    try {
      await this.log(`Đang xử lý ví: ${this.wallet.address.slice(0, 6)}...${this.wallet.address.slice(-6)}`, 'info');
      await this.log(`Auth token đã được tạo tự động`, 'info');

      this.usedNonce[this.wallet.address] = await this.provider.getTransactionCount(this.wallet.address, 'pending');

      await this.log('Đang claim token', 'info');
      await this.processPerformClaimFaucet();

      await this.log('Bắt đầu stake:', 'info');
      for (let i = 0; i < this.stakingCount; i++) {
        await this.log(`Số lần stake ${i + 1} / ${this.stakingCount}`, 'info');

        const usdcBalance = await this.getTokenBalance(USDC_CONTRACT_ADDRESS);
        const usdtBalance = await this.getTokenBalance(USDT_CONTRACT_ADDRESS);
        const musdBalance = await this.getTokenBalance(MUSD_CONTRACT_ADDRESS);
        await this.log(`Số dư: ${usdcBalance || 0} USDC | ${usdtBalance || 0} USDT | ${musdBalance || 0} MockUSD`, 'info');

        const stakeSuccess = await this.processPerformStaking();
        if (!stakeSuccess) {
          return { success: false, message: "Staking thất bại", stop: true };
        }

        const delay = Math.floor(Math.random() * (this.maxDelay - this.minDelay + 1)) + this.minDelay;
        await this.log(`Đợi ${delay} giây cho giao dịch tiếp theo...`, 'info');
        await new Promise((resolve) => setTimeout(resolve, delay * 1000));
      }

      return { success: true, message: "Xử lý staking thành công" };

    } catch (e) { 
      await this.log(`Xử lý ví thất bại: ${e.message}${e.reason ? `, Reason: ${e.reason}` : ''}`, 'error');
      return { success: false, message: e.message, stop: true };
    }
  }
}
module.exports = StakingService;
