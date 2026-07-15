export function getAlgiersDateString(date: Date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'Africa/Algiers', 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }).format(date);
}
