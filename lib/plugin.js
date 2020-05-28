"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebExtWebpackPlugin = void 0;
const web_ext_1 = require("web-ext");
const PLUGIN_NAME = 'WebExtWebpackPlugin';
class WebExtWebpackPlugin {
    constructor(options) {
        this.options = options || {};
        this.extensionRunner = null;
        this.watchEnabled = false;
    }
    apply(compiler) {
        compiler.hooks.watchRun.tap(PLUGIN_NAME, this.onWatchRun.bind(this));
        compiler.hooks.watchClose.tap(PLUGIN_NAME, this.onWatchClose.bind(this));
        compiler.hooks.afterEmit.tapAsync(PLUGIN_NAME, this.onAfterEmitAsync.bind(this));
    }
    onWatchRun() {
        this.watchEnabled = true;
    }
    onWatchClose() {
        this.extensionRunner.exit();
    }
    onAfterEmitAsync(compilation, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const outputPath = compilation.outputOptions.path;
            if (yield this.lintAsync(compilation, outputPath)) {
                callback();
                return;
            }
            if (this.watchEnabled)
                yield this.runAsync(outputPath);
            else
                yield this.buildAsync(outputPath);
            if (compilation.compiler.options.mode === 'production' && this.options.sign)
                yield this.signAsync(outputPath);
            callback();
        });
    }
    parseLinter(linterMessages) {
        const messages = {};
        for (const message of linterMessages) {
            if (!messages[message.code])
                messages[message.code] = [];
            messages[message.code].push(`[${message.code}]: ${message.message}`);
        }
        return messages;
    }
    buildAsync(outputPath) {
        return __awaiter(this, void 0, void 0, function* () {
            yield web_ext_1.default.cmd.build(Object.assign({ sourceDir: outputPath, overwriteDest: true }, this.options.build), {
                showReadyMessage: false,
                shouldExitProgram: false,
            });
        });
    }
    lintAsync(compilation, outputPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const linter = yield web_ext_1.default.cmd.lint(Object.assign({ sourceDir: outputPath, output: 'none' }, this.options.lint), { shouldExitProgram: false });
            const errors = this.parseLinter(linter.errors);
            const warnings = Object.assign(Object.assign({}, this.parseLinter(linter.warnings)), this.parseLinter(linter.notices));
            for (const [key, value] of Object.entries(errors)) {
                let errorMessage = value.join('\n\t');
                if (key === 'JSON_INVALID')
                    errorMessage = `manifest.json\n\t${errorMessage}`;
                compilation.errors.push(new Error(errorMessage));
            }
            for (const [key, value] of Object.entries(warnings)) {
                let errorMessage = value.join('\n\t');
                if (key === 'JSON_INVALID')
                    errorMessage = `manifest.json\n\t${errorMessage}`;
                compilation.warnings.push(errorMessage);
            }
            return linter.errors.count === 0;
        });
    }
    runAsync(outputPath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.extensionRunner) {
                yield this.extensionRunner.reloadExtensionBySourceDir(outputPath);
                return;
            }
            this.extensionRunner = yield web_ext_1.default.cmd.run(Object.assign(Object.assign({ sourceDir: outputPath, browserConsole: true }, this.options.run), { noInput: true, noReload: true }), {
                shouldExitProgram: false,
                reloadStrategy: null,
            });
            console.log(`Automatic extension reloading are handled now by ${PLUGIN_NAME} plugin.`);
        });
    }
    signAsync(outputPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const signResult = yield web_ext_1.default.cmd.sign(Object.assign({ sourceDir: outputPath }, this.options.sign), {
                showReadyMessage: false,
                shouldExitProgram: false,
            });
            return signResult.success;
        });
    }
}
exports.WebExtWebpackPlugin = WebExtWebpackPlugin;
