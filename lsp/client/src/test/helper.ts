/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import * as vscode from 'vscode';
import * as path from 'path';

export let doc: vscode.TextDocument;
export let editor: vscode.TextEditor;

export async function activate(docUri: vscode.Uri) {
    const extension = vscode.extensions.getExtension(
        'salesforcedx-vscode-mobile'
    );
    await extension.activate();
    try {
        doc = await vscode.workspace.openTextDocument(docUri);
        editor = await vscode.window.showTextDocument(doc);
        await sleep(2000);
    } catch (e) {
        console.error(e);
    }
}

export function getDocPath(docName: string) {
    return path.resolve(__dirname, '../../testFixure', docName);
}

export function getDocUri(docName: string) {
    return vscode.Uri.file(getDocPath(docName));
}

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
