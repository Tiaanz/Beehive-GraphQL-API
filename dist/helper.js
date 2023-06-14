export function convertDate(date) {
    const year = date.slice(6);
    const month = date.slice(3, 5);
    const day = date.slice(0, 2);
    return year + '-' + month + '-' + day;
}
