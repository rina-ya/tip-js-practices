"use strict"; //Гиниятова АИ

const totalTasks = 6;
const completedTasks = 0;
const dailyLimit = 1;

if (typeof totalTasks !== 'number' || typeof completedTasks !== 'number') {
    console.log("Ошибка: вместо числа передана строка.");
} else if (Number.isNaN(totalTasks) || Number.isNaN(completedTasks)) {
    console.log("Ошибка: недопустимое числовое значение.");
} else if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
    console.log("Ошибка: дробное количество.");
} else if (totalTasks < 0 || completedTasks < 0) {
    console.log("Ошибка: отрицательное количество.");
} else if (totalTasks > 1000) {
    console.log("Ошибка: превышена верхняя граница.");
} else if (completedTasks > totalTasks) {
    console.log("Ошибка: выполнено больше, чем существует.");
} else if (typeof dailyLimit !== 'number') {
    console.log("Ошибка: дневная норма задана строкой.");
} else if (Number.isNaN(dailyLimit)) {
    console.log("Ошибка: недопустимое числовое значение.");
} else if (!Number.isInteger(dailyLimit)) {
    console.log("Ошибка: дробной дневной нормы быть не должно.");
} else if (dailyLimit < 1 || dailyLimit > 1000) {
    console.log("Ошибка: превышена верхняя граница нормы.");
} else {
    let remaining = totalTasks - completedTasks;

    if (remaining === 0) {
        console.log("Все задачи уже выполнены");
        console.log("Рабочих дней с задачами: 0");
        console.log("Календарных дней: 0");
    } else {
        console.log(`Осталось задач: ${remaining}`);
        let workDays = 0;
        let calendarDays = 0;
        let dayOfWeek = 1;

        while (remaining > 0) {
            calendarDays++;
            const isWeekend = (dayOfWeek === 6 || dayOfWeek === 7);

            if (!isWeekend) {
                workDays++;
                const doneToday = Math.min(dailyLimit, remaining);
                remaining -= doneToday;
                console.log(`Календарный день ${calendarDays} (рабочий ${workDays}): выполнено ${doneToday}, осталось ${remaining}`);
            } else {
                console.log(`Календарный день ${calendarDays} (выходной): выполнено 0, осталось ${remaining}`);
            }

            dayOfWeek++;
            if (dayOfWeek > 7) {
                dayOfWeek = 1;
            }
        }

        console.log(`Рабочих дней с задачами: ${workDays}`);
        console.log(`Календарных дней: ${calendarDays}`);
    }
}