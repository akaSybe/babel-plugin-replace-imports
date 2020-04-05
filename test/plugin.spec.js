const babel = require("@babel/core");

const { getErrorMessage, optionLabels, errors } = require("../lib");

const INPUT = `import 'test';`;

function babelTransform(input, options) {
  const babelOptions = { plugins: [["./lib", options]] };

  return babel.transform(input, babelOptions);
}

function expectEqual(actual, expected) {
  expect(actual.replace(/\s+/g, " ").trim()).toBe((expected || "").replace(/\s+/g, " ").trim());
}

describe("Options Tests:", () => {
  it("should throw an error if «test» option is not RegExp", () => {
    expect(() => babelTransform(INPUT, { patterns: [{}] })).toThrowError(
      getErrorMessage(errors.REQUIRED, optionLabels.test),
    );
    expect(() => babelTransform(INPUT, { patterns: [{ test: {} }] })).toThrowError(
      getErrorMessage(errors.MUST_BE_A_REGEX, optionLabels.test),
    );
    expect(() => babelTransform(INPUT, { patterns: [{ test: false }] })).toThrowError(
      getErrorMessage(errors.MUST_BE_A_REGEX, optionLabels.test),
    );
    expect(() => babelTransform(INPUT, { patterns: [{ test: 1 }] })).toThrowError(
      getErrorMessage(errors.MUST_BE_A_REGEX, optionLabels.test),
    );
    expect(() => babelTransform(INPUT, { patterns: [{ test: "index.js" }] })).toThrowError(
      getErrorMessage(errors.MUST_BE_A_REGEX, optionLabels.test),
    );
  });

  it("should throw an error if «replacers» option is not valid", () => {
    expect(() => babelTransform(INPUT, { patterns: [{ test: /.*/g }] })).toThrowError(
      getErrorMessage(errors.REQUIRED, optionLabels.transforms),
    );
    expect(() =>
      babelTransform(INPUT, { patterns: [{ test: /.*/g, transforms: false }] }),
    ).toThrowError(getErrorMessage(errors.MUST_BE_AN_ARRAY, optionLabels.transforms));
  });

  it("«replacers.replacer» option should be string or function", () => {
    expect(() =>
      babelTransform(INPUT, { patterns: [{ test: /.*/g, transforms: [{ replacer: false }] }] }),
    ).toThrowError(getErrorMessage(errors.MUST_BE_A_STRING_OR_FUNCTION, optionLabels.replacer));
    expect(() =>
      babelTransform(INPUT, { patterns: [{ test: /.*/g, transforms: [{ replacer: 1 }] }] }),
    ).toThrowError(getErrorMessage(errors.MUST_BE_A_STRING_OR_FUNCTION, optionLabels.replacer));
    expect(() =>
      babelTransform(INPUT, { patterns: [{ test: /.*/g, transforms: [{ replacer: null }] }] }),
    ).toThrowError(getErrorMessage(errors.MUST_BE_A_STRING_OR_FUNCTION, optionLabels.replacer));
  });

  // it("should pass if «replacer» option is a function", () => {
  //   const options = [
  //     {
  //       test: /.+/g,
  //       replacer: (match) => {
  //         return match;
  //       },
  //     },
  //   ];
  //   assert.equal(babelTransform(options).code, INPUT);
  // });
});

describe("Functionality tests:", () => {
  it("basic transform", () => {
    const input = `import X from 'y';`;
    const expected = `import X from "z";`;
    const options = {
      patterns: [{ test: /y/, transforms: [{ replacer: "z" }] }],
    };
    const output = babelTransform(input, options);
    expect(output.code).toEqual(expected);
  });
  it("multiple transforms", () => {
    const input = `import X from 'y';`;
    const expected = `import X from "foo";\nimport X from "bar";`;
    const options = {
      patterns: [{ test: /y/, transforms: [{ replacer: "foo" }, { replacer: "bar" }] }],
    };
    const output = babelTransform(input, options);
    expect(output.code).toEqual(expected.trim());
  });
  it("multiple patterns", () => {
    const input = `import X from 'x';\nimport Y from 'y'`;
    const expected = `import X from "foo";\nimport Y from "bar";`;
    const options = {
      patterns: [
        { test: /x/, transforms: [{ replacer: "foo" }] },
        { test: /y/, transforms: [{ replacer: "bar" }] },
      ],
    };
    const output = babelTransform(input, options);
    expect(output.code).toEqual(expected.trim());
  });
  it("replace as function", () => {
    const input = `import X from 'y';`;
    const expected = `import X from "foo";`;
    const options = {
      patterns: [{ test: /y/, transforms: [{ replacer: () => "foo" }] }],
    };
    const output = babelTransform(input, options);
    expect(output.code).toEqual(expected.trim());
  });
  // it("should change import type to 'side-effect'", () => {
  //   const input = `import X from "foo";`;
  //   const expected = `import "bar";`;
  //   const options = {
  //     patterns: [{ test: /foo/, transforms: [{ replacer: "bar", sideEffect: true }] }],
  //   };
  //   const output = babelTransform(input, options);
  //   expectEqual(output.code, expected);
  // });
  // it("should change import type to 'named'", () => {
  //   const input = `import { X } from 'y';`;
  //   const expected = `import "y";`;
  //   const options = {
  //     patterns: [{ test: /y/, transforms: [{ replacer: "y", sideEffect: true }] }],
  //   };
  //   const output = babelTransform(input, options);
  //   expect(output.code).toEqual(expected.trim());
  // });
  // it("should change import type to 'default'", () => {
  //   const input = `import { X } from 'y';`;
  //   const expected = `import "y";`;
  //   const options = {
  //     patterns: [{ test: /y/, transforms: [{ replacer: "y", sideEffect: true }] }],
  //   };
  //   const output = babelTransform(input, options);
  //   expect(output.code).toEqual(expected.trim());
  // });
  // it("ati-ui-react: basic", () => {
  //   const input = `import Button from "ati-ui-react/components/Button";`;
  //   const expected = `import Button from "ati-ui-react/unstyled/components/Button";`;
  //   const options = {
  //     patterns: [
  //       {
  //         test: new RegExp("ati-ui-react/(components|widgets|apps)"),
  //         transforms: [{ replacer: "ati-ui-react/unstyled/$1" }],
  //       },
  //     ],
  //   };
  //   const output = babelTransform(input, options);
  //   expect(output.code).toEqual(expected.trim());
  // });
  // it("ati-ui-react: complex", () => {
  //   const input = `import Button from "ati-ui-react/components/Button";`;
  //   const expected =
  //     `import Button from "ati-ui-react/unstyled/components/Button";` +
  //     `\n` +
  //     `import "ati-ui-react/unstyled/components/Button/styles.css";`;
  //   const options = {
  //     patterns: [
  //       {
  //         test: new RegExp("ati-ui-react/(components|widgets|apps)/(.*)"),
  //         transforms: [
  //           { replacer: "ati-ui-react/unstyled/$1/$2" },
  //           {
  //             replacer: "ati-ui-react/unstyled/$1/$2/styles.css",
  //             changeImportTypeTo: "side-effect",
  //           },
  //         ],
  //       },
  //     ],
  //   };
  //   const output = babelTransform(input, options);
  //   expect(output.code).toEqual(expected.trim());
  // });
});
