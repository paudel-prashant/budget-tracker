import fs from "fs";

const content = fs.readFileSync(".gitignore", "utf8");
fs.writeFileSync(".gitignore", content.replace(/\r\n/g, "\n"), "utf8");
console.log("Ensured .gitignore is UTF-8");
