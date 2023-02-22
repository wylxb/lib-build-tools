import minimist from 'minimist';
import {RollupOptions} from 'rollup';

export const getConfig = () => {
    const config = minimist(process.argv);
    const options: RollupOptions & {input?: string} = {};

    if (config.i) {
        options.input = config.i;
    }

    return options;
};
