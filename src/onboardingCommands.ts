/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { CommonUtils } from '@salesforce/lwc-dev-mobile-core/lib/common/CommonUtils';
import { InstructionsWebviewProvider } from './webviews';
import { messages } from './messages/messages';
import { OrgUtils } from './utils';

export class OnboardingCommands {
    public static async configureProject(
        fromWizard: boolean = false
    ): Promise<string> {
        return new Promise(async (resolve, reject) => {
            const header: vscode.QuickPickOptions = {
                placeHolder: 'Create a new project, or open an existing project'
            };
            const items: vscode.QuickPickItem[] = [
                {
                    label: 'Create New Project...',
                    description:
                        'Creates a new local project configured with the Offline Starter Kit'
                },
                {
                    label: 'Open Existing Project...',
                    description:
                        'Opens an existing local project configured with the Offline Starter Kit'
                }
            ];
            const selected = await vscode.window.showQuickPick(items, header);
            if (!selected) {
                return resolve('');
            }

            if (selected.label === 'Create New Project...') {
                const folderUri = await vscode.window.showOpenDialog({
                    openLabel: 'Select project folder',
                    canSelectFolders: true,
                    canSelectFiles: false,
                    canSelectMany: false
                });
                if (!folderUri || folderUri.length === 0) {
                    return resolve('');
                }

                let infoMessage =
                    'Follow the prompts to configure the project.';
                if (fromWizard) {
                    infoMessage +=
                        ' NOTE: after the project is loaded, please be patient while the wizard resumes.';
                }
                await vscode.window.showInformationMessage(infoMessage, {
                    title: 'OK'
                });
                const githubRepoUri: string =
                    'https://github.com/salesforce/offline-app-developer-starter-kit.git';
                try {
                    await vscode.commands.executeCommand(
                        'git.clone',
                        githubRepoUri,
                        folderUri[0].fsPath
                    );
                    return resolve(folderUri[0].fsPath);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to clone: ${error}`);
                    return reject(error);
                }
            } else if (selected.label === 'Open Existing Project...') {
                console.log('Open existing project');
                return resolve('');
            } else {
                return resolve('');
            }
        });
    }

    public static async deploy(): Promise<void> {
        const currentWorkspace = vscode.workspace;
        if (!currentWorkspace.workspaceFolders) {
            await vscode.window.showErrorMessage(
                'There are no workspace folders defined in your project.',
                { title: 'OK' }
            );
            return Promise.reject(new Error("No workspace defined in the project"));
        }

        const result = await vscode.window.showInformationMessage(
            'Do you want to deploy to an Org?',
            { title: 'Deploy' },
            { title: 'Skip' }
        );

        if (result) {
            if (result.title === 'Deploy') {

                const user = await OrgUtils.getDefaultUser();

                // Check if authorized
                if (user !== 'undefined') {
                    const aaa = currentWorkspace.workspaceFolders!;
                    const workspaceFolderPath = aaa[0].uri.fsPath;
                    const forceAppPath = path.join(workspaceFolderPath, 'force-app');
                    const forceAppUri = vscode.Uri.file(forceAppPath);
                    await vscode.commands.executeCommand(
                        'sfdx.force.source.deploy.source.path',
                        forceAppUri
                    );
                    console.log('foo');
                } else {
                    OnboardingCommands.authorizeOrg()
                        .then(async ()=>{
                            const aaa = currentWorkspace.workspaceFolders!;
                    const workspaceFolderPath = aaa[0].uri.fsPath;
                            //const workspaceFolderPath = currentWorkspace.workspaceFolders[0].uri.fsPath;
                            const forceAppPath = path.join(workspaceFolderPath, 'force-app');
                            const forceAppUri = vscode.Uri.file(forceAppPath);
                            await vscode.commands.executeCommand(
                                'sfdx.force.source.deploy.source.path',
                                forceAppUri
                            );
                            console.log('bar');
                        })
                        .catch(()=>{

                        });
                    // await vscode.commands.executeCommand(
                    //     'sfdx.force.auth.web.login'
                    // );
                    // await vscode.window.showInformationMessage(
                    //     "Once you've authorized your Org, click here to continue.",
                    //     { title: 'OK' }
                    // );
                }
                
            }
            return Promise.resolve();
        } else {
            return Promise.resolve();
        }
    }

    public static async authorizeOrg(): Promise<void> {
        const result = await vscode.window.showInformationMessage(
            'Do you want to authorize an Org?',
            { title: 'Authorize' }
            ,{ title: 'Skip' }
        );

        if (result && result.title === 'Authorize') {
            await vscode.commands.executeCommand(
                'sfdx.force.auth.web.login'
            );
            await vscode.window.showInformationMessage(
                "Once you've authorized your Org, click here to continue.",
                { title: 'OK' }
            );
            return Promise.resolve();
        } else {
            return Promise.reject();
        }
    }

    public static async setupBriefcase(
        extensionUri: vscode.Uri
    ): Promise<void> {
        await vscode.window.showInformationMessage(
            'Click OK to launch your org to the Briefcase Builder page. After ' +
                'launching, return here for instructions to set up a Briefcase rule.',
            { title: 'OK' }
        );

        // // TODO: this `withProgress` call probably needs tweaking on UX.
        // await vscode.window.withProgress(
        //     {
        //         location: vscode.ProgressLocation.Notification,
        //         title: 'Launching Briefcase Builder...'
        //     },
        //     async (progress, token) => {
        //         await CommonUtils.executeCommandAsync(
        //             "sfdx org open -p '/lightning/setup/Briefcase/home'"
        //         );
        //     }
        // );

        // InstructionsWebviewProvider.showDismissableInstructions(
        //     extensionUri,
        //     messages.getMessage('briefcase_setup_instruction'),
        //     'src/instructions/briefcase.html'
        // );

        const user = await OrgUtils.getDefaultUser();

        // Check if authorized
        if (user !== 'undefined') {
            InstructionsWebviewProvider.showDismissableInstructions(
                extensionUri,
                messages.getMessage('briefcase_setup_instruction'),
                'src/instructions/briefcase.html'
            );
        } else {
            OnboardingCommands.authorizeOrg()
                .then(async ()=>{
                    // TODO: this `withProgress` call probably needs tweaking on UX.
                    await vscode.window.withProgress(
                        {
                            location: vscode.ProgressLocation.Notification,
                            title: 'Launching Briefcase Builder...'
                        },
                        async (progress, token) => {
                            await CommonUtils.executeCommandAsync(
                                "sfdx org open -p '/lightning/setup/Briefcase/home'"
                            );
                        }
                    );

                    InstructionsWebviewProvider.showDismissableInstructions(
                        extensionUri,
                        messages.getMessage('briefcase_setup_instruction'),
                        'src/instructions/briefcase.html'
                    );
                })
                .catch(()=>{
                    console.error('aaa');
                });
            
        }
    }
}
