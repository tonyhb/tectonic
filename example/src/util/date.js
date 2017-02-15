const shortMonths = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const shortDays = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
];

const dateWithSuffix = (date) => {
  const day = date.getDate();
  if ([1, 21, 31].indexOf(day) > -1) {
    return `${day}st`;
  }
  if ([2, 22].indexOf(day) > -1) {
    return `${day}nd`;
  }
  if ([3, 23].indexOf(day) > -1) {
    return `${day}rd`;
  }
  return `${day}th`;
};

export const monthYear = date =>
  `${shortMonths[date.getMonth()]} ${date.getFullYear()}`;

export const humanDate = (date) => {
  let mins = date.getMinutes();
  let hours = date.getHours();

  if (mins < 10) {
    mins = `0${mins}`;
  }

  if (hours < 10) {
    hours = `0${hours}`;
  }


  return `${shortDays[date.getDay()]} ${dateWithSuffix(date)}
${shortMonths[date.getMonth()]}, ${hours}:${mins}`;
};

