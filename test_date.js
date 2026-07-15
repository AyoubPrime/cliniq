const date = new Date();
const algiersDate = new Intl.DateTimeFormat('en-CA', { 
  timeZone: 'Africa/Algiers', 
  year: 'numeric', 
  month: '2-digit', 
  day: '2-digit' 
}).format(date);
console.log(algiersDate);
