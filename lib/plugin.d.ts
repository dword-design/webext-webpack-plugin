import { Compiler, Plugin } from 'webpack';
import { WebExtWebpackPluginOptions } from './options';
export declare class WebExtWebpackPlugin implements Plugin {
    private options;
    private extensionRunner;
    private watchEnabled;
    constructor(options?: WebExtWebpackPluginOptions);
    apply(compiler: Compiler): void;
    private onWatchRun;
    private onWatchClose;
    private onAfterEmitAsync;
    private parseLinter;
    private buildAsync;
    private lintAsync;
    private runAsync;
    private signAsync;
}
