import packageJson from "../package.json" assert { type: "json" };
import schema from "./tokenlist.schema.json" assert { type: "json" };
import { expect } from "chai";
import { getAddress } from "@ethersproject/address";
import Ajv from "ajv";
import buildList from "../src/buildList.js";
import jp from "jsonpath";
import axios from "axios";

const ajv = new Ajv({ allErrors: true, format: "full" });
const validate = ajv.compile(schema);

function getBranchFromArgs(defaultBranch) {
  const args = process.argv.slice(2); // Ignorando os dois primeiros argumentos (node e nome do arquivo)
  const commitIndex = args.indexOf("--commit");
  console.log("Args", args);
  console.log("CommitIndex", commitIndex);
  if (commitIndex !== -1 && commitIndex < args.length - 1) {
    const commit = args[commitIndex + 1];
    console.log("Commit found", commit);
    return commit;
  }
  return defaultBranch;
}

describe("buildList", () => {
  const defaultTokenList = buildList();

  it("validates", () => {
    if (!validate(defaultTokenList)) {
      // for errors
      for (let i = 0; i < validate.errors.length; i++) {
        const error = validate.errors[i];
        console.log(error);
        if (error.dataPath) {
          const resultWithProblem = jp.query(
            defaultTokenList,
            `$${error.dataPath}`
          );
          console.log("resultWithProblem", resultWithProblem);
        }
      }
    }
    expect(validate(defaultTokenList)).to.equal(true);
  });

  it("contains no duplicate addresses", () => {
    const map = {};
    for (let token of defaultTokenList.tokens) {
      const key = `${token.chainId}-${token.address}`;
      expect(typeof map[key]).to.equal("undefined");
      map[key] = true;
    }
  });

  it("contains no duplicate symbols", () => {
    const map = {};
    for (let token of defaultTokenList.tokens) {
      const key = `${token.chainId}-${token.symbol.toLowerCase()}`;
      if (typeof map[key] != "undefined") {
        console.log(token)
      }
      expect(typeof map[key]).to.equal("undefined");
      map[key] = true;
    }
  });

  it("contains no duplicate names", () => {
    const map = {};
    for (let token of defaultTokenList.tokens) {
      const key = `${token.chainId}-${token.name.toLowerCase()}`;
      expect(typeof map[key]).to.equal(
        "undefined",
        `duplicate name: ${token.name}`
      );
      map[key] = true;
    }
  });

  it("all addresses are valid and checksummed", () => {
    for (let token of defaultTokenList.tokens) {
      expect(getAddress(token.address).toLowerCase()).to.eq(
        token.address.toLowerCase()
      );
    }
  });

  it("version matches package.json", () => {
    expect(packageJson.version).to.match(/^\d+\.\d+\.\d+$/);
    expect(packageJson.version).to.equal(
      `${defaultTokenList.version.major}.${defaultTokenList.version.minor}.${defaultTokenList.version.patch}`
    );
  });

  it("all images url are valid", async () => {
    for (let token of defaultTokenList.tokens) {
      expect(token.logoURI).to.match(/^https?:\/\/.+/);
    }
  });

  it("all images return status 200", async function () {
    this.timeout(0);
    const branch = getBranchFromArgs(undefined);
    let fails = 0;
    for (let token of defaultTokenList.tokens) {
      let url = token.logoURI;
      // if tokenURI have that format: *1Hive/default-token-list/master/src/assets/* then replace to *1Hive/default-token-list/{branch}/src/assets*
      if (url.includes(`https://raw.githubusercontent.com/1Hive/default-token-list/master/src/assets/gnosis/${token.address.toLowerCase()}/logo.`)) {
        if (branch) {

          url = url.replace(
            "1Hive/default-token-list/master/src/assets/",
            `1Hive/default-token-list/${branch}/src/assets/`
          );
        }
      }else{
        try {
          const response = await axios.get(url, { timeout: 20000 });
          if (response.status === 200) {
            // console.log(`URL ${url} é válida.`);
          } else {
            console.log(`URL ${url} retornou um status diferente de 200.`);
            fails++;

          }
        } catch (error) {
          fails++;
          console.error(`Erro ao verificar a URL ${url}: ${error.message}`);
        }
      }
      expect(fails).to.eq(0);
    }
  });
});
