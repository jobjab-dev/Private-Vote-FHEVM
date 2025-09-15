module.exports = {
  semi: true,
  trailingComma: "es5",
  singleQuote: false,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  arrowParens: "always",
  endOfLine: "lf",
  overrides: [
    {
      files: "*.sol",
      options: {
        printWidth: 120,
        tabWidth: 4,
        singleQuote: false,
      },
    },
    {
      files: "*.md",
      options: {
        printWidth: 80,
        proseWrap: "preserve",
      },
    },
  ],
};