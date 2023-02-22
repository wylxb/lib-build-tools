require('@reskript/config-lint/patch');

module.exports = {
    extends: [
        require.resolve('@reskript/config-lint/config/eslint'),
    ],
    rules: {
        'no-underscore-dangle': 0,
    },
    ignorePatterns: [
        '**/lib/**/*.*',
    ],
};
