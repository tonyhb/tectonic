var compile = require("babel-register");

module.exports = function() {
  return compile.apply(this, {
    // Setting this will remove the currently hooked extensions of .es6, `.es`, `.jsx`
    // and .js so you'll have to add them back if you want them to be used again.
    extensions: [".es6", ".es", ".jsx", ".js"],
    plugins: ["transform-flow-strip-types", "syntax-flow"],
  });
};
