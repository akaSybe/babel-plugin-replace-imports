import isEmpty from "lodash.isempty";
import isString from "lodash.isstring";
import isRegExp from "lodash.isregexp";
import isObject from "lodash.isobject";
import isFunction from "lodash.isfunction";
import { addSideEffect, addNamed, addDefault } from "@babel/helper-module-imports";

const PLUGIN = "babel-plugin-transform-imports";

export const errors = {
  REQUIRED: 0,
  MUST_BE_A_REGEX: 1,
  MUST_BE_A_STRING_OR_FUNCTION: 3,
  MUST_BE_AN_OBJECT: 4,
  MUST_BE_AN_ARRAY: 5,
};

const errorMessages = {
  0: "required.",
  1: "option must be a RegExp.",
  2: "option must be a String or a Function",
  3: "option must be an Object or Array",
};

export const optionLabels = {
  test: "test",
  transforms: "transforms",
  replacer: "replacer",
};

export function getErrorMessage(code, text, plural = false) {
  const msg = `${text ? `«${text}»` : ""} ${plural ? "are" : "is"} ${errorMessages[code]}`.trim();
  return `\n${PLUGIN}: ${msg}`;
}

function throwError(code, text) {
  const msg = getErrorMessage(code, text);
  console.log("message", msg, code, text);
  throw new Error(msg);
}

const defaultOptions = {
  patterns: [],
};

export default function ({ types }) {
  const options = {};

  return {
    name: PLUGIN,
    visitor: {
      Program: function (path, { opts }) {
        Object.assign(options, defaultOptions, opts);

        options.patterns.forEach((pattern) => {
          // validates 'test' option
          if (typeof pattern.test === "undefined") throwError(errors.REQUIRED, optionLabels.test);
          if (!isRegExp(pattern.test)) throwError(errors.MUST_BE_A_REGEX, optionLabels.test);
          // validates 'replacers' option
          if (typeof pattern.transforms === "undefined" || typeof pattern.transforms === "null")
            throwError(errors.REQUIRED, optionLabels.transforms);

          if (!Array.isArray(pattern.transforms)) {
            throwError(errors.MUST_BE_AN_ARRAY, optionLabels.transforms);
          }

          pattern.transforms.forEach((transform) => {
            if (!isString(transform.replacer) && !isFunction(transform.replacer)) {
              throwError(errors.MUST_BE_A_STRING_OR_FUNCTION, optionLabels.replacer);
            }
          });
        });
      },
      ImportDeclaration: (path, { opts }) => {
        if (path.node.__processed) return;

        const transforms = [];
        const source = path.node.source.value;

        options.patterns.forEach((pattern) => {
          const regex = pattern.test;
          if (regex.test(source)) {
            pattern.transforms.forEach((transform) => {
              let importDeclaration;
              const newImportType = transform.changeImportTypeTo || "initial";
              console.log(newImportType);
              const newSource = source.replace(regex, transform.replacer);
              if (newImportType === "side-effect") {
                console.log(newSource);
                addSideEffect(path, newSource);
                console.log(importDeclaration);
                // } else if (newImportType === "named") {
                //   importDeclaration = addNamed(path, path.node.source.name, newSource);
                // } else if (newImportType === "default") {
                //   importDeclaration = addDefault(path, newSource);
              } else {
                importDeclaration = types.importDeclaration(
                  path.node.specifiers,
                  types.stringLiteral(newSource),
                );
                importDeclaration.__processed = true;
                transforms.push(importDeclaration);
              }
            });
          }
        });

        if (transforms.length > 0) {
          path.replaceWithMultiple(transforms);
        }
      },
    },
  };
}
