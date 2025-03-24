interface TextSplitterOptions {
  chunkSize: number;
  chunkOverlap: number;
}

export class RecursiveCharacterTextSplitter {
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(options: TextSplitterOptions) {
    this.chunkSize = options.chunkSize;
    this.chunkOverlap = options.chunkOverlap;
  }

  /**
   * Split text into chunks of a specified size with overlap
   */
  splitText(text: string): string[] {
    if (!text || text.length <= this.chunkSize) {
      return [text];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + this.chunkSize;
      
      if (end >= text.length) {
        end = text.length;
      } else {
        // Try to find a natural break point
        const lastPeriod = text.lastIndexOf('.', end);
        const lastNewline = text.lastIndexOf('\n', end);
        const lastSpace = text.lastIndexOf(' ', end);
        
        // Find the closest natural break that's not too far back
        const minBreakPoint = end - this.chunkSize / 2;
        if (lastPeriod > minBreakPoint) {
          end = lastPeriod + 1; // Include the period
        } else if (lastNewline > minBreakPoint) {
          end = lastNewline + 1; // Include the newline
        } else if (lastSpace > minBreakPoint) {
          end = lastSpace + 1; // Include the space
        }
        // If no good break point, just use the calculated end
      }

      chunks.push(text.slice(start, end));
      
      // Move start position for next chunk, accounting for overlap
      start = end - this.chunkOverlap;
      
      // Ensure we're making progress
      if (start >= text.length || start <= 0) {
        break;
      }
    }

    return chunks;
  }
} 