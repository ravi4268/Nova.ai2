const test = require('node:test');
const assert = require('node:assert/strict');

const { findImage } = require('./imageParser');

test('findImage extracts base64 data from Gemini inlineData response', () => {
  const response = {
    candidates: [
      {
        content: {
          parts: [
            { text: 'Here is the transformed image.' },
            {
              inlineData: {
                mimeType: 'image/png',
                data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB4L',
              },
            },
          ],
        },
      },
    ],
  };

  const image = findImage(response);

  assert.ok(image);
  assert.equal(image.mimeType, 'image/png');
  assert.equal(image.data, 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB4L');
});
