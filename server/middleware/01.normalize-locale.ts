export default defineEventHandler((event) => {
  const acceptLanguage = getRequestHeader(event, 'accept-language');
  
  if (acceptLanguage) {
    // e.g. "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
    const firstLang = acceptLanguage.split(',')[0]?.trim() || '';
    // Extract base language code (e.g., "id" from "id-ID")
    const baseLang = firstLang.split('-')[0];
    
    // Only rewrite if it's a known locale format that has a country code
    if (baseLang && baseLang !== firstLang) {
      // Reconstruct the header with the base language first
      const newHeader = [baseLang, acceptLanguage].join(', ');
      
      // Update the header in H3
      if (event.headers && typeof event.headers.set === 'function') {
        event.headers.set('accept-language', newHeader);
      }
      if (event.node?.req?.headers) {
        event.node.req.headers['accept-language'] = newHeader;
      }
    }
  }
});
