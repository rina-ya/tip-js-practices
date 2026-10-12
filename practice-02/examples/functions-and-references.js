//Гиниятова АИ
// examples/functions-and-references.js
// Эксперименты по функциям, ссылкам и копированию.
// Прогнозы записаны в комментариях до запуска.

// Эксперимент 1. sum с числами и со строкой.
// Прогноз: sum(2, 3) = 5; sum("2", 3) = "23", тип string.
// Причина: + со строкой выполняет конкатенацию, а не сложение.
function sum(a, b) {
  return a + b;
}

console.log("Эксперимент 1");
console.log(sum(2, 3));
console.log(sum("2", 3));
console.log(typeof sum("2", 3));

// Эксперимент 2. Стрелочная функция с телом в {} без return.
// Прогноз: squareBroken(4) = undefined, потому что нет return.
// Причина: при теле в фигурных скобках результат не возвращается автоматически.
// Исправление: добавлен return, теперь square(4) = 16.
const squareBroken = (value) => {
  value * value;
};

const square = (value) => {
  return value * value;
};

console.log("Эксперимент 2");
console.log(squareBroken(4));
console.log(square(4));

// Эксперимент 3. Присваивание объекта второй переменной.
// Прогноз: alias и original — один и тот же объект, изменение видно в обоих.
// Причина: объекты копируются по ссылке, === сравнивает идентичность.
const original = { title: "Черновик", published: false };
const alias = original;

alias.published = true;

console.log("Эксперимент 3");
console.log(original.published);
console.log(original === alias);

// Эксперимент 4. Spread массива объектов.
// Прогноз: новый массив, но объекты внутри — те же ссылки.
// Причина: spread делает поверхностное копирование.
const items = [
  { id: 1, title: "A" },
  { id: 2, title: "B" },
];
const copiedItems = [...items];

copiedItems[0].title = "Изменено";

console.log("Эксперимент 4");
console.log(items[0].title);
console.log(items === copiedItems);

// Эксперимент 5. Spread объекта и повторное свойство.
// Прогноз: newBook.available = true, oldBook.available = false.
// Причина: последнее свойство перекрывает предыдущее, верхний объект новый.
const oldBook = { id: 12, title: "Черновик", available: false };
const newBook = { ...oldBook, available: true };

console.log("Эксперимент 5");
console.log(oldBook.available);
console.log(newBook.available);
console.log(oldBook === newBook);

// Эксперимент 6. Параметр по умолчанию.
// Прогноз: undefined -> "Без названия"; null -> null; "" -> "".
// Причина: значение по умолчанию срабатывает только для undefined.
function makeCaption(text = "Без названия") {
  return text;
}

console.log("Эксперимент 6");
console.log(makeCaption());
console.log(makeCaption(undefined));
console.log(makeCaption(null));
console.log(makeCaption(""));

// Итог по эксперименту 2.
// До исправления squareBroken(4) возвращал undefined.
// После добавления return square(4) возвращает 16 (number).