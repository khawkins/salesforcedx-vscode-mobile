/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { LandingPageWebviewProvider } from './commands/landingPageCommand2';
import { TemplateChooserCommand } from './commands/templateChooserCommand';
import { BriefcaseCommand } from './commands/briefcaseCommand';
import { DeployToOrgCommand } from './commands/deployToOrgCommand';
import { ConfigureProjectCommand } from './commands/configureProjectCommand';
import { AuthorizeCommand } from './commands/authorizeCommand';
import { InstructionsWebviewProvider } from './webviews';

const wizardCommand = 'salesforcedx-vscode-offline-app.onboardingWizard';
const onboardingWizardStateKey =
    'salesforcedx-vscode-offline-app.onboardingWizard.projectCreationState';
const landingPageCommand = 'salesforcedx-vscode-offline-app.landingPage';

enum OnboardingWizardState {
    projectConfigured
}

async function runPostProjectConfigurationSteps(
    extensionUri: vscode.Uri
): Promise<void> {
    return new Promise(async (resolve) => {
        await AuthorizeCommand.authorizeToOrg();
        await BriefcaseCommand.setupBriefcase(extensionUri);
        await TemplateChooserCommand.copyDefaultTemplate(extensionUri);

        await AuthorizeCommand.authorizeToOrg();
        await DeployToOrgCommand.deployToOrg();

        await InstructionsWebviewProvider.showDismissableInstructions(
            extensionUri,
            vscode.l10n.t('View in the Salesforce Mobile App'),
            'resources/instructions/salesforcemobileapp.html'
        );
        return resolve();
    });
}

export function activate(context: vscode.ExtensionContext) {
    // If activation is coming as the result of the project being newly
    // loaded into the workspace, pick up with the next step of the wizard.
    const isPostProjectConfiguration =
        context.globalState.get(onboardingWizardStateKey) ===
        OnboardingWizardState.projectConfigured;
    if (isPostProjectConfiguration) {
        context.globalState.update(onboardingWizardStateKey, undefined);
        vscode.commands.executeCommand(wizardCommand, true);
    }
    vscode.commands.registerCommand(
        wizardCommand,
        async (fromPostProjectConfiguration: boolean = false) => {
            if (fromPostProjectConfiguration) {
                await runPostProjectConfigurationSteps(context.extensionUri);
            } else {
                const projectDir = await new ConfigureProjectCommand(
                    context.extensionUri
                ).configureProject();
                if (!projectDir) {
                    // No directory selected. Do not continue.
                    return Promise.resolve();
                } else if (
                    vscode.workspace.workspaceFolders &&
                    vscode.workspace.workspaceFolders.length > 0 &&
                    vscode.workspace.workspaceFolders[0].uri.fsPath ===
                        projectDir
                ) {
                    // Selected folder is already loaded into the workspace.
                    // Run the next steps directly, because the workspace will
                    // not reload in this case.
                    await runPostProjectConfigurationSteps(
                        context.extensionUri
                    );
                } else {
                    // Different project folder from what's currently loaded
                    // into the workspace. The workspace will reload,
                    // and we need to set a breadcrumb to pick up with the
                    // next steps, after it does.
                    context.globalState.update(
                        onboardingWizardStateKey,
                        OnboardingWizardState.projectConfigured
                    );
                }
            }
        }
    );

    vscode.commands.registerCommand(landingPageCommand, async () => {
        const landingPageProvider = new LandingPageWebviewProvider(
            context.extensionUri
        );
        landingPageProvider.showLandingPageWebview();
    });
}

// This method is called when your extension is deactivated
export function deactivate() {}
