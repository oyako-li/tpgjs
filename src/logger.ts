import fs from "fs";

export function formatDate(date: Date) {
  let year = date.getFullYear();
  let month = (date.getMonth() + 1).toString().padStart(2, "0");
  let day = date.getDate().toString().padStart(2, "0");
  let hours = date.getHours().toString().padStart(2, "0");
  let minutes = date.getMinutes().toString().padStart(2, "0");
  let seconds = date.getSeconds().toString().padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function myLog(file?: string) {
  return function () {
    const date = new Date();
    const path = `../log/${date.getFullYear()}-${date.getMonth() + 1}`;
    const now = `${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}-${date.getMilliseconds()}`;
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }
    fs.appendFileSync(
      `${path}/${date.getDate()}.log`,
      `${now}, ${Array.from(arguments).join(", ")}\r\n`
    );
  };
}
