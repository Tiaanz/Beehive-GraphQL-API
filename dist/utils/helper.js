import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
dayjs.extend(customParseFormat);
export function convertDate(date) {
    const year = date.slice(6);
    const month = date.slice(3, 5);
    const day = date.slice(0, 2);
    return year + '-' + month + '-' + day;
}
export function extractDatesFromArray(arr) {
    const dates = [];
    for (let i = 0; i < arr.length; i++) {
        const dateFromObj = dayjs(arr[i].date_from);
        const dateToObj = dayjs(arr[i].date_to);
        let currentDate = dateFromObj;
        while (currentDate.isSame(dateToObj) || currentDate.isBefore(dateToObj)) {
            dates.push(currentDate.format('YYYY/MM/DD'));
            currentDate = currentDate.add(1, 'day');
        }
    }
    return dates;
}
export function extractDatesFromDateRange(dateFrom, dateTo) {
    const dates = [];
    const dateFromObj = dayjs(dateFrom);
    const dateToObj = dayjs(dateTo);
    let currentDate = dateFromObj;
    while (currentDate.isSame(dateToObj) || currentDate.isBefore(dateToObj)) {
        dates.push(currentDate.format('YYYY/MM/DD'));
        currentDate = currentDate.add(1, 'day');
    }
    return dates;
}
export function validateTime(timeString) {
    const format = 'hh:mm A';
    return (dayjs(timeString?.slice(0, 8), format, true).isValid() &&
        dayjs(timeString?.slice(11), format, true).isValid());
}
