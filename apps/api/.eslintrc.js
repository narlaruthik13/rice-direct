module.exports = {
  root: true,
  extends: [require.resolve("@kisa/config/eslint/node")],
  overrides: [{ files: ["test/**/*.ts"], env: { jest: true } }],
};
