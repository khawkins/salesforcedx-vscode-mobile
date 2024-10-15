/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { Diagnostic } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

export interface DiagnosticProducer<T> {
    /**
     * Validate the parsed text document as astNode and return a list of diagnostics.
     * @param textDocument the language server text document
     * @param astNode parsed astNode for document body
     * @returns An array of diagnostics found within ast node
     */
    validateDocument(
        textDocument: TextDocument,
        astNode: T
    ): Promise<Diagnostic[]>;
}