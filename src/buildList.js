const { version } = require("../package.json");
const gnosis = require("./tokens/gnosis.json");
const polygon = require("./tokens/polygon.json");

module.exports = function buildList() {
  const parsed = version.split(".");
  return {
    name: "Honeyswap Default",
    timestamp: new Date().toISOString(),
    version: {
      major: +parsed[0],
      minor: +parsed[1],
      patch: +parsed[2],
    },
    tags: {},
    logoURI:
      "https://ipfs.io/ipfs/bafybeihqunal3rxoz7bosmqxqobz2sz4nn62naufxqf2fyq35bepp4pkdy",
    keywords: ["honeyswap", "gnosis", "polygon"],
    tokens: [...gnosis, ...polygon]
      // sort them by symbol for easy readability
      .sort((t1, t2) => {
        if (t1.chainId === t2.chainId) {
          return t1.symbol.toLowerCase() < t2.symbol.toLowerCase() ? -1 : 1;
        }
        return t1.chainId < t2.chainId ? -1 : 1;
      }),
  };
};
