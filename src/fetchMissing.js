import fetch from "node-fetch";
import utils from "web3-utils";
import { gnosis } from '@wagmi/core/chains'
import { configureChains, readContract, createConfig } from '@wagmi/core'
import { publicProvider } from '@wagmi/core/providers/public'
import { HomeOmnibridgeAbi } from './abis/HomeOmnibridge.js';
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [gnosis],
  [publicProvider()],
)

const config = createConfig({
  autoConnect: true,
  publicClient
})

async function getMainnetAddress(gnosisAddr) {
  const data = await readContract({
    address: '0xf6A78083ca3e2a662D6dd1703c939c8aCE2e268d',
    abi: HomeOmnibridgeAbi,
    functionName: 'foreignTokenAddress',
    args: [gnosisAddr]
  })
  return data;
}

const indexOf = (arr, q) => arr.findIndex(item => q.toLowerCase() === item.toLowerCase());


async function getLogo(gnosisAddr, tokenSymbol) {
  const mainnetAddr = await getMainnetAddress(gnosisAddr);
  const geckoTokens = await geckoList.tokens.map((x) => x.address);
  const cowTokens = await cowList.tokens.map((x) => x.address);
  const mainnetIndex = await indexOf(geckoTokens, mainnetAddr.toLowerCase());
  const gnosisIndex = await indexOf(geckoTokens, gnosisAddr);
  const cowIndex = await indexOf(cowTokens, gnosisAddr);
  if (mainnetIndex > 0) {
    const tokenFound = await geckoList.tokens[mainnetIndex].logoURI;
    return tokenFound;
  }
  else if (gnosisIndex > 0) {
    const tokenFound = await geckoList.tokens[gnosisIndex].logoURI;
    return tokenFound;
  }
  else if (cowIndex > 0) {
    const tokenFound = await cowList.tokens[cowIndex].logoURI;
    return tokenFound;
  } else {
    console.log("Not on Coingecko or Cowswap List: ", gnosisAddr, " ", tokenSymbol);
  }
  return ``
}

async function fetchMissing() {
  const response = await fetch(
    "https://blockscout.com/poa/xdai/api/?module=account&action=tokentx&address=0xf6A78083ca3e2a662D6dd1703c939c8aCE2e268d"
  );
  const data = await response.json();
  const bridgedTokens = [
    ...new Set(data.result.map((x) => x.contractAddress.toLowerCase())),
  ];
  // console.log(bridgedTokens);

  const response2 = await fetch("https://tokens.honeyswap.org");
  const data2 = await response2.json();

  const listedTokens = data2.tokens.map((x) => x.address.toLowerCase());
  const missingTokens = bridgedTokens.filter((x) => !listedTokens.includes(x));
  return Promise.all(
    missingTokens
      .map((x) => data.result.find((y) => y.contractAddress === x))
      .map(
        async ({ tokenName, tokenSymbol, tokenDecimal, contractAddress }) => {

          const logoURI = await getLogo(contractAddress, tokenSymbol);
          if (logoURI !== "") {
            return {
              name: tokenName,
              address: contractAddress,
              symbol: tokenSymbol,
              decimals: parseInt(tokenDecimal),
              chainId: 100,
              logoURI,
            };
          }
        }
      )
  );
}

const fetchGecko = await fetch("https://tokens.coingecko.com/uniswap/all.json");
const geckoList = await fetchGecko.json();

const fetchCow = await fetch("https://files.cow.fi/tokens/CowSwap.json");
const cowList = await fetchCow.json();

fetchMissing().then((x) => {
  const cleanJson = x.filter(function (obj) {
    if (!obj) {
      return false; // skip
    }
    return true
  }
  )
  const newTokens = JSON.stringify(cleanJson, null, "  ");
  fs.writeFile((__dirname + "/newGnosisTokens.json"), newTokens, function (err) {
    if (err) console.log(err);
  });
});

