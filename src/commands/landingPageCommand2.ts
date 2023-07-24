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
const LANDING_PAGE_FILENAME = 'landing_page.json';
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

        panel.webview.onDidReceiveMessage((data) => {
            if (data.openTemplateId) {
                const landingPageFilename = `landing_page_${data.openTemplateId}.json`;
                const landingPageJsonString =
                    this.getLandingPageContent(landingPageFilename)!;
                panel.webview.postMessage({
                    command: 'importLandingPage',
                    payload: JSON.parse(landingPageJsonString)
                });
            } else if (data.saveLandingPage) {
                const landingPagePath = this.getLandingPageContentPath(
                    LANDING_PAGE_FILENAME
                );
                if (landingPagePath) {
                    fs.writeFileSync(
                        landingPagePath,
                        JSON.stringify(data.saveLandingPage, null, 2)
                    );
                }
                panel.dispose();
            }
        });

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

        // Load the configured landing page into the webview, or an empty
        // configuration if landing_page.json is not configured.
        const landingPageTemplatePath = vscode.Uri.joinPath(
            this.extensionUri,
            LANDING_PAGE_TEMPLATE_PATH
        ).fsPath;
        let landingPageJsonString = this.getLandingPageContent(
            LANDING_PAGE_FILENAME
        );
        if (landingPageJsonString === null) {
            landingPageJsonString = fs.readFileSync(landingPageTemplatePath, {
                encoding: 'utf-8'
            });
        }

        panel.webview.postMessage({
            command: 'importLandingPage',
            payload: JSON.parse(landingPageJsonString)
        });
    }

    getLandingPageContentPath(landingPageFilename: string): string | null {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            const workspacePath = workspaceFolders[0].uri.fsPath;
            return path.join(
                workspacePath,
                STATIC_RESOURCES_PATH,
                landingPageFilename
            );
        } else {
            return null;
        }
    }

    getLandingPageContent(landingPageFilename: string): string | null {
        const landingPagePath =
            this.getLandingPageContentPath(landingPageFilename);
        if (landingPagePath && fs.existsSync(landingPagePath)) {
            return fs.readFileSync(landingPagePath, {
                encoding: 'utf-8'
            });
        } else {
            return null;
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
