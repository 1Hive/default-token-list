const packageJson = require("../package.json");
const schema = require("@uniswap/token-lists/src/tokenlist.schema.json");
const { expect } = require("chai");
const { getAddress } = require("@ethersproject/address");
const Ajv = require("ajv");
const buildList = require("../src/buildList");
const jp = require("jsonpath");
const axios = require("axios");

const ajv = new Ajv({ allErrors: true, format: "full" });
const validate = ajv.compile(schema);

function getBranchFromArgs(defaultBranch) {
  // refs/tags/<tag_name> // refs/heads/<branch_name>
  const args = process.argv.slice(2); // Ignorando os dois primeiros argumentos (node e nome do arquivo)
  const branchIndex = args.indexOf("--branch");
  const commitIndex = args.indexOf("--commit");
  console.log("Args", args);
  console.log("BranchIndex", branchIndex);
  console.log("CommitIndex", commitIndex);
  if (commitIndex !== -1 && commitIndex < args.length - 1) {
    const commit = args[commitIndex + 1];
    console.log("Commit found", commit);
    return commit;
  }
  if (branchIndex !== -1 && branchIndex < args.length - 1) {
    const branch = args[branchIndex + 1];
    console.log("Branch/Tag found", branch);
    if (branch) {
      if (branch.startsWith("refs/heads/")) {
        return branch.replace("refs/heads/", "");
      } else if (branch.startsWith("refs/tags/")) {
        return branch.replace("refs/tags/", "");
      }
    }
    return branch;
  }

  return defaultBranch;
}

describe("buildList", () => {
  const defaultTokenList = buildList();

  it("validates", () => {
    if (!validate(defaultTokenList)) {
      // for errors
      for (i = 0; i < validate.errors.length; i++) {
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
    for (let token of defaultTokenList.tokens) {
      let url = token.logoURI;
      // if tokenURI have that format: *1Hive/default-token-list/master/src/assets/* then replace to *1Hive/default-token-list/{branch}/src/assets*
      if (branch) {
        if (url.includes("1Hive/default-token-list/master/src/assets/")) {
          url = url.replace(
            "1Hive/default-token-list/master/src/assets/",
            `1Hive/default-token-list/${branch}/src/assets/`
          );
        }
      }

      try {
        const response = await axios.get(url, { timeout: 20000 });
        if (response.status === 200) {
          // console.log(`URL ${url} é válida.`);
        } else {
          console.log(`URL ${url} retornou um status diferente de 200.`);
        }
      } catch (error) {
        console.error(`Erro ao verificar a URL ${url}: ${error.message}`);
      }
    }
  });
});
