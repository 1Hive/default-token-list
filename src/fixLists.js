import fetch from "node-fetch";
import utils from "web3-utils";
import { gnosis } from '@wagmi/core/chains'
import { configureChains, readContract, createConfig } from '@wagmi/core'
import { publicProvider } from '@wagmi/core/providers/public'
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from "axios";

const __dirname = dirname(fileURLToPath(import.meta.url));
const logos = {};

function sortTokenList(list) {
  function compareStrings(a, b) {
    // Assuming you want case-insensitive comparison
    a = a.toLowerCase();
    b = b.toLowerCase();

    return (a < b) ? -1 : (a > b) ? 1 : 0;
  }

  const map = {};
  for (let i = 0; i < list.length; i++) {
    const token = list[i];
    const key = `${token.chainId}-${token.symbol.toLowerCase()}`;
    if (typeof map[key] !== "undefined") {
      const regex = /.*(from Mainnet)/gm
      const parsed = regex.exec(token.name);
      const isBridged = (parsed) ? true : false;
      if (isBridged ) {
        list.splice(i, 1);
      }
      else{
        list.splice(map[key], 1);
      }
    }
    map[key] = i;
  }

  return list.sort(function (a, b) {
    return compareStrings(a.name, b.name);
  })
}

function checkIfLogoAlreadyExists(address) {
  function test(format) {
    if (fs.existsSync(__dirname + `/assets/gnosis/${address}/logo.${format}`))
      return true
    return false
  }
  const formats = ['png', 'jpg', 'svg', 'jpeg'];
  for (let ff of formats){
    if (test(ff)){
      return `https://raw.githubusercontent.com/1Hive/default-token-list/master/src/assets/gnosis/${address}/logo.${ff}`
    }
  }
  return false;
}


async function getLogo(url, address, name) {
  const check = await checkIfLogoAlreadyExists(address);
  if (check !== false) {
    return check;
  }
  const regex = /.*(\.[png;jpg;svg;jpeg]+)/gm
  try {
    const format = regex.exec(url);
    const ff = (format) ? format[1] : '.png';
    const newDir = __dirname + `/assets/gnosis/${address}`
    const newPath = newDir + `/logo${ff}`;
    if (newPath !== url) {
      const response = await axios.get(url, { timeout: 20000, responseType: 'stream' }).then(
        res => {
          if (!fs.existsSync(newDir)) {
            fs.mkdirSync(newDir, { recursive: true });
          }
          if (address === `0x0acd91f92fe07606ab51ea97d8521e29d110fd09`);
          res.data.pipe(fs.createWriteStream(newPath))
        })
      return `https://raw.githubusercontent.com/1Hive/default-token-list/master/src/assets/gnosis/${address}/logo${ff}`;
    }
  } catch (error) {
       console.error(`${name}: ${error.message}`);
  }
}

async function fixLists(currentList) {
  const listedTokens = JSON.parse(currentList);
  const sortedList = sortTokenList(listedTokens);

  return Promise.all(
    sortedList
      .map(
        async ({ name, address, symbol, decimals, chainId, logoURI }) => {
          address = address.toLowerCase();
          name = name.trim();
          const newUri = await getLogo(logoURI, address, name);
          if (logoURI !== "") {
            return {
              name: name,
              address: address,
              symbol: symbol,
              decimals: decimals,
              chainId: chainId,
              logoURI: newUri,
            };
          }
        }
      )
  );
}

fs.readFile(__dirname + "/tokens/gnosis.json", { encoding: "UTF8" }, function read(err, data) {
  if (err) {
    throw err;
  }
  fixLists(data).then((x) => {
    const cleanJson = x.filter(function (obj) {
      if (!obj) {
        return false; // skip
      }
      return true
    }
    )
    const newTokens = JSON.stringify(cleanJson, null, "  ");
    fs.writeFile((__dirname + "/tokens/gnosis.json"), newTokens, function (err) {
      if (err) console.log(err);
    });
  });
}
)