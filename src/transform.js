/**
 * TRMNL Advanced RSS Plugin - Transform Function
 * 
 * Reduces RSS API response payload to under 100KB by:
 * - Limiting items to 20 (maximum displayed)
 * - Truncating content fields
 * - Removing unused fields
 * - Cleaning HTML from content
 * 
 * Required fields per RSS item:
 * - title: Article title
 * - preview_url: Thumbnail/image URL
 * - description: Short description (max 300 chars)
 * - content: Article content (max 500 chars)
 * 
 * Feed metadata:
 * - feed.image: Feed logo
 * - title: Feed title
 * - description: Feed description (max 200 chars)
 */

function transform(input) {
  /**
   * Bereinigt und kürzt HTML-Content
   * @param {string} content - Der zu bereinigende Content
   * @param {number} maxChars - Maximale Zeichenlänge
   * @returns {string} Bereinigter und gekürzter Text
   */
  function cleanAndTruncate(content, maxChars) {
    if (!content) return "";
    
    // HTML-Tags entfernen, aber Zeilenumbrüche beibehalten
    let cleaned = content.replace(/<[^>]*>/g, ' ');
    // Mehrfache Leerzeichen entfernen
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    // HTML-Entities dekodieren (z.B. &nbsp;, &amp;)
    cleaned = cleaned
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    // Auf maxChars begrenzen
    if (cleaned.length > maxChars) {
      cleaned = cleaned.substring(0, maxChars).trim() + '...';
    }
    
    return cleaned;
  }

  /**
   * Reduziert ein einzelnes RSS Item auf die benötigten Felder
   * @param {Object} item - Das RSS Item
   * @returns {Object} Reduziertes Item mit nur benötigten Feldern
   */
  function reduceItem(item) {
    return {
      title: item.title || "",
      preview_url: item.preview_url || item.thumbnail || item.image || item.media_thumbnail_url || "",
      description: cleanAndTruncate(item.description, 300),
      content: cleanAndTruncate(item.content || item.description, 500),
      content_encoded: cleanAndTruncate(item.content_encoded || item.content || item.description, 500)
    };
  }

  // Erstelle reduziertes Objekt und gib es direkt zurück
  // Die Liquid Templates erwarten die Felder direkt im Root (items, status, title, etc.)
  // Die API gibt Feed-Daten direkt im Root zurück, nicht unter einem "feed" Objekt
  return {
    status: input.status || "success",
    message: input.message || "",
    title: input.title || "",
    description: cleanAndTruncate(input.description || "", 200),
    link: input.link || "",
    feed: {
      image: input.image || input.feed?.image || ""
    },
    // Limitiere auf maximal 20 Items und reduziere jedes Item
    items: (input.items || []).slice(0, 20).map(reduceItem)
  };
}
