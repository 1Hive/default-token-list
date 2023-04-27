const packageJson = require("../package.json");
const schema = require("@uniswap/token-lists/src/tokenlist.schema.json");
const { expect } = require("chai");
const { getAddress } = require("@ethersproject/address");
const Ajv = require("ajv");
const buildList = require("../src/buildList");
const jp = require("jsonpath");

const ajv = new Ajv({ allErrors: true, format: "full" });
const validate = ajv.compile(schema);

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
});
