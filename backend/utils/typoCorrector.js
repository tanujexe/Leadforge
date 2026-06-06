/**
 * Auto-corrects common user typos in search queries.
 * Maps misspelled words to their correct counterparts.
 */
const typoMap = {
  // gym
  'gum': 'gym',
  'gim': 'gym',
  'gymm': 'gym',
  // cafe
  'caffe': 'cafe',
  'caf': 'cafe',
  'cafee': 'cafe',
  'coffeeshop': 'coffee shop',
  'coffeehouse': 'coffee shop',
  // salon
  'saloon': 'salon',
  'sallon': 'salon',
  'saln': 'salon',
  // restaurant
  'resturant': 'restaurant',
  'restraunt': 'restaurant',
  'restaraunt': 'restaurant',
  'restrant': 'restaurant',
  // dentist
  'dentistt': 'dentist',
  'dentis': 'dentist',
  // hotel
  'hotle': 'hotel',
  'hotell': 'hotel',
  // spa
  'spaa': 'spa',
  // bakery
  'bakri': 'bakery',
  'bakeri': 'bakery',
  // academy
  'acadamy': 'academy',
  // boutique
  'botique': 'boutique',
  'boutiq': 'boutique',
  // hospital
  'hospitle': 'hospital',
  'hospita': 'hospital',
  // school
  'schol': 'school',
  'schooll': 'school',
  // coaching
  'cochng': 'coaching',
  'coachin': 'coaching'
};

/**
 * Normalizes and corrects typos in a business category input.
 * @param {string} input - User category input (e.g. "caffe")
 * @returns {string} Corrected category (e.g. "cafe")
 */
function correctBusinessType(input) {
  if (!input) return '';
  
  // Clean inputs
  const cleanInput = input.trim().toLowerCase();
  
  // Try direct match of the whole phrase
  if (typoMap[cleanInput]) {
    return typoMap[cleanInput];
  }
  
  // Try splitting by space and correcting individual words
  const words = cleanInput.split(/\s+/);
  const correctedWords = words.map(word => typoMap[word] || word);
  
  // Re-join words with standard spacing
  return correctedWords.join(' ');
}

module.exports = { correctBusinessType };
