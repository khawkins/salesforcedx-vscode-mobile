/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const LANDING_PAGE_VIEW_PATH = 'resources/instructions/landingPageView.html';
const LANDING_PAGE_VIEW_TITLE = 'Landing Page Configuration';
const JS_CONTROLLER_PATH = 'resources/instructions/landingPageController.js';
const JS_CONTROLLER_PATH_DEMARCATOR = '--- LANDING_PAGE_CONTROLLER_SRC ---';
const LANDING_PAGE_VIEW_TYPE = 'landingPageView';
const STATIC_RESOURCES_PATH = '/force-app/main/default/staticresources';
const LANDING_PAGE_FILENAME = 'landing_page_default.json';
const LANDING_PAGE_TEMPLATE_PATH = 'resources/landing_page_template.json';

export class LandingPageWebviewProvider {
    extensionUri: vscode.Uri;

    constructor(extensionUri: vscode.Uri) {
        this.extensionUri = extensionUri;
    }

    public showLandingPageWebview() {
        const panel = vscode.window.createWebviewPanel(
            LANDING_PAGE_VIEW_TYPE,
            LANDING_PAGE_VIEW_TITLE,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [this.extensionUri]
            }
        );

        // panel.webview.onDidReceiveMessage((data) => {
        //     const clickedButtonId = data.button;
        //     const buttonAction = buttonActions.find((action) => {
        //         return action.buttonId === clickedButtonId;
        //     });
        //     if (buttonAction) {
        //         buttonAction.action(panel);
        //     }
        // });

        const localeContentPath = this.getLocaleContentPath(
            this.extensionUri,
            LANDING_PAGE_VIEW_PATH
        );
        const htmlPath = vscode.Uri.joinPath(
            this.extensionUri,
            localeContentPath
        );
        const jsControllerPath = vscode.Uri.joinPath(
            this.extensionUri,
            JS_CONTROLLER_PATH
        );

        let webviewContent = fs.readFileSync(htmlPath.fsPath, {
            encoding: 'utf-8'
        });
        webviewContent = webviewContent.replace(
            JS_CONTROLLER_PATH_DEMARCATOR,
            panel.webview.asWebviewUri(jsControllerPath).toString()
        );
        panel.webview.html = webviewContent;

        // Load the default landing page into the webview.
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            const workspacePath = workspaceFolders[0].uri.fsPath;
            const landingPagePath = path.join(
                workspacePath,
                STATIC_RESOURCES_PATH,
                LANDING_PAGE_FILENAME
            );
            const landingPageTemplatePath = vscode.Uri.joinPath(
                this.extensionUri,
                LANDING_PAGE_TEMPLATE_PATH
            ).fsPath;
            const existingPath = fs.existsSync(landingPagePath)
                ? landingPagePath
                : landingPageTemplatePath;
            const landingPageJsonString = fs.readFileSync(existingPath, {
                encoding: 'utf-8'
            });
            panel.webview.postMessage({
                command: 'importLandingPage',
                payload: JSON.parse(landingPageJsonString)
            });
        }
    }

    /**
     * Check to see if a locale-specific file exists, otherwise return the default.
     * @param extensionUri Uri representing the path to this extension, supplied by vscode.
     * @param contentPath The relative path (and filename) of the content to display.
     */
    getLocaleContentPath(
        extensionUri: vscode.Uri,
        contentPath: string
    ): string {
        const language = vscode.env.language;

        // check to see if a file exists for this locale.
        const localeContentPath = contentPath.replace(
            /\.html$/,
            `.${language}.html`
        );

        const fullPath = vscode.Uri.joinPath(extensionUri, localeContentPath);

        if (fs.existsSync(fullPath.fsPath)) {
            // a file exists for this locale, so return it instead.
            return localeContentPath;
        } else {
            // fall back
            return contentPath;
        }
    }
}
