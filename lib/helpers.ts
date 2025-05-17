export const bristolScoreToImage = (score: number) => {
  switch (score) {
    case 0:
      return require('~/assets/bristol/1.webp');
    case 1:
      return require('~/assets/bristol/1.webp');
    case 2:
      return require('~/assets/bristol/2.webp');
    case 3:
      return require('~/assets/bristol/3.webp');
    case 4:
      return require('~/assets/bristol/4.webp');
    case 5:
      return require('~/assets/bristol/5.webp');
    case 6:
      return require('~/assets/bristol/6.webp');
    case 7:
      return require('~/assets/bristol/7.webp');
  }
};
