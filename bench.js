const ITERS = 1000000;
const str = "timestamp";

const capitalizeLocale = (str) => str.charAt(0).toLocaleUpperCase() + str.slice(1);
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

console.time("toLocaleUpperCase");
for (let i = 0; i < ITERS; i++) {
  capitalizeLocale(str);
}
console.timeEnd("toLocaleUpperCase");

console.time("toUpperCase");
for (let i = 0; i < ITERS; i++) {
  capitalize(str);
}
console.timeEnd("toUpperCase");
