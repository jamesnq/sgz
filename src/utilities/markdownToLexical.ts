import { marked } from 'marked';

export function markdownToLexical(markdown: string) {
  if (!markdown) return null;

  try {
    const tokens = marked.lexer(markdown);
    const children: any[] = [];

    const processTextTokens = (textTokens: any[]) => {
      const textNodes: any[] = [];
      if (!textTokens) return textNodes;

      textTokens.forEach((token) => {
        if (token.type === 'strong') {
          textNodes.push({
            detail: 0,
            format: 1, // 1 is bold
            mode: 'normal',
            style: '',
            text: token.text,
            type: 'text',
            version: 1,
          });
        } else if (token.type === 'em') {
          textNodes.push({
            detail: 0,
            format: 2, // 2 is italic
            mode: 'normal',
            style: '',
            text: token.text,
            type: 'text',
            version: 1,
          });
        } else if (token.type === 'text' || token.type === 'escape') {
          textNodes.push({
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: token.raw || token.text,
            type: 'text',
            version: 1,
          });
        } else {
          // Fallback
          textNodes.push({
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: token.raw,
            type: 'text',
            version: 1,
          });
        }
      });
      return textNodes;
    };

    tokens.forEach((token) => {
      if (token.type === 'heading') {
        children.push({
          type: 'heading',
          tag: `h${token.depth}`,
          format: '',
          indent: 0,
          version: 1,
          children: processTextTokens(token.tokens || []),
          direction: 'ltr',
        });
      } else if (token.type === 'paragraph') {
        children.push({
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          children: processTextTokens(token.tokens || []),
          direction: 'ltr',
        });
      } else if (token.type === 'list') {
        const listItems = token.items.map((item: any) => ({
          type: 'listitem',
          value: 1,
          format: '',
          indent: 0,
          version: 1,
          children: processTextTokens(item.tokens?.[0]?.tokens || item.tokens || []),
          direction: 'ltr',
        }));

        children.push({
          type: 'list',
          listType: token.ordered ? 'number' : 'bullet',
          start: 1,
          tag: token.ordered ? 'ol' : 'ul',
          format: '',
          indent: 0,
          version: 1,
          children: listItems,
          direction: 'ltr',
        });
      } else if (token.type === 'space') {
        // ignore
      } else {
        // Fallback to text
        children.push({
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          children: [{
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: token.raw,
            type: 'text',
            version: 1,
          }],
          direction: 'ltr',
        });
      }
    });

    return {
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        children,
        direction: 'ltr',
      },
    };
  } catch (error) {
    console.error('Error parsing markdown to Lexical:', error);
    return null;
  }
}
