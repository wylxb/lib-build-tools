module.exports = {
    extends: [
        '@ecomfe/eslint-config/strict',
        '@ecomfe/eslint-config/import/strict',
        '@ecomfe/eslint-config/typescript/strict',
    ],
    ignorePatterns: [
        'bin/*.js',
        'lib/**/*.js',
    ],
};
