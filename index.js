// const Telegraf = require("telegraf");
// const config = require("./config.json");
// // const bot = new Telegraf(config.botToken);
// const neo4j = require("neo4j-driver");
// const driver = neo4j.driver(
//   config.neo4j.url,
//   neo4j.auth.basic(config.neo4j.authUser, config.neo4j.authKey)
// );
// const { find, propEq, merge } = require('ramda')

const fs = require("fs-extra");

const filterText = text =>
  String(text)
    .split(" ")
    .map(word => (!/[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ]/.test(word) ? "%NOLETTERS%" : word))
    .join(" ")
    .replace(
      new RegExp(
        `\\` + `()[].?`.split("").join(`|\\`) + `,;:!¿“”"—`.split("").join("|"),
        "g"
      ),
      "%PUNCTUATION%"
    )
    .replace(/[0-9]/g, "%ALPHANUMERICAL%")
    .replace(/http\S+/g, "%LINK%")
    .replace("\n", "%LINEBREAK%")
    .split(" ")
    .filter(x => x);

const objToNode = obj => {
  const { label, properties } = obj;
  const propertiesText = Object.entries(properties)
    .map(pair => pair.join(": "))
    .join(", ");
  return `(:${label} { ${propertiesText} })`;
};

const insertFile = (fileName, title) =>
  fs
    .readFile(fileName, "utf8")
    .then(filterText)
    .then(wordArr => {
      // structure: { label: 'Word', properties: { value: 'eagle', count: 3, originalText: 'Harry Potter & the Pig' } }
      const nodeArr = wordArr.reduce((arr, word) => {
        const existsIndex = arr.findIndex(
          el => el.properties && el.properties.value === word
        );
        const obj = {
          label: "Word",
          properties: {
            value: word,
            count: existsIndex < 0 ? 1 : arr[existsIndex].properties.count,
            originalText: title
          }
        };
        const newArr =
          existsIndex < 0
            ? arr.concat(obj)
            : [
                ...arr.slice(0, existsIndex),
                obj,
                ...arr.slice(existsIndex + 1)
              ];
        return newArr;
      }, []);
      return nodeArr;
    });

/*
Current problems + ToDo:

word counter is not working, it worked before, now all are 1.
it's probably a problem in the obj.properties.count algo.

todo:
- fix that problem
- add a nextWord counter with an array [word1, word2], etc.,
  maybe also word1: {value: bla, counter: bla} to avoid multiple relationships

*/

insertFile("./alchemist.txt", "The Alchemist by H.P. Lovecraft").then(
  console.log
);
