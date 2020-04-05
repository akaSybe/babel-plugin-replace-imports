module.exports = (wallaby) => {
  return {
    files: [{ pattern: "package.json", instrument: false }, "lib/**/*.js"],
    tests: ["test/**/*.spec.js"],
    env: {
      type: "node",
    },
    compilers: {
      "**/*.js": wallaby.compilers.babel(),
    },
    hints: {
      allowIgnoringCoverageInTests: true,
      ignoreCoverage: /istanbul ignore next/,
    },
    testFramework: "jest",
  };
};
