const fetch = require('node-fetch');
const utils = require('web3-utils');
const fs = require('fs');
async function getLogo(xdaiAddr) {
  const response = await fetch(`https://blockscout.com/poa/xdai/tokens/${xdaiAddr}/token-transfers`)
  const text = await response.text()
  const mainnetAddr = text.match(/https:\/\/etherscan.io\/token\/(0x[a-fA-F0-9]{40})/)
  if (mainnetAddr) {
    const formattedAddr = utils.toChecksumAddress(mainnetAddr[1])
    return utils.toChecksumAddress(mainnetAddr[1])
  }
  else {
    return false
  }
}

async function fetchMissing() {
  const response = await fetch(
    'https://blockscout.com/poa/xdai/api/?module=account&action=tokentx&address=0xf6A78083ca3e2a662D6dd1703c939c8aCE2e268d'
  )
  const data = await response.json()
  const bridgedTokens = [...new Set(data.result.map(x => x.contractAddress.toLowerCase()))]

  const response2 = await fetch('https://tokens.honeyswap.org')
  const data2 = await response2.json()

  const listedTokens = data2.tokens.map(x => x.address.toLowerCase())
  const missingTokens = bridgedTokens.filter(x => !listedTokens.includes(x))
  return Promise.all(
    missingTokens
      .map(x => data.result.find(y => y.contractAddress === x))
      .map(async ({ tokenName, tokenSymbol, tokenDecimal, contractAddress }) => {
        const mainnetAddress = await getLogo(contractAddress)
        if (mainnetAddress) {
          const logoURI = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${mainnetAddress}/logo.png`
          const response3 = await fetch(logoURI)
          if (response3.status === 200) {
            return {
              name: tokenName,
              address: contractAddress,
              symbol: tokenSymbol,
              decimals: parseInt(tokenDecimal),
              chainId: 100,
              logoURI: logoURI,
              bridged: true,
              native: "mainnet",
              contracts: {
                mainnet: mainnetAddress
              },
            }
          }
        }
      })
  )
}




fetchMissing().then(x => {
  let jsonTokens = JSON.stringify(x, null, '  ')

  fs.writeFile('xdai_extended.json', jsonTokens, (err) => {
    // throws an error, you could also catch it here
    if (err) throw err;

    // success case, the file was saved
    console.log('Saved');
  });

})
