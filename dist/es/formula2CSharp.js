import { breakOutRanges } from "./breakOutRanges.js";
import { TOK_TYPE_OPERAND, TOK_SUBTYPE_RANGE, TOK_TYPE_ARGUMENT, TOK_TYPE_FUNCTION, TOK_SUBTYPE_STOP, TOK_SUBTYPE_START } from "./constants.js";
import { formatFormula } from "./formatFormula.js";
const formula2CSharp = function(formula, options) {
  const functionStack = [];
  const tokRender = function(tokenStr, token, indent, lineBreak) {
    let outStr = "";
    const tokenString = tokenStr;
    const directConversionMap = {
      "=": "==",
      "<>": "!=",
      MIN: "Math.min",
      MAX: "Math.max",
      ABS: "Math.abs",
      SUM: "",
      IF: "",
      "&": "+",
      AND: "",
      OR: ""
    };
    const currentFunctionOnStack = functionStack[functionStack.length - 1];
    let useTemplate = false;
    switch (token.type.toString()) {
      case TOK_TYPE_FUNCTION:
        switch (token.subtype) {
          case TOK_SUBTYPE_START:
            functionStack.push({
              name: tokenString,
              argumentNumber: 0
            });
            outStr = typeof directConversionMap[tokenString.toUpperCase()] === "string" ? directConversionMap[tokenString.toUpperCase()] : tokenString;
            useTemplate = true;
            break;
          case TOK_SUBTYPE_STOP:
            useTemplate = true;
            switch (currentFunctionOnStack.name.toLowerCase()) {
              case "if":
                outStr = currentFunctionOnStack.argumentNumber === 1 ? ":0)" : ")";
                useTemplate = false;
                break;
              default:
                outStr = typeof directConversionMap[tokenString.toUpperCase()] === "string" ? directConversionMap[tokenString.toUpperCase()] : tokenString;
                break;
            }
            functionStack.pop();
            break;
        }
        break;
      case TOK_TYPE_ARGUMENT:
        switch (currentFunctionOnStack.name.toLowerCase()) {
          case "if":
            switch (currentFunctionOnStack.argumentNumber) {
              case 0:
                outStr = "?";
                break;
              case 1:
                outStr = ":";
                break;
            }
            break;
          case "sum":
            outStr = "+";
            break;
          case "and":
            outStr = "&&";
            break;
          case "or":
            outStr = "||";
            break;
          default:
            outStr = typeof directConversionMap[tokenString.toUpperCase()] === "string" ? directConversionMap[tokenString.toUpperCase()] : tokenString;
            useTemplate = true;
            break;
        }
        currentFunctionOnStack.argumentNumber += 1;
        break;
      case TOK_TYPE_OPERAND:
        switch (token.subtype) {
          case TOK_SUBTYPE_RANGE:
            if (!currentFunctionOnStack) {
              break;
            }
            switch (currentFunctionOnStack.name.toLowerCase()) {
              case "sum":
                if (RegExp(":", "gi").test(tokenString)) {
                  outStr = breakOutRanges(tokenString, "+");
                } else {
                  outStr = tokenString;
                }
                break;
              case "and":
                if (RegExp(":", "gi").test(tokenString)) {
                  outStr = breakOutRanges(tokenString, "&&");
                } else {
                  outStr = tokenString;
                }
                break;
              case "or":
                if (RegExp(":", "gi").test(tokenString)) {
                  outStr = breakOutRanges(tokenString, "||");
                } else {
                  outStr = tokenString;
                }
                break;
              default:
                if (RegExp(":", "gi").test(tokenString)) {
                  outStr = "[" + breakOutRanges(tokenString, ",") + "]";
                } else {
                  outStr = tokenString;
                }
                break;
            }
            break;
        }
      default:
        if (outStr === "") {
          outStr = typeof directConversionMap[tokenString.toUpperCase()] === "string" ? directConversionMap[tokenString.toUpperCase()] : tokenString;
        }
        useTemplate = true;
        break;
    }
    return {
      tokenString: outStr,
      useTemplate
    };
  };
  const defaultOptions = {
    tmplFunctionStart: "{{token}}(",
    tmplFunctionStop: "{{token}})",
    tmplOperandError: "{{token}}",
    tmplOperandRange: "{{token}}",
    tmplOperandLogical: "{{token}}",
    tmplOperandNumber: "{{token}}",
    tmplOperandText: '"{{token}}"',
    tmplArgument: "{{token}}",
    tmplOperandOperatorInfix: "{{token}}",
    tmplFunctionStartArray: "",
    tmplFunctionStartArrayRow: "{",
    tmplFunctionStopArrayRow: "}",
    tmplFunctionStopArray: "",
    tmplSubexpressionStart: "(",
    tmplSubexpressionStop: ")",
    tmplIndentTab: "	",
    tmplIndentSpace: " ",
    autoLineBreak: "TOK_SUBTYPE_STOP | TOK_SUBTYPE_START | TOK_TYPE_ARGUMENT",
    trim: true,
    customTokenRender: tokRender
  };
  if (options) {
    options = Object.assign({}, defaultOptions, options);
  } else {
    options = defaultOptions;
  }
  const cSharpOutput = formatFormula(formula, options);
  return cSharpOutput;
};
export {
  formula2CSharp
};